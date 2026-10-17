import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

// ============================================================
// GET — list orders for the logged-in supplier
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

    const supplier = await prisma.supplierProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const status = sp.get("status") ?? "ALL";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { supplierId: supplier.id };
    if (status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { order_number: { contains: search } },
        { tracking_number: { contains: search } },
        { farmer: { full_name: { contains: search } } },
        { farmer: { email: { contains: search } } },
        { request: { request_number: { contains: search } } },
      ];
    }

    const [total, orders, statusCounts] = await Promise.all([
      prisma.inputOrder.count({ where }),
      prisma.inputOrder.findMany({
        where,
        orderBy: { ordered_date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          order_number: true,
          status: true,
          ordered_date: true,
          expected_delivery: true,
          delivered_at: true,
          total_amount: true,
          currency: true,
          delivery_address: true,
          tracking_number: true,
          notes: true,
          farmer: {
            select: { id: true, full_name: true, email: true, phone: true },
          },
          request: {
            select: {
              id: true,
              request_number: true,
              items: {
                select: {
                  id: true,
                  item_name: true,
                  item_type: true,
                  quantity: true,
                  unit: true,
                  unit_price: true,
                  total_price: true,
                },
              },
            },
          },
        },
      }),
      prisma.inputOrder.groupBy({
        by: ["status"],
        where: { supplierId: supplier.id },
        _count: { _all: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of statusCounts) statusMap[s.status] = s._count._all;

    return NextResponse.json({
      success: true,
      data: {
        items: orders.map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          orderedDate: o.ordered_date.toISOString(),
          expectedDelivery: o.expected_delivery
            ? o.expected_delivery.toISOString()
            : null,
          deliveredAt: o.delivered_at ? o.delivered_at.toISOString() : null,
          totalAmount: Number(o.total_amount),
          currency: o.currency,
          deliveryAddress: o.delivery_address,
          trackingNumber: o.tracking_number,
          notes: o.notes,
          farmer: o.farmer,
          request: {
            id: o.request.id,
            requestNumber: o.request.request_number,
            items: o.request.items.map((it) => ({
              id: it.id,
              itemName: it.item_name,
              itemType: it.item_type,
              quantity: it.quantity,
              unit: it.unit,
              unitPrice: it.unit_price,
              totalPrice: it.total_price,
            })),
          },
        })),
        summary: {
          pending: statusMap["PENDING"] ?? 0,
          accepted: statusMap["ACCEPTED"] ?? 0,
          processing: statusMap["PROCESSING"] ?? 0,
          dispatched: statusMap["DISPATCHED"] ?? 0,
          inTransit: statusMap["IN_TRANSIT"] ?? 0,
          delivered: statusMap["DELIVERED"] ?? 0,
          cancelled: statusMap["CANCELLED"] ?? 0,
          total:
            Object.values(statusMap).reduce((a, b) => a + b, 0),
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
    console.error("[/api/dashboard/orders] GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}