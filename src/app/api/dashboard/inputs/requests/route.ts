import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { InputRequestStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// ============================================================
// SCHEMA
// ============================================================

const createSchema = z.object({
  items: z
    .array(
      z.object({
        inventoryId: z.string(),
        quantity: z.coerce.number().positive(),
        notes: z.string().optional(),
      })
    )
    .min(1, "Pick at least one item"),

  farmId: z.string().optional().nullable(),
  cycleId: z.string().optional().nullable(),
  neededByDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// POST
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const orgId = user.organizationId ?? "__none__";
    const body = await req.json();
    const data = createSchema.parse(body);

    // ---------------------------------------------------------
    // Load the inventory rows the farmer is requesting
    // ---------------------------------------------------------
    const inventoryIds = data.items.map((it) => it.inventoryId);

    const inventory = await prisma.inputInventory.findMany({
      where: {
        id: { in: inventoryIds },
        is_active: true,
        supplier: {
          OR: [
            { organizationId: orgId },
            { user: { organizationId: orgId } },
          ],
          verified: true,
        },
      },
      select: {
        id: true,
        item_name: true,
        item_type: true,
        unit_type: true,
        unit_cost: true,
        currency: true,
        current_stock: true,
        supplierId: true,
      },
    });

    if (inventory.length !== inventoryIds.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more items are unavailable, out of stock, or from another organization",
        },
        { status: 400 }
      );
    }

    const inventoryById = new Map(inventory.map((i) => [i.id, i]));

    // ---------------------------------------------------------
    // Build the request items + total
    // ---------------------------------------------------------
    const requestItems = data.items.map((it) => {
      const inv = inventoryById.get(it.inventoryId)!;
      const unitPrice = inv.unit_cost ?? 0;
      const totalPrice = unitPrice * it.quantity;
      return {
        inventoryId: inv.id,
        item_name: inv.item_name,
        item_type: inv.item_type,
        quantity: it.quantity,
        unit: inv.unit_type,
        unit_price: unitPrice,
        total_price: totalPrice,
        notes: it.notes ?? null,
      };
    });

    const totalAmount = requestItems.reduce(
      (sum, it) => sum + (it.total_price ?? 0),
      0
    );

    const requestNumber = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ---------------------------------------------------------
    // If farmId provided, verify it belongs to the farmer
    // ---------------------------------------------------------
    if (data.farmId) {
      const farm = await prisma.farm.findUnique({
        where: { id: data.farmId },
        select: { id: true, userId: true },
      });
      if (!farm || farm.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Farm not found or not owned by you" },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------
    // Create request + items in a transaction
    // ---------------------------------------------------------
    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.inputRequest.create({
        data: {
          request_number: requestNumber,
          farmerId: user.id,
          farmId: data.farmId ?? null,
          cycleId: data.cycleId ?? null,
          status: InputRequestStatus.PENDING,
          requested_date: new Date(),
          needed_by_date: data.neededByDate
            ? new Date(data.neededByDate)
            : null,
          total_amount: totalAmount,
          currency: "NGN",
          notes: data.notes ?? null,
          items: {
            create: requestItems,
          },
        },
        select: {
          id: true,
          request_number: true,
          total_amount: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_INPUT_REQUEST",
          entity_type: "INPUT_REQUEST",
          entity_id: request.id,
          new_values: JSON.stringify({
            request_number: request.request_number,
            items: requestItems.length,
            total_amount: totalAmount,
          }),
          success: true,
        },
      });

      // Notify admins in the same organization
      const admins = await tx.user.findMany({
        where: {
          role: "ADMIN",
          organizationId: orgId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            title: "New input request",
            body: `${user.name ?? "A farmer"} submitted ${request.request_number} for approval.`,
            type: "INPUT_REQUEST",
            reference_type: "INPUT_REQUEST",
            reference_id: request.id,
          })),
        });
      }

      return request;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          requestNumber: created.request_number,
          totalAmount: Number(created.total_amount),
          status: created.status,
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
    console.error("[/api/dashboard/inputs/requests POST]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to create request" },
      { status: 400 }
    );
  }
}