// src/app/dashboard/settings/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import SettingsClient from "./page.client";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/settings"));

  const isAdmin = user.role === "ADMIN";
  const isOrgAdmin = user.role === "ORG_ADMIN";
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  // ---------- Profile ----------
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
      farmerProfile: {
        select: {
          farmer_code: true,
          primary_crops: true,
          years_farming: true,
          total_land_ha: true,
        },
      },
      supplierProfile: {
        select: {
          supplier_code: true,
          business_name: true,
          business_type: true,
          product_categories: true,
          delivery_regions: true,
        },
      },
      preferences: {
        select: {
          theme: true,
          language: true,
          timezone: true,
          email_enabled: true,
          sms_enabled: true,
          push_enabled: true,
          weather_alerts: true,
          payment_alerts: true,
        },
      },
    },
  });

  if (!profile) redirect("/unauthorized");

  // ---------- Organization users ----------
  let orgUsers: any[] = [];
  if (isAdmin || isOrgAdmin || isSuperAdmin) {
    orgUsers = await prisma.user.findMany({
      where: isSuperAdmin ? {} : { organizationId: orgId },
      orderBy: { created_at: "desc" },
      take: 500,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        last_login: true,
        must_change_password: true,
        createdBy: { select: { id: true, full_name: true } },
      },
    });
  }

  // ---------- Bank accounts ----------
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    orderBy: [{ is_primary: "desc" }, { created_at: "desc" }],
    select: {
      id: true,
      bank_name: true,
      bank_code: true,
      account_name: true,
      account_number: true,
      currency: true,
      is_verified: true,
      is_primary: true,
      created_at: true,
    },
  });

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isAdmin,
        isOrgAdmin,
        isSuperAdmin,
        organizationId: user.organizationId,
      }}
      profile={{
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
        createdAt: profile.created_at.toISOString(),
        lastLogin: profile.last_login ? profile.last_login.toISOString() : null,
        organization: profile.organization
          ? {
              id: profile.organization.id,
              name: profile.organization.name,
              slug: profile.organization.slug,
              type: profile.organization.type,
            }
          : null,
        farmerProfile: profile.farmerProfile
          ? {
              farmerCode: profile.farmerProfile.farmer_code,
              primaryCrops: profile.farmerProfile.primary_crops,
              yearsFarming: profile.farmerProfile.years_farming,
              totalLandHa: profile.farmerProfile.total_land_ha,
            }
          : null,
        supplierProfile: profile.supplierProfile
          ? {
              supplierCode: profile.supplierProfile.supplier_code,
              businessName: profile.supplierProfile.business_name,
              businessType: profile.supplierProfile.business_type,
              productCategories: profile.supplierProfile.product_categories,
              deliveryRegions: profile.supplierProfile.delivery_regions,
            }
          : null,
        preferences: profile.preferences
          ? {
              theme: profile.preferences.theme,
              language: profile.preferences.language,
              timezone: profile.preferences.timezone,
              emailEnabled: profile.preferences.email_enabled,
              smsEnabled: profile.preferences.sms_enabled,
              pushEnabled: profile.preferences.push_enabled,
              weatherAlerts: profile.preferences.weather_alerts,
              paymentAlerts: profile.preferences.payment_alerts,
            }
          : null,
      }}
      users={orgUsers.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.created_at.toISOString(),
        lastLogin: u.last_login ? u.last_login.toISOString() : null,
        mustChangePassword: u.must_change_password,
        createdBy: u.createdBy
          ? { id: u.createdBy.id, name: u.createdBy.full_name }
          : null,
      }))}
      bankAccounts={bankAccounts.map((b) => ({
        id: b.id,
        bankName: b.bank_name,
        bankCode: b.bank_code,
        accountName: b.account_name,
        accountNumber: b.account_number,
        currency: b.currency,
        isVerified: b.is_verified,
        isPrimary: b.is_primary,
        createdAt: b.created_at.toISOString(),
      }))}
    />
  );
}