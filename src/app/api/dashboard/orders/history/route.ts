import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

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

    const order = await prisma.inputOrder.findUnique({
      where: { id },
      select: {
        id: true,
        supplier: { select: { userId: true } },
        statusHistory: {
          orderBy: { changed_at: "desc" },
          select: {
            id: true,
            from_status: true,
            to_status: true,
            changed_by: true,
            reason: true,
            changed_at: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    if (order.supplier.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.from_status,
        toStatus: h.to_status,
        changedBy: h.changed_by,
        reason: h.reason,
        changedAt: h.changed_at.toISOString(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}