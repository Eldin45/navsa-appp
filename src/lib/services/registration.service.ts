// src/lib/services/registration.service.ts
import { prisma } from "../db";
import { hash } from "bcrypt";
import { z } from "zod";
import { UserRole, WalletType } from "@prisma/client";

export const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  role: z.literal("FARMER"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

function generateAccountNumber(prefix = "40"): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${ts}${rand}`;
}

async function uniqueAccountNumber(tx: any, prefix: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateAccountNumber(prefix);
    const existing = await tx.wallet.findUnique({
      where: { account_number: candidate },
    });
    if (!existing) return candidate;
  }
  throw new Error("Failed to generate unique account number");
}

export async function registerSystemUser(
  data: RegistrationInput,
  request?: Request
) {
  const hashedPassword = await hash(data.password, 12);

  return prisma.$transaction(
    async (tx) => {
      const email = data.email.trim().toLowerCase();

      const user = await tx.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          full_name: data.full_name,
          phone: data.phone || null,
          role: UserRole.FARMER,
          status: "ACTIVE",
        },
      });

      await tx.farmerProfile.create({ data: { userId: user.id } });

      const closedNumber = await uniqueAccountNumber(tx, "41");
      const openNumber = await uniqueAccountNumber(tx, "42");

      const closed = await tx.wallet.create({
        data: {
          userId: user.id,
          type: WalletType.CLOSED,
          account_number: closedNumber,
          account_name: `${data.full_name} - Input Wallet`,
        },
      });

      // ⚠️ Wallet has @@unique on userId — remove that constraint in the schema
      // if you want two wallets per farmer. See the note below.
      const open = await tx.wallet.create({
        data: {
          userId: user.id,
          type: WalletType.OPEN,
          account_number: openNumber,
          account_name: `${data.full_name} - Payout Wallet`,
        },
      });

      await tx.userPreferences.create({
        data: { userId: user.id, timezone: "Africa/Lagos" },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "REGISTER",
          entity_type: "USER",
          entity_id: user.id,
          ip_address:
            request?.headers?.get("x-forwarded-for") ||
            request?.headers?.get("x-real-ip") ||
            null,
          user_agent: request?.headers?.get("user-agent") || null,
          success: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to NAVSA",
          body: `Hi ${data.full_name}, your farmer account is ready.`,
          type: "SYSTEM",
        },
      });

      return {
        user: { id: user.id, email: user.email, name: user.full_name },
        role: user.role,
        wallets: [
          { id: closed.id, type: closed.type, account_number: closed.account_number },
          { id: open.id, type: open.type, account_number: open.account_number },
        ],
      };
    },
    { timeout: 60000, maxWait: 60000 }
  );
}