import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

// ============================================================
// HELPERS
// ============================================================

function bucketByMonth(
  dates: Date[]
): Array<{ month: string; count: number }> {
  const map = new Map<string, number>();
  const now = new Date();

  // Initialize last 12 months including current
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, 0);
  }

  for (const date of dates) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([month, count]) => ({
    month,
    count,
  }));
}

// ============================================================
// GET /api/admin/reports/summary
// ============================================================

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const orgId = user.organizationId ?? "__none__";

    // ---------------------------------------------------------
    // Scope filters
    // ---------------------------------------------------------
    const userWhere = isSuperAdmin ? {} : { organizationId: orgId };

    const farmerWhere = isSuperAdmin
      ? { role: "FARMER" as const }
      : { role: "FARMER" as const, organizationId: orgId };

    const farmWhere = isSuperAdmin
      ? {}
      : {
          OR: [
            { user: { organizationId: orgId } },
            { group: { organizationId: orgId } },
          ],
        };

    const fieldWhere = isSuperAdmin
      ? {}
      : {
          farm: {
            OR: [
              { user: { organizationId: orgId } },
              { group: { organizationId: orgId } },
            ],
          },
        };

    const cycleWhere = isSuperAdmin
      ? {}
      : {
          field: {
            farm: {
              OR: [
                { user: { organizationId: orgId } },
                { group: { organizationId: orgId } },
              ],
            },
          },
        };

    const harvestWhere = isSuperAdmin
      ? {}
      : {
          cycle: {
            field: {
              farm: {
                OR: [
                  { user: { organizationId: orgId } },
                  { group: { organizationId: orgId } },
                ],
              },
            },
          },
        };

    const requestWhere = isSuperAdmin
      ? {}
      : { farmer: { organizationId: orgId } };

    const orderWhere = isSuperAdmin
      ? {}
      : { farmer: { organizationId: orgId } };

    const deviceWhere = isSuperAdmin
      ? {}
      : {
          farm: {
            OR: [
              { user: { organizationId: orgId } },
              { group: { organizationId: orgId } },
            ],
          },
        };

    const walletWhere = isSuperAdmin
      ? {}
      : { user: { organizationId: orgId } };

    // ---------------------------------------------------------
    // Parallel queries
    // ---------------------------------------------------------
    const [
      totalUsers,
      totalFarmers,
      totalFarms,
      totalFields,
      totalCropCycles,
      totalHarvests,
      totalInputRequests,
      totalInputOrders,
      totalFarmGroups,
      totalDevices,
      walletAgg,
      farmersByStatusRaw,
      requestsByStatusRaw,
      harvestAgg,
      farmersByOrgRaw,
      requestsByMonthRaw,
      farmersByMonthRaw,
      topFarmersByRequests,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.user.count({ where: farmerWhere }),
      prisma.farm.count({ where: farmWhere }),
      prisma.farmField.count({ where: fieldWhere }),
      prisma.cropCycle.count({ where: cycleWhere }),
      prisma.harvest.count({ where: harvestWhere }),
      prisma.inputRequest.count({ where: requestWhere }),
      prisma.inputOrder.count({ where: orderWhere }),
      prisma.farmGroup.count({
        where: isSuperAdmin ? {} : { organizationId: orgId },
      }),
      prisma.ioTDevice.count({ where: deviceWhere }),
      prisma.wallet.aggregate({
        _sum: { balance: true, availableBalance: true },
        where: walletWhere,
      }),
      prisma.user.groupBy({
        by: ["status"],
        where: farmerWhere,
        _count: { _all: true },
      }),
      prisma.inputRequest.groupBy({
        by: ["status"],
        where: requestWhere,
        _count: { _all: true },
      }),
      prisma.harvest.aggregate({
        _sum: { quantity: true },
        where: harvestWhere,
      }),
      // Group farmers by organization without loading every FarmerProfile
      prisma.user.groupBy({
        by: ["organizationId"],
        where: farmerWhere,
        _count: { _all: true },
      }),
      prisma.inputRequest.findMany({
        where: requestWhere,
        select: { requested_date: true },
        orderBy: { requested_date: "asc" },
        take: 5000,
      }),
      prisma.user.findMany({
        where: farmerWhere,
        select: { created_at: true },
        orderBy: { created_at: "asc" },
        take: 5000,
      }),
      prisma.inputRequest.groupBy({
        by: ["farmerId"],
        where: requestWhere,
        _count: { _all: true },
        _sum: { total_amount: true },
        orderBy: { _count: { farmerId: "desc" } },
        take: 5,
      }),
    ]);

    // ---------------------------------------------------------
    // Resolve organization names for farmersByOrganization
    // ---------------------------------------------------------
    const orgIds = farmersByOrgRaw
      .map((r) => r.organizationId)
      .filter((id): id is string => !!id);

    const orgs = orgIds.length
      ? await prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true },
        })
      : [];

    const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));

    const farmersByOrganization = farmersByOrgRaw
      .map((r) => ({
        organization: r.organizationId
          ? orgNameById.get(r.organizationId) ?? "Unknown"
          : "Unassigned",
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    // ---------------------------------------------------------
    // Resolve top farmer names (bounded)
    // ---------------------------------------------------------
    const topFarmerIds = topFarmersByRequests.map((t) => t.farmerId);
    const topFarmerUsers = topFarmerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: topFarmerIds } },
          select: { id: true, full_name: true, email: true },
        })
      : [];

    const topFarmers = topFarmersByRequests.map((t) => {
      const u = topFarmerUsers.find((x) => x.id === t.farmerId);
      return {
        farmerId: t.farmerId,
        name: u?.full_name ?? "Unknown",
        email: u?.email ?? "",
        requestCount: t._count._all,
        totalAmount: Number(t._sum.total_amount ?? 0),
      };
    });

    // ---------------------------------------------------------
    // Response
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalFarmers,
          totalFarms,
          totalFields,
          totalCropCycles,
          totalHarvests,
          totalInputRequests,
          totalInputOrders,
          totalFarmGroups,
          totalDevices,
          walletBalance: Number(walletAgg._sum.balance ?? 0),
          walletAvailable: Number(walletAgg._sum.availableBalance ?? 0),
          totalHarvestQuantity: Number(harvestAgg._sum.quantity ?? 0),
        },
        farmersByOrganization,
        farmersByStatus: farmersByStatusRaw.map((r) => ({
          status: r.status,
          count: r._count._all,
        })),
        requestsByStatus: requestsByStatusRaw.map((r) => ({
          status: r.status,
          count: r._count._all,
        })),
        requestsByMonth: bucketByMonth(
          requestsByMonthRaw.map((r) => r.requested_date)
        ),
        farmersByMonth: bucketByMonth(
          farmersByMonthRaw.map((f) => f.created_at)
        ),
        topFarmers,
      },
    });
  } catch (err: any) {
    console.error("[admin/reports/summary]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}