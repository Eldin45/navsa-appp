import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import AdminsClient from "./page.client";

export default async function AdminsPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/?callbackUrl=" + encodeURIComponent("/admin/admins"));

  // Only SUPER_ADMIN can manage platform admins.
  if (user.role !== "SUPER_ADMIN") redirect("/unauthorized");

  // Platform-level admins = PLATFORM_ADMIN with no org.
  const admins = await prisma.user.findMany({
    where: {
      role: "PLATFORM_ADMIN",
      organizationId: null,
    },
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
      createdBy: { select: { id: true, full_name: true, email: true } },
    },
  });

  const stats = {
    total: admins.length,
    active: admins.filter((a) => a.status === "ACTIVE").length,
    suspended: admins.filter((a) => a.status === "SUSPENDED").length,
    mustChangePassword: admins.filter((a) => a.must_change_password).length,
  };

  return (
    <AdminsClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin: true,
      }}
      admins={admins.map((a) => ({
        id: a.id,
        name: a.full_name,
        email: a.email,
        phone: a.phone,
        status: a.status,
        createdAt: a.created_at.toISOString(),
        lastLogin: a.last_login ? a.last_login.toISOString() : null,
        mustChangePassword: a.must_change_password,
        wallet: a.wallets[0]
          ? {
              id: a.wallets[0].id,
              type: a.wallets[0].type,
              accountNumber: a.wallets[0].accountNumber,
              balance: Number(a.wallets[0].balance),
              availableBalance: Number(a.wallets[0].availableBalance),
              palmPayAccountNumber: a.wallets[0].palmPayAccountNumber,
              palmPayBankName: a.wallets[0].palmPayBankName,
              palmPayStatus: a.wallets[0].palmPayStatus,
            }
          : null,
        createdBy: a.createdBy
          ? {
              id: a.createdBy.id,
              name: a.createdBy.full_name,
              email: a.createdBy.email,
            }
          : null,
      }))}
      stats={stats}
    />
  );
}