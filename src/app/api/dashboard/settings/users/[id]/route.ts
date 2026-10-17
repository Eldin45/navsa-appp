// src/app/api/dashboard/settings/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});

// ============================================================
// PERMISSIONS
// ============================================================

async function assertCanManage(
  caller: { id: string; role: string; organizationId: string | null },
  targetId: string
) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!target) throw new Error("User not found");

  // SUPER_ADMIN → everything
  if (caller.role === "SUPER_ADMIN") return target;

  // Everyone else must be in the same org
  if (
    !caller.organizationId ||
    target.organizationId !== caller.organizationId
  ) {
    throw new Error("Forbidden");
  }

  // Nobody in an org can touch a SUPER_ADMIN
  if (target.role === "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }

  // Only ADMIN can manage ADMIN or ORG_ADMIN
  const targetIsAdminLike =
    target.role === "ADMIN" || target.role === "ORG_ADMIN";

  if (targetIsAdminLike && caller.role !== "ADMIN") {
    throw new Error("Only the organization admin can manage admins");
  }

  return target;
}

// ============================================================
// PATCH — update status
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (
    !caller ||
    !["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(caller.role)
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    if (id === caller.id) {
      return NextResponse.json(
        { success: false, error: "You cannot modify your own status" },
        { status: 400 }
      );
    }

    await assertCanManage(
      {
        id: caller.id,
        role: caller.role,
        organizationId: caller.organizationId ?? null,
      },
      id
    );

    const body = await req.json();
    const data = patchSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
      },
      select: { id: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: caller.id,
        action: "UPDATE_USER_STATUS",
        entity_type: "USER",
        entity_id: id,
        new_values: JSON.stringify(data),
        success: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError || err.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: err.issues?.[0]?.message ?? "Validation failed",
          details: err.issues,
        },
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
  const caller = await getCurrentUser();
  if (
    !caller ||
    !["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(caller.role)
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    if (id === caller.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete yourself" },
        { status: 400 }
      );
    }

    await assertCanManage(
      {
        id: caller.id,
        role: caller.role,
        organizationId: caller.organizationId ?? null,
      },
      id
    );

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: caller.id,
          action: "DELETE_USER",
          entity_type: "USER",
          entity_id: id,
          success: true,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : 400;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete" },
      { status }
    );
  }
}