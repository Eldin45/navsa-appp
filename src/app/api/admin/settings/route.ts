import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      role: true,
      status: true,
      created_at: true,
      last_login: true,
      organization: {
        select: { id: true, name: true, slug: true, type: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    if (data.phone) {
      const existing = await prisma.user.findFirst({
        where: { phone: data.phone, id: { not: user.id } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Phone number already in use" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.fullName ? { full_name: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      },
      select: { id: true, full_name: true, phone: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_ADMIN_PROFILE",
        entity_type: "USER",
        entity_id: user.id,
        new_values: JSON.stringify(data),
        success: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update" },
      { status: 400 }
    );
  }
}