// src/app/api/dashboard/farmers/[id]/fund-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const bodySchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

function generateReference(prefix = "FUND"): string {
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

  const { id: farmerId } = await params;

  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    const result = await prisma.$transaction(
      async (tx) => {
        const farmer = await tx.user.findUnique({
          where: { id: farmerId },
          select: {
            id: true,
            role: true,
            organizationId: true,
            full_name: true,
          },
        });
        if (!farmer || farmer.role !== "FARMER")
          throw new Error("Farmer not found");

        if (
          caller.role === "ADMIN" &&
          farmer.organizationId !== caller.organizationId
        ) {
          throw new Error("Farmer is not in your organization");
        }

        const adminWallet = await tx.wallet.findFirst({
          where: { userId: caller.id, type: WalletType.ADMIN },
        });
        if (!adminWallet) throw new Error("Admin wallet not found");

        const farmerClosed = await tx.wallet.findFirst({
          where: {
            userId: farmerId,
            type: WalletType.FARMER_CLOSED,
          },
        });
        if (!farmerClosed) throw new Error("Farmer closed wallet not found");

        const amount = data.amount;
        if (Number(adminWallet.availableBalance) < amount) {
          throw new Error("Insufficient organization balance");
        }

        // 1. WalletFunding record
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

        // 2. Credit farmer closed
        const fBefore = Number(farmerClosed.balance);
        const fAfter = fBefore + amount;

        await tx.walletTransaction.create({
          data: {
            walletId: farmerClosed.id,
            userId: farmerId,
            type: WalletTransactionType.CREDIT,
            category: WalletCategory.FUNDING,
            amount,
            balanceBefore: fBefore,
            balanceAfter: fAfter,
            reference: generateReference("WTX"),
            description:
              data.description ?? "Wallet funding from organization",
            status: WalletTransactionStatus.SUCCESS,
            fundingId: funding.id,
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

        // 3. Debit admin wallet
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
            description: `Funded farmer ${farmer.full_name}`,
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

        // 4. Audit + notify
        await tx.auditLog.create({
          data: {
            userId: caller.id,
            action: "FUND_FARMER_CLOSED_WALLET",
            entity_type: "WALLET",
            entity_id: farmerClosed.id,
            new_values: JSON.stringify({
              amount,
              farmerId,
              adminWalletId: adminWallet.id,
            }),
            success: true,
          },
        });

        await tx.notification.create({
          data: {
            userId: farmerId,
            title: "Input wallet funded",
            body: `₦${amount.toLocaleString()} was added to your input wallet.`,
            type: "WALLET_FUNDED",
            reference_type: "WALLET",
            reference_id: farmerClosed.id,
          },
        });

        return {
          amount,
          farmerId,
          farmerClosedWalletId: farmerClosed.id,
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
    console.error(
      "[/api/dashboard/farmers/[id]/fund-wallet] error:",
      err
    );
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fund farmer" },
      { status: 400 }
    );
  }
}