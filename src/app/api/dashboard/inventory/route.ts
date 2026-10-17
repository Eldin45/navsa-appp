import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

// ============================================================
// SCHEMAS
// ============================================================

const createSchema = z.object({
  item_name: z.string().min(2),
  item_type: z.string().min(2),
  item_code: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  manufacturer: z.string().optional().or(z.literal("")),
  unit_type: z.string().min(1),
  unit_cost: z.coerce.number().nonnegative().optional(),
  currency: z.string().default("NGN"),
  current_stock: z.coerce.number().nonnegative().default(0),
  min_stock: z.coerce.number().nonnegative().optional(),
  reorder_point: z.coerce.number().nonnegative().optional(),
  storage_requirements: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

// ============================================================
// HELPERS
// ============================================================

async function resolveSupplierProfile(userId: string) {
  const profile = await prisma.supplierProfile.findUnique({
    where: { userId },
    select: { id: true, business_name: true },
  });
  if (!profile) {
    throw new Error("Supplier profile not found");
  }
  return profile;
}

// ============================================================
// GET — list inventory
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPPLIER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const supplier = await resolveSupplierProfile(user.id);

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const category = sp.get("category") ?? "ALL";
    const type = sp.get("type") ?? "ALL";
    const active = sp.get("active");
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { supplierId: supplier.id };
    if (search) {
      where.OR = [
        { item_name: { contains: search } },
        { item_code: { contains: search } },
        { manufacturer: { contains: search } },
      ];
    }
    if (category !== "ALL") where.category = category;
    if (type !== "ALL") where.item_type = type;
    if (active === "true") where.is_active = true;
    if (active === "false") where.is_active = false;

    const [total, items, categoriesRaw, typesRaw, stats] = await Promise.all([
      prisma.inputInventory.count({ where }),
      prisma.inputInventory.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          item_type: true,
          item_name: true,
          item_code: true,
          description: true,
          manufacturer: true,
          unit_type: true,
          unit_cost: true,
          currency: true,
          current_stock: true,
          min_stock: true,
          reorder_point: true,
          storage_requirements: true,
          category: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.inputInventory.findMany({
        where: { supplierId: supplier.id, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.inputInventory.findMany({
        where: { supplierId: supplier.id },
        select: { item_type: true },
        distinct: ["item_type"],
      }),
      prisma.inputInventory.aggregate({
        where: { supplierId: supplier.id, is_active: true },
        _count: { _all: true },
        _sum: { current_stock: true },
      }),
    ]);

    // Low stock items count
    const allItems = await prisma.inputInventory.findMany({
      where: { supplierId: supplier.id, is_active: true },
      select: { current_stock: true, reorder_point: true, min_stock: true },
    });
    const lowStockCount = allItems.filter((i) => {
      const threshold = i.reorder_point ?? i.min_stock;
      return threshold != null && i.current_stock <= threshold;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((i) => ({
          id: i.id,
          itemType: i.item_type,
          itemName: i.item_name,
          itemCode: i.item_code,
          description: i.description,
          manufacturer: i.manufacturer,
          unitType: i.unit_type,
          unitCost: i.unit_cost,
          currency: i.currency,
          currentStock: i.current_stock,
          minStock: i.min_stock,
          reorderPoint: i.reorder_point,
          storageRequirements: i.storage_requirements,
          category: i.category,
          isActive: i.is_active,
          createdAt: i.created_at.toISOString(),
          updatedAt: i.updated_at.toISOString(),
          isLowStock:
            (i.reorder_point != null || i.min_stock != null) &&
            i.current_stock <= (i.reorder_point ?? i.min_stock ?? 0),
        })),
        categories: categoriesRaw
          .map((c) => c.category)
          .filter((c): c is string => !!c),
        types: typesRaw.map((t) => t.item_type),
        summary: {
          totalItems: stats._count._all,
          totalStock: Number(stats._sum.current_stock ?? 0),
          lowStockCount,
        },
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      },
    });
  } catch (err: any) {
    console.error("[/api/dashboard/inventory] GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — create inventory item
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPPLIER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const supplier = await resolveSupplierProfile(user.id);

    const body = await req.json();
    const data = createSchema.parse(body);

    // Unique item_code if provided
    if (data.item_code) {
      const existingCode = await prisma.inputInventory.findUnique({
        where: { item_code: data.item_code },
      });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: "Item code already in use" },
          { status: 409 }
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.inputInventory.create({
        data: {
          supplierId: supplier.id,
          item_name: data.item_name.trim(),
          item_type: data.item_type.trim(),
          item_code: data.item_code || null,
          description: data.description || null,
          manufacturer: data.manufacturer || null,
          unit_type: data.unit_type,
          unit_cost: data.unit_cost ?? null,
          currency: data.currency,
          current_stock: data.current_stock,
          min_stock: data.min_stock ?? null,
          reorder_point: data.reorder_point ?? null,
          storage_requirements: data.storage_requirements || null,
          category: data.category || null,
          is_active: data.is_active,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_INVENTORY_ITEM",
          entity_type: "INPUT_INVENTORY",
          entity_id: item.id,
          new_values: JSON.stringify({
            item_name: item.item_name,
            unit_cost: item.unit_cost,
            current_stock: item.current_stock,
          }),
          success: true,
        },
      });

      return item;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          itemName: created.item_name,
          itemCode: created.item_code,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/inventory] POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to create item" },
      { status: 400 }
    );
  }
}