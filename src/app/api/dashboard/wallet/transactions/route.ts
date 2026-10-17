// src/app/api/dashboard/wallet/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const take = Math.min(
    Number(req.nextUrl.searchParams.get("take") ?? 100),
    500
  );
  const walletId = req.nextUrl.searchParams.get("walletId") || undefined;

  const walletIds = (
    await prisma.wallet.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
  ).map((w) => w.id);

  const rows = await prisma.walletTransaction.findMany({
    where: {
      walletId: walletId
        ? walletId
        : { in: walletIds },
      ...(walletId ? { AND: [{ walletId: { in: walletIds } }] } : {}),
    },
    orderBy: { created_at: "desc" },
    take,
    select: {
      id: true,
      walletId: true,
      type: true,
      category: true,
      amount: true,
      balanceAfter: true,
      reference: true,
      description: true,
      status: true,
      created_at: true,
      wallet: { select: { type: true, accountNumber: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      walletId: r.walletId,
      walletType: r.wallet?.type ?? null,
      walletAccount: r.wallet?.accountNumber ?? null,
      type: r.type,
      category: r.category,
      amount: Number(r.amount),
      balanceAfter: Number(r.balanceAfter),
      reference: r.reference,
      description: r.description,
      status: r.status,
      createdAt: r.created_at.toISOString(),
    })),
  });
}