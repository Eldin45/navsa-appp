// src/app/dashboard/wallet/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import WalletClient from "./page.client";

export default async function WalletPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/wallet"));

  const role = user.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isFarmer = role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  // -----------------------------------------------------------
  // 1. Determine which users' wallets to show
  // -----------------------------------------------------------
  let visibleUserIds: string[] = [];

  if (isSuperAdmin) {
    const users = await prisma.user.findMany({
      select: { id: true },
    });
    visibleUserIds = users.map((u) => u.id);
  } else if (isAdmin) {
    const orgUsers = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    visibleUserIds = [user.id, ...orgUsers.map((u) => u.id)];
  } else {
    visibleUserIds = [user.id];
  }

  // -----------------------------------------------------------
  // 2. Load wallets for those users
  // -----------------------------------------------------------
  const wallets = await prisma.wallet.findMany({
    where: { userId: { in: visibleUserIds } },
    orderBy: [{ userId: "asc" }, { type: "asc" }],
    select: {
      id: true,
      userId: true,
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
      kycLevel: true,
      dailyLimit: true,
      monthlyLimit: true,
      singleTxnLimit: true,
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
          organizationId: true,
        },
      },
    },
  });

  const walletIds = wallets.map((w) => w.id);

  // -----------------------------------------------------------
  // 3. Load transactions across those wallets
  // -----------------------------------------------------------
  const transactions = walletIds.length
    ? await prisma.walletTransaction.findMany({
        where: { walletId: { in: walletIds } },
        orderBy: { created_at: "desc" },
        take: 300,
        select: {
          id: true,
          walletId: true,
          type: true,
          category: true,
          amount: true,
          fee: true,
          balanceBefore: true,
          balanceAfter: true,
          reference: true,
          description: true,
          status: true,
          created_at: true,
          completedAt: true,
          wallet: {
            select: {
              type: true,
              accountNumber: true,
              userId: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      })
    : [];

  // -----------------------------------------------------------
  // 4. Bank accounts for the logged-in user (for withdrawals)
  // -----------------------------------------------------------
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
    },
  });

  // -----------------------------------------------------------
  // 5. Pending input requests for the farmer banner
  // -----------------------------------------------------------
  const pendingRequests = await prisma.inputRequest.count({
    where: { farmerId: user.id, status: "PENDING" },
  });
  const approvedRequests = await prisma.inputRequest.count({
    where: { farmerId: user.id, status: "APPROVED" },
  });

  // -----------------------------------------------------------
  // 6. List of farmers for the ADMIN filter dropdown
  // -----------------------------------------------------------
  const farmers = isAdmin || isSuperAdmin
    ? await prisma.user.findMany({
        where: isSuperAdmin
          ? { role: "FARMER" }
          : { role: "FARMER", organizationId: orgId },
        orderBy: { full_name: "asc" },
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      })
    : [];

  return (
    <WalletClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      }}
      wallets={wallets.map((w) => ({
        id: w.id,
        userId: w.userId,
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
        kycLevel: w.kycLevel,
        dailyLimit: Number(w.dailyLimit),
        monthlyLimit: Number(w.monthlyLimit),
        singleTxnLimit: Number(w.singleTxnLimit),
        palmPayAccountNumber: w.palmPayAccountNumber,
        palmPayAccountName: w.palmPayAccountName,
        palmPayBankName: w.palmPayBankName,
        palmPayStatus: w.palmPayStatus,
        createdAt: w.created_at.toISOString(),
        owner: w.user
          ? {
              id: w.user.id,
              name: w.user.full_name,
              email: w.user.email,
              role: w.user.role,
              organizationId: w.user.organizationId,
            }
          : null,
      }))}
      transactions={transactions.map((t) => ({
        id: t.id,
        walletId: t.walletId,
        walletType: t.wallet?.type ?? null,
        walletAccount: t.wallet?.accountNumber ?? null,
        walletOwnerId: t.wallet?.userId ?? null,
        type: t.type,
        category: t.category,
        amount: Number(t.amount),
        fee: Number(t.fee),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        reference: t.reference,
        description: t.description,
        status: t.status,
        createdAt: t.created_at.toISOString(),
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        owner: t.user
          ? {
              id: t.user.id,
              name: t.user.full_name,
              email: t.user.email,
            }
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
      }))}
      farmers={farmers}
      pendingRequests={pendingRequests}
      approvedRequests={approvedRequests}
    />
  );
}