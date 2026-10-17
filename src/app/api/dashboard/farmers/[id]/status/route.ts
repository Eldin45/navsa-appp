// src/app/api/dashboard/farmers/[id]/status/route.ts
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
  const { status } = await req.json();

  if (!["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
    return NextResponse.json(
      { success: false, error: "Invalid status" },
      { status: 400 }
    );
  }

  if (caller.role === "ADMIN") {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true, role: true },
    });
    if (
      !target ||
      target.role !== "FARMER" ||
      target.organizationId !== caller.organizationId
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, email: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: caller.id,
      action: "UPDATE_FARMER_STATUS",
      entity_type: "USER",
      entity_id: id,
      new_values: JSON.stringify({ status }),
      success: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}