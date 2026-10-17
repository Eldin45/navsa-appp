// src/lib/services/admin.service.ts
import { prisma } from "../db";
import { hash } from "bcrypt";
import { z } from "zod";
import { UserRole, WalletType, UserStatus } from "@prisma/client";
import { createWalletWithVA } from "./wallet.service";
import { sendAdminCredentialsEmail } from "../email/utils";

// ============================================================
// SCHEMAS
// ============================================================

/**
 * Platform admins are part of the system ownership.
 * No organization is attached at creation time.
 * Only SUPER_ADMIN can create them.
 */
export const createAdminSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  phone: z
    .string()
    .min(7)
    .regex(/^\d+$/, "Phone must contain only digits"),
  notes: z.string().optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const updateAdminStatusSchema = z.object({
  adminId: z.string(),
  status: z.nativeEnum(UserStatus),
  reason: z.string().optional(),
});

export type UpdateAdminStatusInput = z.infer<typeof updateAdminStatusSchema>;

// ============================================================
// HELPERS
// ============================================================

function generateAccountNumber(prefix = "43"): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${ts}${rand}`;
}

async function uniqueAccountNumber(tx: any, prefix: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = generateAccountNumber(prefix);
    const existing = await tx.wallet.findUnique({
      where: { accountNumber: candidate },
    });
    if (!existing) return candidate;
  }
  throw new Error("Failed to generate a unique wallet account number");
}

/**
 * Normalizes a phone number to a Nigeria-style digit string.
 * Used as the default password.
 *
 *   "+2348012345678" → "08012345678"
 *   "2348012345678"  → "08012345678"
 *   "08012345678"    → "08012345678"
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

// ============================================================
// CREATE PLATFORM ADMIN  (SUPER_ADMIN only)
// ============================================================

export async function createAdmin(
  data: CreateAdminInput,
  createdById: string,
  request?: Request
) {
  // 1. Verify caller is SUPER_ADMIN
  const caller = await prisma.user.findUnique({
    where: { id: createdById },
    select: { id: true, role: true },
  });
  if (!caller || caller.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Only SUPER_ADMIN can create platform admins");
  }

  const email = data.email.trim().toLowerCase();
  const phone = normalizePhone(data.phone);

  // 2. Uniqueness checks
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("A user with this email already exists");

  const existingPhone = await prisma.user.findFirst({ where: { phone } });
  if (existingPhone) throw new Error("Phone number already in use");

  // 3. Default password = phone number
  const defaultPassword = phone;
  const password_hash = await hash(defaultPassword, 12);

  // 4. Transaction
  const result = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password_hash,
          full_name: data.full_name,
          phone,
          // Platform admins get their own role — distinct from org admins.
          role: UserRole.PLATFORM_ADMIN,
          status: UserStatus.ACTIVE,
          // Platform-level — no organizationId
          organizationId: null,
          createdById,
          must_change_password: true,
        },
      });

      // Wallet with PalmPay virtual account
      await createWalletWithVA(tx, {
        userId: user.id,
        type: WalletType.ADMIN,
        accountName: `${data.full_name} - Admin Wallet`,
        prefix: "43",
        holder: {
          name: data.full_name,
          email,
          phone,
        },
      });

      await tx.userPreferences.create({
        data: { userId: user.id, timezone: "Africa/Lagos" },
      });

      await tx.auditLog.create({
        data: {
          userId: createdById,
          action: "CREATE_PLATFORM_ADMIN",
          entity_type: "USER",
          entity_id: user.id,
          new_values: JSON.stringify({
            email,
            full_name: data.full_name,
            phone,
            role: "PLATFORM_ADMIN",
            scope: "PLATFORM",
          }),
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
          body: `Your platform admin account has been created. Check your email for credentials.`,
          type: "SYSTEM",
        },
      });

      return { user };
    },
    { timeout: 60000, maxWait: 60000 }
  );

  // 5. Credentials email (fire-and-forget)
  const loginUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  }/`;

  sendAdminCredentialsEmail({
    to: email,
    name: data.full_name,
    email,
    password: defaultPassword,
    loginUrl,
  })
    .then((ok) => {
      if (ok)
        console.log(`📧 Platform admin credentials email sent to ${email}`);
      else console.error(`❌ Failed to send credentials email to ${email}`);
    })
    .catch((err) => console.error("credentials email error:", err));

  console.log(
    `✅ Platform admin created: ${email} | default password: ${phone}`
  );

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.full_name,
      role: result.user.role,
      phone: result.user.phone,
    },
  };
}

