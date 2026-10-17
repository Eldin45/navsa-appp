// src/lib/services/wallet.service.ts
import { prisma } from "../db";
// import { palmPay } from "../palmpay/client";
import { palmPay } from "../palmpay/clients";
import {
  WalletType,
  WalletCategory,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletFundingSource,
  WalletFundingStatus,
} from "@prisma/client";

// ============================================================
// HELPERS
// ============================================================

function generateAccountNumber(prefix = "40"): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${ts}${rand}`;
}

function generateReference(prefix = "WTX"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ============================================================
// CREATE WALLET (raw)
// ============================================================

export async function createWallet(
  tx: any,
  userId: string,
  type: WalletType,
  accountName: string,
  prefix = "40"
) {
  let accountNumber = generateAccountNumber(prefix);
  for (let i = 0; i < 10; i++) {
    const existing = await tx.wallet.findUnique({ where: { accountNumber } });
    if (!existing) break;
    accountNumber = generateAccountNumber(prefix);
  }

  return tx.wallet.create({
    data: { userId, type, accountNumber, accountName, currency: "NGN" },
  });
}

// ============================================================
// ATTACH PALMPAY VIRTUAL ACCOUNT
// ============================================================

export async function attachPalmPayVirtualAccount(
  tx: any,
  walletId: string,
  holder: {
    name: string;
    email?: string;
    phone?: string;
    bvn?: string;
    nin?: string;
  }
) {
  const reference = `NAVSA-WALLET-${walletId}`;

  try {
    const va = await palmPay.createVirtualAccount({
      reference,
      customerName: holder.name,
      customerEmail: holder.email,
      customerPhone: holder.phone,
      bvn: holder.bvn,
      nin: holder.nin,
    });

    await tx.wallet.update({
      where: { id: walletId },
      data: {
        palmPayCustomerId: va.customerId,
        palmPayAccountNumber: va.accountNumber,
        palmPayAccountName: va.accountName,
        palmPayBankName: va.bankName,
        palmPayBankCode: va.bankCode,
        palmPayAccountReference: reference,
        palmPayStatus: va.status || "ACTIVE",
        palmPayCreatedAt: new Date(),
        palmPayMetadata: va.raw,
      },
    });

    return va;
  } catch (err: any) {
    await tx.wallet.update({
      where: { id: walletId },
      data: {
        palmPayAccountReference: reference,
        palmPayStatus: "FAILED",
        palmPayMetadata: { error: err.message },
      },
    });
    console.error(`⚠️ PalmPay VA failed for wallet ${walletId}:`, err.message);
    return null;
  }
}

// ============================================================
// CREATE WALLET + VA (single call)
// ============================================================

export async function createWalletWithVA(
  tx: any,
  args: {
    userId: string;
    type: WalletType;
    accountName: string;
    prefix?: string;
    holder: {
      name: string;
      email?: string;
      phone?: string;
      bvn?: string;
      nin?: string;
    };
  }
) {
  const wallet = await createWallet(
    tx,
    args.userId,
    args.type,
    args.accountName,
    args.prefix ?? "40"
  );
  await attachPalmPayVirtualAccount(tx, wallet.id, args.holder);
  return wallet;
}

// ============================================================
// FUND CLOSED WALLET (Admin → Farmer, internal)
// ============================================================

export async function fundClosedWallet(input: {
  adminId: string;
  farmerId: string;
  amount: number;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const adminWallet = await tx.wallet.findFirst({
      where: { userId: input.adminId, type: WalletType.ADMIN },
    });
    if (!adminWallet) throw new Error("Admin wallet not found");

    const farmerClosed = await tx.wallet.findFirst({
      where: { userId: input.farmerId, type: WalletType.FARMER_CLOSED },
    });
    if (!farmerClosed) throw new Error("Farmer closed wallet not found");

    const amount = input.amount;
    if (Number(adminWallet.availableBalance) < amount)
      throw new Error("Insufficient admin balance");

    const funding = await tx.walletFunding.create({
      data: {
        walletId: farmerClosed.id,
        amount,
        reference: generateReference("FUND"),
        source: WalletFundingSource.ADMIN_ALLOCATION,
        status: WalletFundingStatus.SUCCESS,
        initiatedById: input.adminId,
        completedAt: new Date(),
      },
    });

    const fBefore = Number(farmerClosed.balance);
    const fAfter = fBefore + amount;

    await tx.walletTransaction.create({
      data: {
        walletId: farmerClosed.id,
        userId: input.farmerId,
        type: WalletTransactionType.CREDIT,
        category: WalletCategory.FUNDING,
        amount,
        balanceBefore: fBefore,
        balanceAfter: fAfter,
        reference: generateReference("WTX"),
        description: input.description ?? "Input funding from Admin",
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

    const aBefore = Number(adminWallet.balance);
    const aAfter = aBefore - amount;

    await tx.walletTransaction.create({
      data: {
        walletId: adminWallet.id,
        userId: input.adminId,
        type: WalletTransactionType.DEBIT,
        category: WalletCategory.FUNDING,
        amount,
        balanceBefore: aBefore,
        balanceAfter: aAfter,
        reference: generateReference("WTX"),
        description: `Funded farmer ${input.farmerId}`,
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

    return { funding };
  });
}

// ============================================================
// PAY SUPPLIER FROM FARMER CLOSED
// ============================================================

export async function paySupplierForInput(input: {
  farmerId: string;
  supplierUserId: string;
  orderId: string;
  amount: number;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const farmerClosed = await tx.wallet.findFirst({
      where: { userId: input.farmerId, type: WalletType.FARMER_CLOSED },
    });
    if (!farmerClosed) throw new Error("Farmer closed wallet not found");

    const supplierWallet = await tx.wallet.findFirst({
      where: { userId: input.supplierUserId, type: WalletType.SUPPLIER },
    });
    if (!supplierWallet) throw new Error("Supplier wallet not found");

    if (Number(farmerClosed.availableBalance) < input.amount)
      throw new Error("Insufficient closed wallet balance");

    const amount = input.amount;

    const transfer = await tx.walletTransfer.create({
      data: {
        fromWalletId: farmerClosed.id,
        toWalletId: supplierWallet.id,
        amount,
        totalDebited: amount,
        reference: generateReference("TRF"),
        description: input.description ?? "Input payment",
        status: WalletTransactionStatus.SUCCESS,
        completedAt: new Date(),
      },
    });

    const fBefore = Number(farmerClosed.balance);
    const fAfter = fBefore - amount;

    await tx.walletTransaction.create({
      data: {
        walletId: farmerClosed.id,
        userId: input.farmerId,
        type: WalletTransactionType.DEBIT,
        category: WalletCategory.INPUT_PAYMENT,
        amount,
        balanceBefore: fBefore,
        balanceAfter: fAfter,
        reference: generateReference("WTX"),
        description: "Input order payment",
        status: WalletTransactionStatus.SUCCESS,
        debitTransferId: transfer.id,
        inputOrderId: input.orderId,
        completedAt: new Date(),
      },
    });

    await tx.wallet.update({
      where: { id: farmerClosed.id },
      data: {
        balance: { decrement: amount },
        ledgerBalance: { decrement: amount },
        availableBalance: { decrement: amount },
      },
    });

    const sBefore = Number(supplierWallet.balance);
    const sAfter = sBefore + amount;

    await tx.walletTransaction.create({
      data: {
        walletId: supplierWallet.id,
        userId: input.supplierUserId,
        type: WalletTransactionType.CREDIT,
        category: WalletCategory.INPUT_PAYMENT,
        amount,
        balanceBefore: sBefore,
        balanceAfter: sAfter,
        reference: generateReference("WTX"),
        description: "Input order received payment",
        status: WalletTransactionStatus.SUCCESS,
        creditTransferId: transfer.id,
        completedAt: new Date(),
      },
    });

    await tx.wallet.update({
      where: { id: supplierWallet.id },
      data: {
        balance: { increment: amount },
        ledgerBalance: { increment: amount },
        availableBalance: { increment: amount },
      },
    });

    return { transfer };
  });
}

// ============================================================
// HARVEST PAYOUT → FARMER OPEN
// ============================================================

export async function payoutHarvest(input: {
  adminId: string;
  farmerId: string;
  farmId: string;
  cycleId?: string;
  harvestId?: string;
  amount: number;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const adminWallet = await tx.wallet.findFirst({
      where: { userId: input.adminId, type: WalletType.ADMIN },
    });
    if (!adminWallet) throw new Error("Admin wallet not found");

    const farmerOpen = await tx.wallet.findFirst({
      where: { userId: input.farmerId, type: WalletType.FARMER_OPEN },
    });
    if (!farmerOpen) throw new Error("Farmer open wallet not found");

    const amount = input.amount;
    if (Number(adminWallet.availableBalance) < amount)
      throw new Error("Insufficient admin balance");

    const payout = await tx.harvestPayout.create({
      data: {
        harvestId: input.harvestId,
        cycleId: input.cycleId,
        farmId: input.farmId,
        farmerId: input.farmerId,
        paidById: input.adminId,
        amount,
        toWalletId: farmerOpen.id,
        status: WalletTransactionStatus.SUCCESS,
        reference: generateReference("PAY"),
        notes: input.notes,
        completedAt: new Date(),
      },
    });

    const fBefore = Number(farmerOpen.balance);
    const fAfter = fBefore + amount;

    await tx.walletTransaction.create({
      data: {
        walletId: farmerOpen.id,
        userId: input.farmerId,
        type: WalletTransactionType.CREDIT,
        category: WalletCategory.HARVEST_PAYOUT,
        amount,
        balanceBefore: fBefore,
        balanceAfter: fAfter,
        reference: generateReference("WTX"),
        description: input.notes ?? "Harvest payout",
        status: WalletTransactionStatus.SUCCESS,
        harvestPayoutId: payout.id,
        completedAt: new Date(),
      },
    });

    await tx.wallet.update({
      where: { id: farmerOpen.id },
      data: {
        balance: { increment: amount },
        ledgerBalance: { increment: amount },
        availableBalance: { increment: amount },
      },
    });

    const aBefore = Number(adminWallet.balance);
    const aAfter = aBefore - amount;

    await tx.walletTransaction.create({
      data: {
        walletId: adminWallet.id,
        userId: input.adminId,
        type: WalletTransactionType.DEBIT,
        category: WalletCategory.HARVEST_PAYOUT,
        amount,
        balanceBefore: aBefore,
        balanceAfter: aAfter,
        reference: generateReference("WTX"),
        description: `Harvest payout to farmer ${input.farmerId}`,
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

    return { payout };
  });
}

// ============================================================
// WITHDRAW FROM OPEN WALLET
// ============================================================

export async function withdrawFromOpenWallet(input: {
  farmerId: string;
  amount: number;
  bankAccountId: string;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const openWallet = await tx.wallet.findFirst({
      where: { userId: input.farmerId, type: WalletType.FARMER_OPEN },
    });
    if (!openWallet) throw new Error("Open wallet not found");
    if (Number(openWallet.availableBalance) < input.amount)
      throw new Error("Insufficient balance");

    const amount = input.amount;

    const withdrawal = await tx.walletWithdrawal.create({
      data: {
        walletId: openWallet.id,
        bankAccountId: input.bankAccountId,
        amount,
        netAmount: amount,
        reference: generateReference("WD"),
        status: WalletTransactionStatus.PENDING,
      },
    });

    const before = Number(openWallet.balance);
    const after = before - amount;

    await tx.walletTransaction.create({
      data: {
        walletId: openWallet.id,
        userId: input.farmerId,
        type: WalletTransactionType.DEBIT,
        category: WalletCategory.WITHDRAWAL,
        amount,
        balanceBefore: before,
        balanceAfter: after,
        reference: generateReference("WTX"),
        description: input.description ?? "Withdrawal to bank",
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

    return withdrawal;
  });
}