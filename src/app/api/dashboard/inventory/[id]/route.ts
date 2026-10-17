import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  item_name: z.string().min(2).optional(),
  item_type: z.string().min(2).optional(),
  item_code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  unit_type: z.string().min(1).optional(),
  unit_cost: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  current_stock: z.coerce.number().nonnegative().optional(),
  min_stock: z.coerce.number().nonnegative().nullable().optional(),
  reorder_point: z.coerce.number().nonnegative().nullable().optional(),
  storage_requirements: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

async function assertOwnership(itemId: string, userId: string) {
  const item = await prisma.inputInventory.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      supplierId: true,
      supplier: { select: { userId: true } },
    },
  });
  if (!item) throw new Error("Not found");
  if (item.supplier.userId !== userId) throw new Error("Forbidden");
  return item;
}

// ============================================================
// GET — single
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPPLIER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await assertOwnership(id, user.id);

    const item = await prisma.inputInventory.findUnique({
      where: { id },
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
        _count: { select: { requestItems: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: item!.id,
        itemType: item!.item_type,
        itemName: item!.item_name,
        itemCode: item!.item_code,
        description: item!.description,
        manufacturer: item!.manufacturer,
        unitType: item!.unit_type,
        unitCost: item!.unit_cost,
        currency: item!.currency,
        currentStock: item!.current_stock,
        minStock: item!.min_stock,
        reorderPoint: item!.reorder_point,
        storageRequirements: item!.storage_requirements,
        category: item!.category,
        isActive: item!.is_active,
        createdAt: item!.created_at.toISOString(),
        updatedAt: item!.updated_at.toISOString(),
        requestItemsCount: item!._count.requestItems,
      },
    });
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : 400;
    return NextResponse.json(
      { success: false, error: err.message || "Failed" },
      { status }
    );
  }
}

// ============================================================
// PATCH — update
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPPLIER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await assertOwnership(id, user.id);

    const body = await req.json();
    const data = updateSchema.parse(body);

    if (data.item_code) {
      const existingCode = await prisma.inputInventory.findFirst({
        where: { item_code: data.item_code, id: { not: id } },
      });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: "Item code already in use" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.inputInventory.update({
        where: { id },
        data: {
          ...(data.item_name !== undefined
            ? { item_name: data.item_name.trim() }
            : {}),
          ...(data.item_type !== undefined
            ? { item_type: data.item_type.trim() }
            : {}),
          ...(data.item_code !== undefined
            ? { item_code: data.item_code || null }
            : {}),
          ...(data.description !== undefined
            ? { description: data.description || null }
            : {}),
          ...(data.manufacturer !== undefined
            ? { manufacturer: data.manufacturer || null }
            : {}),
          ...(data.unit_type !== undefined
            ? { unit_type: data.unit_type }
            : {}),
          ...(data.unit_cost !== undefined
            ? { unit_cost: data.unit_cost }
            : {}),
          ...(data.currency !== undefined
            ? { currency: data.currency }
            : {}),
          ...(data.current_stock !== undefined
            ? { current_stock: data.current_stock }
            : {}),
          ...(data.min_stock !== undefined
            ? { min_stock: data.min_stock }
            : {}),
          ...(data.reorder_point !== undefined
            ? { reorder_point: data.reorder_point }
            : {}),
          ...(data.storage_requirements !== undefined
            ? { storage_requirements: data.storage_requirements || null }
            : {}),
          ...(data.category !== undefined
            ? { category: data.category || null }
            : {}),
          ...(data.is_active !== undefined
            ? { is_active: data.is_active }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_INVENTORY_ITEM",
          entity_type: "INPUT_INVENTORY",
          entity_id: id,
          new_values: JSON.stringify(data),
          success: true,
        },
      });

      return item;
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, itemName: updated.item_name },
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    const status = err.message === "Forbidden" ? 403 : 400;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update" },
      { status }
    );
  }
}

// ============================================================
// DELETE
// ============================================================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPPLIER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await assertOwnership(id, user.id);

    // If referenced by any request item, soft-delete (deactivate) instead
    const referenced = await prisma.inputRequestItem.count({
      where: { inventoryId: id },
    });

    await prisma.$transaction(async (tx) => {
      if (referenced > 0) {
        await tx.inputInventory.update({
          where: { id },
          data: { is_active: false },
        });
      } else {
        await tx.inputInventory.delete({ where: { id } });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action:
            referenced > 0 ? "DEACTIVATE_INVENTORY_ITEM" : "DELETE_INVENTORY_ITEM",
          entity_type: "INPUT_INVENTORY",
          entity_id: id,
          success: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: { softDeleted: referenced > 0 },
    });
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : 400;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete" },
      { status }
    );
  }
}