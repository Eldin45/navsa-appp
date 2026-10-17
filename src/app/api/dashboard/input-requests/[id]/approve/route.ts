// src/app/api/dashboard/input-requests/[id]/approve/route.ts
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
  const notes: string | null = body?.notes ?? null;

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

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { success: false, error: `Cannot approve a ${request.status} request` },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.inputRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approved_at: new Date(),
        approved_by_id: caller.id,
        notes: notes ?? request.notes,
      },
      select: { id: true, request_number: true, status: true },
    });

    await tx.auditLog.create({
      data: {
        userId: caller.id,
        action: "APPROVE_INPUT_REQUEST",
        entity_type: "INPUT_REQUEST",
        entity_id: r.id,
        success: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.farmerId,
        title: "Input request approved",
        body: `${r.request_number} was approved. It will be funded shortly.`,
        type: "INPUT_REQUEST",
        reference_type: "INPUT_REQUEST",
        reference_id: r.id,
      },
    });

    return r;
  });

  return NextResponse.json({ success: true, data: updated });
}