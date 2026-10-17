// src/app/api/dashboard/wallet/withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import {
  WalletType,
  WalletCategory,
  WalletTransactionType,
  WalletTransactionStatus,
} from "@prisma/client";

const bodySchema = z.object({
  amount: z.coerce.number().positive(),
  bankAccountId: z.string().min(1),
});

function generateReference(prefix = "WD"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    const result = await prisma.$transaction(
      async (tx) => {
        // Find the OPEN wallet
        const openWallet = await tx.wallet.findFirst({
          where: { userId: user.id, type: WalletType.FARMER_OPEN },
        });
        if (!openWallet) throw new Error("Payout wallet not found");
        if (openWallet.isFrozen) throw new Error("Payout wallet is frozen");
        if (openWallet.status !== "ACTIVE")
          throw new Error("Payout wallet is not active");

        // Verify the bank account belongs to the user
        const bank = await tx.bankAccount.findFirst({
          where: { id: data.bankAccountId, userId: user.id },
        });
        if (!bank) throw new Error("Bank account not found");

        const amount = data.amount;
        if (Number(openWallet.availableBalance) < amount) {
          throw new Error("Insufficient balance");
        }

        // Create withdrawal record
        const withdrawal = await tx.walletWithdrawal.create({
          data: {
            walletId: openWallet.id,
            bankAccountId: bank.id,
            amount,
            fee: 0,
            netAmount: amount,
            reference: generateReference("WD"),
            status: WalletTransactionStatus.PENDING,
          },
        });

        // Debit the wallet
        const before = Number(openWallet.balance);
        const after = before - amount;

        await tx.walletTransaction.create({
          data: {
            walletId: openWallet.id,
            userId: user.id,
            type: WalletTransactionType.DEBIT,
            category: WalletCategory.WITHDRAWAL,
            amount,
            balanceBefore: before,
            balanceAfter: after,
            reference: generateReference("WTX"),
            description: `Withdrawal to ${bank.bank_name} • ${bank.account_number}`,
            status: WalletTransactionStatus.PENDING,
            withdrawalId: withdrawal.id,
          },
        });

        await tx.wallet.update({
          where: { id: openWallet.id },
          data: {
            balance: { decrement: amount },
            ledgerBalance: { decrement: amount },
            availableBalance: { decrement: amount },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "WALLET_WITHDRAWAL",
            entity_type: "WALLET_WITHDRAWAL",
            entity_id: withdrawal.id,
            new_values: JSON.stringify({
              amount,
              bankAccountId: bank.id,
              reference: withdrawal.reference,
            }),
            success: true,
          },
        });

        return {
          reference: withdrawal.reference,
          amount,
        };
      },
      { timeout: 60000, maxWait: 60000 }
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/wallet/withdraw] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to withdraw" },
      { status: 400 }
    );
  }
}