// src/app/admin/wallets/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import WalletsClient from "./page.client";

export default async function WalletsPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/?callbackUrl=" + encodeURIComponent("/admin/wallets"));
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  const where = isSuperAdmin ? {} : { user: { organizationId: orgId } };

  const wallets = await prisma.wallet.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 500,
    select: {
      id: true,
      type: true,
      accountNumber: true,
      accountName: true,
      bankName: true,
      balance: true,
      availableBalance: true,
      ledgerBalance: true,
      currency: true,
      status: true,
      isFrozen: true,
      frozenReason: true,
      palmPayAccountNumber: true,
      palmPayAccountName: true,
      palmPayBankName: true,
      palmPayStatus: true,
      created_at: true,
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          organization: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          transactions: true,
          funding: true,
          withdrawals: true,
        },
      },
    },
  });

  const totals = wallets.reduce(
    (acc, w) => {
      acc.totalBalance += Number(w.balance);
      acc.totalAvailable += Number(w.availableBalance);
      acc.totalLedger += Number(w.ledgerBalance);
      if (w.palmPayStatus === "ACTIVE") acc.palmPayActive++;
      if (w.palmPayStatus === "FAILED") acc.palmPayFailed++;
      if (w.isFrozen) acc.frozen++;
      return acc;
    },
    {
      totalBalance: 0,
      totalAvailable: 0,
      totalLedger: 0,
      palmPayActive: 0,
      palmPayFailed: 0,
      frozen: 0,
    }
  );

  const stats = {
    total: wallets.length,
    ...totals,
  };

  return (
    <WalletsClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin,
      }}
      wallets={wallets.map((w) => ({
        id: w.id,
        type: w.type,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        bankName: w.bankName,
        balance: Number(w.balance),
        availableBalance: Number(w.availableBalance),
        ledgerBalance: Number(w.ledgerBalance),
        currency: w.currency,
        status: w.status,
        isFrozen: w.isFrozen,
        frozenReason: w.frozenReason,
        palmPayAccountNumber: w.palmPayAccountNumber,
        palmPayAccountName: w.palmPayAccountName,
        palmPayBankName: w.palmPayBankName,
        palmPayStatus: w.palmPayStatus,
        createdAt: w.created_at.toISOString(),
        user: {
          id: w.user.id,
          name: w.user.full_name,
          email: w.user.email,
          role: w.user.role,
          organization: w.user.organization
            ? { id: w.user.organization.id, name: w.user.organization.name }
            : null,
        },
        counts: {
          transactions: w._count.transactions,
          funding: w._count.funding,
          withdrawals: w._count.withdrawals,
        },
      }))}
      stats={stats}
    />
  );
}