// src/app/api/webhooks/palmpay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/db";
// import { palmPay } from "~/lib/palmpay/client";
import { palmPay } from "~/lib/palmpay/clients";
import {
  WalletTransactionType,
  WalletTransactionStatus,
  WalletCategory,
  WalletFundingSource,
  WalletFundingStatus,
} from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-palmpay-signature") ||
    req.headers.get("x-signature") ||
    "";

  const signatureValid = palmPay.verifyWebhookSignature(rawBody, signature);

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId =
    payload.eventId ||
    payload.transactionId ||
    `${payload.reference}-${Date.now()}`;
  const eventType = payload.eventType || payload.event;

  const existing = await prisma.palmPayWebhookEvent.findUnique({
    where: { eventId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicated: true });
  }

  const webhookEvent = await prisma.palmPayWebhookEvent.create({
    data: {
      eventId,
      eventType: eventType || "unknown",
      reference: payload.reference || null,
      accountNumber:
        payload.accountNumber || payload.virtualAccountNumber || null,
      amount: payload.amount ? Number(payload.amount) : null,
      currency: payload.currency || "NGN",
      payload,
      signature,
      signatureValid,
      processed: false,
    },
  });

  if (!signatureValid) {
    await prisma.palmPayWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { errorMessage: "Invalid signature" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (
      eventType === "virtual_account.credit" ||
      eventType === "transfer.success" ||
      eventType === "collection.success"
    ) {
      await handleIncomingTransfer(webhookEvent.id, payload);
    }

    await prisma.palmPayWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true, processedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await prisma.palmPayWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { errorMessage: err.message },
    });
    console.error("PalmPay webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleIncomingTransfer(webhookEventId: string, payload: any) {
  const accountNumber =
    payload.accountNumber || payload.virtualAccountNumber;
  const amount = Number(payload.amount);
  const providerRef =
    payload.transactionId || payload.sessionId || payload.reference;

  if (!accountNumber || !amount) {
    throw new Error("Missing accountNumber or amount");
  }

  const wallet = await prisma.wallet.findUnique({
    where: { palmPayAccountNumber: accountNumber },
  });
  if (!wallet) throw new Error("Wallet not found for account " + accountNumber);

  const existingTx = await prisma.walletTransaction.findUnique({
    where: { reference: providerRef },
  });
  if (existingTx) return;

  await prisma.$transaction(async (tx) => {
    const funding = await tx.walletFunding.create({
      data: {
        walletId: wallet.id,
        amount,
        reference: providerRef,
        source: WalletFundingSource.BANK_TRANSFER,
        status: WalletFundingStatus.SUCCESS,
        provider: "PALMPAY",
        providerReference: providerRef,
        providerPayload: payload,
        completedAt: new Date(),
      },
    });

    const before = Number(wallet.balance);
    const after = before + amount;

    const wtx = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: wallet.userId,
        type: WalletTransactionType.CREDIT,
        category: WalletCategory.FUNDING,
        amount,
        balanceBefore: before,
        balanceAfter: after,
        reference: providerRef,
        description: `Bank transfer via PalmPay (${payload.senderName || "unknown sender"})`,
        status: WalletTransactionStatus.SUCCESS,
        fundingId: funding.id,
        completedAt: new Date(),
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        ledgerBalance: { increment: amount },
        availableBalance: { increment: amount },
      },
    });

    await tx.notification.create({
      data: {
        userId: wallet.userId,
        title: "Wallet credited",
        body: `You received ₦${amount.toLocaleString()} into your ${wallet.type} wallet.`,
        type: "WALLET_FUNDED",
        reference_type: "WALLET_TRANSACTION",
        reference_id: wtx.id,
      },
    });

    await tx.palmPayWebhookEvent.update({
      where: { id: webhookEventId },
      data: { walletId: wallet.id, walletFundingId: funding.id },
    });
  });
}