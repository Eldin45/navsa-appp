// src/app/dashboard/farmers/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import FarmersClient from "./page.client";

export default async function FarmersPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/farmers"));

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  const where = isSuperAdmin
    ? { role: "FARMER" as const }
    : { role: "FARMER" as const, organizationId: orgId };

  const farmers = await prisma.user.findMany({
    where,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      status: true,
      created_at: true,
      last_login: true,
      must_change_password: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
      farmerProfile: {
        select: {
          farmer_code: true,
          primary_crops: true,
          years_farming: true,
          total_land_ha: true,
        },
      },
      wallets: {
        select: {
          id: true,
          type: true,
          accountNumber: true,
          balance: true,
          availableBalance: true,
          palmPayAccountNumber: true,
          palmPayBankName: true,
          palmPayStatus: true,
        },
      },
      _count: { select: { farms: true } },
    },
  });

  const stats = {
    total: farmers.length,
    active: farmers.filter((f) => f.status === "ACTIVE").length,
    withPalmPayVA: farmers.filter((f) =>
      f.wallets.some((w) => w.palmPayStatus === "ACTIVE")
    ).length,
    totalFarms: farmers.reduce((s, f) => s + f._count.farms, 0),
  };

  return (
    <FarmersClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        organizationId: user.organizationId,
      }}
      farmers={farmers.map((f) => ({
        id: f.id,
        name: f.full_name,
        email: f.email,
        phone: f.phone,
        status: f.status,
        createdAt: f.created_at.toISOString(),
        lastLogin: f.last_login ? f.last_login.toISOString() : null,
        mustChangePassword: f.must_change_password,
        organizationId: f.organizationId,
        organization: f.organization
          ? { id: f.organization.id, name: f.organization.name }
          : null,
        profile: f.farmerProfile
          ? {
              farmerCode: f.farmerProfile.farmer_code,
              primaryCrops: f.farmerProfile.primary_crops,
              yearsFarming: f.farmerProfile.years_farming,
              totalLandHa: f.farmerProfile.total_land_ha,
            }
          : null,
        wallets: f.wallets.map((w) => ({
          id: w.id,
          type: w.type,
          accountNumber: w.accountNumber,
          balance: Number(w.balance),
          availableBalance: Number(w.availableBalance),
          palmPayAccountNumber: w.palmPayAccountNumber,
          palmPayBankName: w.palmPayBankName,
          palmPayStatus: w.palmPayStatus,
        })),
        farmCount: f._count.farms,
      }))}
      stats={stats}
    />
  );
}