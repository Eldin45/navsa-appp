// src/lib/services/palmpay-recovery.service.ts
import { prisma } from "../db";
// import { palmPay } from "../palmpay/client";
import { palmPay } from "../palmpay/clients";

export async function retryFailedVirtualAccounts() {
  const wallets = await prisma.wallet.findMany({
    where: { palmPayStatus: "FAILED" },
    include: { user: { select: { full_name: true, email: true, phone: true } } },
    take: 50,
  });

  for (const w of wallets) {
    try {
      const va = await palmPay.createVirtualAccount({
        reference: w.palmPayAccountReference || `NAVSA-WALLET-${w.id}`,
        customerName: w.user.full_name,
        customerEmail: w.user.email,
        customerPhone: w.user.phone ?? undefined,
      });

      await prisma.wallet.update({
        where: { id: w.id },
        data: {
          palmPayCustomerId: va.customerId,
          palmPayAccountNumber: va.accountNumber,
          palmPayAccountName: va.accountName,
          palmPayBankName: va.bankName,
          palmPayBankCode: va.bankCode,
          palmPayStatus: "ACTIVE",
          palmPayCreatedAt: new Date(),
          palmPayMetadata: va.raw,
        },
      });

      console.log(`✅ Recovered VA for wallet ${w.id}`);
    } catch (err: any) {
      console.error(`❌ Still failed for ${w.id}:`, err.message);
    }
  }
}