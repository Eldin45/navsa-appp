import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { InputOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// ============================================================
// PATCH — update order status or details
// ============================================================

const patchSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "ACCEPTED",
      "PROCESSING",
      "DISPATCHED",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
  expected_delivery: z.string().datetime().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  reason: z.string().optional(),
});

// Valid forward transitions for the supplier
const ALLOWED_TRANSITIONS: Record<InputOrderStatus, InputOrderStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

async function assertOwnership(orderId: string, userId: string) {
  const order = await prisma.inputOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      supplierId: true,
      supplier: { select: { userId: true } },
    },
  });
  if (!order) throw new Error("Order not found");
  if (order.supplier.userId !== userId) throw new Error("Forbidden");
  return order;
}

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
    const current = await assertOwnership(id, user.id);

    const body = await req.json();
    const data = patchSchema.parse(body);

    // Validate status transition
    if (data.status) {
      const allowed = ALLOWED_TRANSITIONS[current.status as InputOrderStatus] ?? [];
      if (!allowed.includes(data.status as InputOrderStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot move from ${current.status} to ${data.status}`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.inputOrder.update({
        where: { id },
        data: {
          ...(data.status ? { status: data.status as InputOrderStatus } : {}),
          ...(data.expected_delivery !== undefined
            ? {
                expected_delivery: data.expected_delivery
                  ? new Date(data.expected_delivery)
                  : null,
              }
            : {}),
          ...(data.tracking_number !== undefined
            ? { tracking_number: data.tracking_number || null }
            : {}),
          ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
          ...(data.status === "DELIVERED"
            ? { delivered_at: new Date(), delivered_by_id: user.id }
            : {}),
        },
      });

      if (data.status) {
        await tx.inputOrderStatusHistory.create({
          data: {
            orderId: id,
            from_status: current.status,
            to_status: data.status,
            changed_by: user.id,
            reason: data.reason ?? null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_INPUT_ORDER",
          entity_type: "INPUT_ORDER",
          entity_id: id,
          new_values: JSON.stringify(data),
          success: true,
        },
      });

      // Notify the farmer about status change
      if (data.status) {
        const full = await tx.inputOrder.findUnique({
          where: { id },
          select: { order_number: true, farmerId: true },
        });
        if (full) {
          await tx.notification.create({
            data: {
              userId: full.farmerId,
              title: `Order ${data.status.replace(/_/g, " ")}`,
              body: `Your order ${full.order_number} is now ${data.status.replace(/_/g, " ")}.`,
              type: "ORDER",
              reference_type: "INPUT_ORDER",
              reference_id: id,
            },
          });
        }
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
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