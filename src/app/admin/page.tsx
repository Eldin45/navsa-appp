import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import AdminDashboardClient from "./page.client";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/admin/dashboard"));
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isPlatformAdmin = isSuperAdmin || user.role === "PLATFORM_ADMIN";

  if (!isPlatformAdmin) {
    redirect("/unauthorized");
  }

  // Both platform admins see all data — no org scoping.
  const [
    totalFarmers,
    totalOrganizations,
    totalAdmins,
    totalSuppliers,
    totalFarms,
    pendingApplications,
    walletTotals,
    palmPayActive,
    palmPayFailed,
    walletAgg,
    farmersByOrganizationRaw,
    recentApplications,
    recentInvites,
    farmerGrowthRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "FARMER" } }),
    prisma.organization.count(),
    prisma.user.count({ where: { role: "PLATFORM_ADMIN" } }),
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.farm.count(),
    prisma.supplierApplication.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW", "MORE_INFO_REQUESTED"],
        },
      },
    }),
    prisma.wallet.count(),
    prisma.wallet.count({ where: { palmPayStatus: "ACTIVE" } }),
    prisma.wallet.count({ where: { palmPayStatus: "FAILED" } }),
    prisma.wallet.aggregate({
      _sum: { balance: true, availableBalance: true },
    }),
    prisma.farmerProfile.findMany({
      select: { organization: { select: { name: true } } },
    }),
    prisma.supplierApplication.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        application_number: true,
        business_name: true,
        contact_full_name: true,
        status: true,
        submittedAt: true,
      },
    }),
    prisma.adminInvite.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        full_name: true,
        organizationName: true,
        status: true,
        created_at: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: "FARMER",
        created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { created_at: true },
      orderBy: { created_at: "asc" },
    }),
  ]);

  // Group farmers by organization
  const orgMap = new Map<string, number>();
  for (const r of farmersByOrganizationRaw) {
    const key = r.organization?.name?.trim() || "Unassigned";
    orgMap.set(key, (orgMap.get(key) ?? 0) + 1);
  }
  const farmersByOrganization = Array.from(orgMap.entries())
    .map(([organization, farmer_count]) => ({ organization, farmer_count }))
    .sort((a, b) => b.farmer_count - a.farmer_count);
  const topOrganizations = farmersByOrganization.slice(0, 5);

  // 30-day growth buckets
  const growthMap = new Map<string, number>();
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (30 - i));
    growthMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of farmerGrowthRaw) {
    const key = r.created_at.toISOString().slice(0, 10);
    if (growthMap.has(key)) growthMap.set(key, (growthMap.get(key) ?? 0) + 1);
  }
  const farmerGrowth = Array.from(growthMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <AdminDashboardClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name ?? "Admin",
        role: user.role,
        isSuperAdmin,
        organizationId: user.organizationId,
      }}
      stats={{
        totalFarmers,
        totalOrganizations,
        totalAdmins,
        totalSuppliers,
        totalFarms,
        pendingApplications,
      }}
      walletStats={{
        totalWallets: walletTotals,
        palmPayActive,
        palmPayFailed,
        totalBalance: Number(walletAgg._sum.balance ?? 0),
        totalAvailable: Number(walletAgg._sum.availableBalance ?? 0),
      }}
      farmersByOrganization={farmersByOrganization}
      topOrganizations={topOrganizations}
      recentApplications={recentApplications.map((a) => ({
        ...a,
        submittedAt: a.submittedAt.toISOString(),
      }))}
      recentInvites={recentInvites.map((i) => ({
        ...i,
        created_at: i.created_at.toISOString(),
      }))}
      farmerGrowth={farmerGrowth}
    />
  );
}