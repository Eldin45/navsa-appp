// src/app/api/dashboard/input-requests/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason: string = (body?.reason ?? body?.notes ?? "").trim();

  if (!reason) {
    return NextResponse.json(
      { success: false, error: "Rejection reason is required" },
      { status: 400 }
    );
  }

  const request = await prisma.inputRequest.findUnique({
    where: { id },
    include: { farmer: { select: { organizationId: true } } },
  });

  if (!request) {
    return NextResponse.json(
      { success: false, error: "Request not found" },
      { status: 404 }
    );
  }

  if (caller.role === "ADMIN") {
    if (request.farmer.organizationId !== caller.organizationId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  if (request.status === "FUNDED" || request.status === "DELIVERED") {
    return NextResponse.json(
      { success: false, error: "Cannot reject a funded or delivered request" },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.inputRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejection_reason: reason,
      },
      select: { id: true, request_number: true, status: true },
    });

    await tx.auditLog.create({
      data: {
        userId: caller.id,
        action: "REJECT_INPUT_REQUEST",
        entity_type: "INPUT_REQUEST",
        entity_id: r.id,
        new_values: JSON.stringify({ reason }),
        success: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.farmerId,
        title: "Input request rejected",
        body: `${r.request_number} was rejected: ${reason}`,
        type: "INPUT_REQUEST",
        reference_type: "INPUT_REQUEST",
        reference_id: r.id,
      },
    });

    return r;
  });

  return NextResponse.json({ success: true, data: updated });
}