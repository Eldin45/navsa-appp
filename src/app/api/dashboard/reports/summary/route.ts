// src/app/api/dashboard/reports/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  const orgId = user.organizationId ?? "__none__";

  const farmerWhere = isSuperAdmin
    ? { role: "FARMER" as const }
    : isAdmin
      ? { role: "FARMER" as const, organizationId: orgId }
      : { role: "FARMER" as const, id: user.id };

  const [totalFarmers, totalFarms, totalInputRequests] = await Promise.all([
    prisma.user.count({ where: farmerWhere }),
    prisma.farm.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? {
              OR: [
                { user: { organizationId: orgId } },
                { group: { organizationId: orgId } },
              ],
            }
          : { userId: user.id },
    }),
    prisma.inputRequest.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { farmer: { organizationId: orgId } }
          : { farmerId: user.id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { totalFarmers, totalFarms, totalInputRequests },
  });
}