// ============================================================
// LIST PLATFORM ADMINS
// ============================================================

export async function listAdmins(
  requesterId: string,
  opts?: { search?: string }
) {
  const caller = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { id: true, role: true },
  });
  if (!caller || caller.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Forbidden");
  }

  const where: any = {
    role: UserRole.PLATFORM_ADMIN,
    // Platform-level admins only (no org attachment)
    organizationId: null,
  };
  if (opts?.search) {
    where.OR = [
      { email: { contains: opts.search } },
      { full_name: { contains: opts.search } },
      { phone: { contains: opts.search } },
    ];
  }

  return prisma.user.findMany({
    where,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      status: true,
      created_at: true,
      last_login: true,
      must_change_password: true,
      wallets: {
        select: {
          id: true,
          type: true,
          accountNumber: true,
          balance: true,
          availableBalance: true,
          palmPayAccountNumber: true,
          palmPayBankName: true,
          palmPayStatus: true,
        },
      },
      createdBy: { select: { id: true, full_name: true, email: true } },
    },
  });
}

// ============================================================
// UPDATE ADMIN STATUS
// ============================================================

export async function updateAdminStatus(
  data: UpdateAdminStatusInput,
  actorId: string,
  request?: Request
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true },
  });
  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Only SUPER_ADMIN can change admin status");
  }

  const target = await prisma.user.findUnique({
    where: { id: data.adminId },
    select: { id: true, role: true, email: true },
  });
  if (!target || target.role !== UserRole.PLATFORM_ADMIN) {
    throw new Error("Admin not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: data.adminId },
      data: { status: data.status },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "UPDATE_ADMIN_STATUS",
        entity_type: "USER",
        entity_id: u.id,
        new_values: JSON.stringify({
          status: data.status,
          reason: data.reason ?? null,
        }),
        ip_address:
          request?.headers?.get("x-forwarded-for") ||
          request?.headers?.get("x-real-ip") ||
          null,
        user_agent: request?.headers?.get("user-agent") || null,
        success: true,
      },
    });

    return u;
  });

  return {
    id: updated.id,
    email: updated.email,
    status: updated.status,
  };
}

// ============================================================
// RESEND CREDENTIALS  (re-sends phone as password)
// ============================================================

export async function resendAdminCredentials(
  adminId: string,
  actorId: string
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true },
  });
  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Only SUPER_ADMIN can resend credentials");
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      phone: true,
    },
  });
  if (!admin || admin.role !== UserRole.PLATFORM_ADMIN) {
    throw new Error("Admin not found");
  }
  if (!admin.phone) {
    throw new Error("Admin has no phone number on file");
  }

  const defaultPassword = normalizePhone(admin.phone);
  const password_hash = await hash(defaultPassword, 12);

  await prisma.user.update({
    where: { id: admin.id },
    data: { password_hash, must_change_password: true },
  });

  const loginUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  }/`;

  const ok = await sendAdminCredentialsEmail({
    to: admin.email,
    name: admin.full_name,
    email: admin.email,
    password: defaultPassword,
    loginUrl,
  });

  console.log(
    `📧 Resent credentials to ${admin.email} | password = phone (${defaultPassword})`
  );

  return { ok, email: admin.email };
}