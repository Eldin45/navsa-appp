import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const orgId = user.organizationId ?? "__none__";

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const type = sp.get("type") ?? "ALL";
    const category = sp.get("category") ?? "ALL";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    // Suppliers in the same organization as the farmer.
    // The SupplierProfile can be tied to an org directly or through its user.
    const supplierProfileIds = await prisma.supplierProfile.findMany({
      where: {
        OR: [
          { organizationId: orgId },
          { user: { organizationId: orgId } },
        ],
        verified: true,
      },
      select: { id: true },
    });

    const ids = supplierProfileIds.map((s) => s.id);

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          categories: [],
          types: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 1,
          },
        },
      });
    }

    const where: any = {
      supplierId: { in: ids },
      is_active: true,
    };
    if (type !== "ALL") where.item_type = type;
    if (category !== "ALL") where.category = category;
    if (search) {
      where.OR = [
        { item_name: { contains: search } },
        { item_code: { contains: search } },
        { manufacturer: { contains: search } },
      ];
    }

    const [total, items, categoriesRaw, typesRaw] = await Promise.all([
      prisma.inputInventory.count({ where }),
      prisma.inputInventory.findMany({
        where,
        orderBy: [{ item_name: "asc" }],
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
          category: true,
          storage_requirements: true,
          is_active: true,
          supplier: {
            select: {
              id: true,
              business_name: true,
              verified: true,
              delivery_regions: true,
              user: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.inputInventory.findMany({
        where: {
          supplierId: { in: ids },
          is_active: true,
          category: { not: null },
        },
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.inputInventory.findMany({
        where: { supplierId: { in: ids }, is_active: true },
        select: { item_type: true },
        distinct: ["item_type"],
      }),
    ]);

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
          category: i.category,
          storageRequirements: i.storage_requirements,
          isActive: i.is_active,
          supplier: {
            id: i.supplier.id,
            businessName: i.supplier.business_name,
            verified: i.supplier.verified,
            deliveryRegions: i.supplier.delivery_regions,
            contactName: i.supplier.user?.full_name ?? null,
            contactEmail: i.supplier.user?.email ?? null,
          },
        })),
        categories: categoriesRaw
          .map((c) => c.category)
          .filter((c): c is string => !!c),
        types: typesRaw.map((t) => t.item_type),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      },
    });
  } catch (err: any) {
    console.error("[/api/dashboard/inputs] GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}