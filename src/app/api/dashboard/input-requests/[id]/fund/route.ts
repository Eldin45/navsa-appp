// src/app/api/dashboard/input-requests/[id]/fund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import {
  WalletType,
  WalletCategory,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletFundingSource,
  WalletFundingStatus,
} from "@prisma/client";

function generateReference(prefix = "WTX"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const notes: string | null = body?.notes ?? null;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const request = await tx.inputRequest.findUnique({
          where: { id },
          include: {
            farmer: { select: { id: true, organizationId: true } },
          },
        });

        if (!request) throw new Error("Request not found");

        if (caller.role === "ADMIN") {
          if (request.farmer.organizationId !== caller.organizationId) {
            throw new Error("Forbidden");
          }
        }

        if (request.status !== "APPROVED") {
          throw new Error(`Cannot fund a ${request.status} request`);
        }

        // Load the ADMIN wallet and the farmer's CLOSED wallet
        const adminWallet = await tx.wallet.findFirst({
          where: { userId: caller.id, type: WalletType.ADMIN },
        });
        if (!adminWallet) throw new Error("Admin wallet not found");

        const farmerClosed = await tx.wallet.findFirst({
          where: {
            userId: request.farmerId,
            type: WalletType.FARMER_CLOSED,
          },
        });
        if (!farmerClosed)
          throw new Error("Farmer closed wallet not found");

        const amount = Number(request.total_amount);
        if (amount <= 0) throw new Error("Invalid request amount");

        if (Number(adminWallet.availableBalance) < amount) {
          throw new Error("Insufficient admin balance");
        }

        // 1. Record a WalletFunding on the farmer's closed wallet
        const funding = await tx.walletFunding.create({
          data: {
            walletId: farmerClosed.id,
            amount,
            reference: generateReference("FUND"),
            source: WalletFundingSource.ADMIN_ALLOCATION,
            status: WalletFundingStatus.SUCCESS,
            initiatedById: caller.id,
            completedAt: new Date(),
          },
        });

        // 2. CREDIT farmer closed wallet
        const fBefore = Number(farmerClosed.balance);
        const fAfter = fBefore + amount;

        const creditTx = await tx.walletTransaction.create({
          data: {
            walletId: farmerClosed.id,
            userId: request.farmerId,
            type: WalletTransactionType.CREDIT,
            category: WalletCategory.FUNDING,
            amount,
            balanceBefore: fBefore,
            balanceAfter: fAfter,
            reference: generateReference("WTX"),
            description: notes ?? `Funding for ${request.request_number}`,
            status: WalletTransactionStatus.SUCCESS,
            fundingId: funding.id,
            inputRequestId: request.id,
            completedAt: new Date(),
          },
        });

        await tx.wallet.update({
          where: { id: farmerClosed.id },
          data: {
            balance: { increment: amount },
            ledgerBalance: { increment: amount },
            availableBalance: { increment: amount },
          },
        });

        // 3. DEBIT admin wallet
        const aBefore = Number(adminWallet.balance);
        const aAfter = aBefore - amount;

        await tx.walletTransaction.create({
          data: {
            walletId: adminWallet.id,
            userId: caller.id,
            type: WalletTransactionType.DEBIT,
            category: WalletCategory.FUNDING,
            amount,
            balanceBefore: aBefore,
            balanceAfter: aAfter,
            reference: generateReference("WTX"),
            description: `Funded ${request.request_number}`,
            status: WalletTransactionStatus.SUCCESS,
            completedAt: new Date(),
          },
        });

        await tx.wallet.update({
          where: { id: adminWallet.id },
          data: {
            balance: { decrement: amount },
            ledgerBalance: { decrement: amount },
            availableBalance: { decrement: amount },
          },
        });

        // 4. Update request
        const updated = await tx.inputRequest.update({
          where: { id },
          data: {
            status: "FUNDED",
            funded_at: new Date(),
            funded_by_id: caller.id,
            funded_amount: amount,
            fundedFromWalletId: adminWallet.id,
          },
          select: { id: true, request_number: true, status: true },
        });

        // 5. Audit + notification
        await tx.auditLog.create({
          data: {
            userId: caller.id,
            action: "FUND_INPUT_REQUEST",
            entity_type: "INPUT_REQUEST",
            entity_id: updated.id,
            new_values: JSON.stringify({
              amount,
              farmerClosedWalletId: farmerClosed.id,
              adminWalletId: adminWallet.id,
              creditTxId: creditTx.id,
            }),
            success: true,
          },
        });

        await tx.notification.create({
          data: {
            userId: request.farmerId,
            title: "Input funds credited",
            body: `₦${amount.toLocaleString()} has been added to your closed wallet for ${updated.request_number}.`,
            type: "WALLET_FUNDED",
            reference_type: "INPUT_REQUEST",
            reference_id: updated.id,
          },
        });

        return { request: updated, amount };
      },
      { timeout: 60000, maxWait: 60000 }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[/api/dashboard/input-requests/[id]/fund] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fund request" },
      { status: 400 }
    );
  }
}