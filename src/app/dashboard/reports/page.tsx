// src/app/dashboard/reports/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import ReportsClient from "./page.client";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/reports"));

  const role = user.role;
  if (!["SUPER_ADMIN", "ADMIN", "FARMER"].includes(role)) {
    redirect("/unauthorized");
  }

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isFarmer = role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  // -----------------------------------------------------------
  // Scope filters
  // -----------------------------------------------------------
  const userWhere = isSuperAdmin
    ? {}
    : isAdmin
      ? { organizationId: orgId }
      : { id: user.id };

  const farmerWhere = isSuperAdmin
    ? { role: "FARMER" as const }
    : isAdmin
      ? { role: "FARMER" as const, organizationId: orgId }
      : { role: "FARMER" as const, id: user.id };

  const farmWhere = isSuperAdmin
    ? {}
    : isAdmin
      ? {
          OR: [
            { user: { organizationId: orgId } },
            { group: { organizationId: orgId } },
          ],
        }
      : { userId: user.id };

  const walletWhere = isSuperAdmin
    ? {}
    : isAdmin
      ? { user: { organizationId: orgId } }
      : { userId: user.id };

  const requestWhere = isSuperAdmin
    ? {}
    : isAdmin
      ? { farmer: { organizationId: orgId } }
      : { farmerId: user.id };

  const orderWhere = isSuperAdmin
    ? {}
    : isAdmin
      ? { farmer: { organizationId: orgId } }
      : { farmerId: user.id };

  // -----------------------------------------------------------
  // Parallel queries
  // -----------------------------------------------------------
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
    requestsByMonthRaw,
    farmersByMonthRaw,
    topFarmersByRequests,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.user.count({ where: farmerWhere }),
    prisma.farm.count({ where: farmWhere }),
    prisma.farmField.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { farm: { user: { organizationId: orgId } } }
          : { farm: { userId: user.id } },
    }),
    prisma.cropCycle.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { field: { farm: { user: { organizationId: orgId } } } }
          : { field: { farm: { userId: user.id } } },
    }),
    prisma.harvest.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { cycle: { field: { farm: { user: { organizationId: orgId } } } } }
          : { cycle: { field: { farm: { userId: user.id } } } },
    }),
    prisma.inputRequest.count({ where: requestWhere }),
    prisma.inputOrder.count({ where: orderWhere }),
    prisma.farmGroup.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { organizationId: orgId }
          : { members: { some: { userId: user.id } } },
    }),
    prisma.ioTDevice.count({
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { farm: { user: { organizationId: orgId } } }
          : { farm: { userId: user.id } },
    }),
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
      where: isSuperAdmin
        ? {}
        : isAdmin
          ? { cycle: { field: { farm: { user: { organizationId: orgId } } } } }
          : { cycle: { field: { farm: { userId: user.id } } } },
    }),
    prisma.inputRequest.findMany({
      where: requestWhere,
      select: { requested_date: true, total_amount: true },
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

  // -----------------------------------------------------------
  // Look up names for top farmers
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // Bucket input requests by month
  // -----------------------------------------------------------
  const requestsByMonth = bucketByMonth(
    requestsByMonthRaw.map((r) => r.requested_date)
  );
  const farmersByMonth = bucketByMonth(
    farmersByMonthRaw.map((f) => f.created_at)
  );

  return (
    <ReportsClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        isAdmin,
        isFarmer,
        organizationId: user.organizationId,
      }}
      stats={{
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
      }}
      farmersByStatus={farmersByStatusRaw.map((r) => ({
        status: r.status,
        count: r._count._all,
      }))}
      requestsByStatus={requestsByStatusRaw.map((r) => ({
        status: r.status,
        count: r._count._all,
      }))}
      requestsByMonth={requestsByMonth}
      farmersByMonth={farmersByMonth}
      topFarmers={topFarmers}
    />
  );
}

// ============================================================
// HELPERS
// ============================================================

function bucketByMonth(dates: Date[]): Array<{ month: string; count: number }> {
  const map = new Map<string, number>();

  // Initialize last 12 months including current
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    map.set(key, 0);
  }

  for (const date of dates) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([month, count]) => ({
    month,
    count,
  }));
}