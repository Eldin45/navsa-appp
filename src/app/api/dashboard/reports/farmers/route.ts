// src/app/api/dashboard/reports/farmers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  const farmers = await prisma.user.findMany({
    where: isSuperAdmin
      ? { role: "FARMER" }
      : { role: "FARMER", organizationId: orgId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      status: true,
      created_at: true,
      _count: { select: { farms: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: farmers.map((f) => ({
      id: f.id,
      name: f.full_name,
      email: f.email,
      phone: f.phone,
      status: f.status,
      farms: f._count.farms,
      createdAt: f.created_at.toISOString(),
    })),
  });
}