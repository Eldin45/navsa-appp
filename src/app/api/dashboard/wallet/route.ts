// src/app/api/dashboard/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: { type: "asc" },
    select: {
      id: true,
      type: true,
      accountNumber: true,
      accountName: true,
      balance: true,
      availableBalance: true,
      ledgerBalance: true,
      currency: true,
      status: true,
      isFrozen: true,
      palmPayAccountNumber: true,
      palmPayBankName: true,
      palmPayStatus: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: wallets.map((w) => ({
      id: w.id,
      type: w.type,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      balance: Number(w.balance),
      availableBalance: Number(w.availableBalance),
      ledgerBalance: Number(w.ledgerBalance),
      currency: w.currency,
      status: w.status,
      isFrozen: w.isFrozen,
      palmPayAccountNumber: w.palmPayAccountNumber,
      palmPayBankName: w.palmPayBankName,
      palmPayStatus: w.palmPayStatus,
    })),
  });
}