// src/lib/services/seed-super-admin.service.ts
import { prisma } from "../db";
import { hash } from "bcrypt";
import { UserRole, WalletType } from "@prisma/client";

/**
 * Create (or upsert) the platform SUPER_ADMIN.
 * Run this ONCE via a seed script — never expose via public signup.
 *
 * Usage:
 *   npx tsx src/lib/services/seed-super-admin.service.ts
 */
export async function seedSuperAdmin(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const password_hash = await hash(input.password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Super admin already exists: ${email}`);
    return existing;
  }

  const superAdmin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password_hash,
        full_name: input.full_name,
        phone: input.phone || null,
        role: UserRole.SUPER_ADMIN,
        status: "ACTIVE",
      },
    });

    await tx.wallet.create({
      data: {
        userId: user.id,
        type: WalletType.SUPER_ADMIN,
        account_number: `10${Date.now().toString().slice(-8)}`,
        account_name: `${input.full_name} - Super Admin Wallet`,
      },
    });

    await tx.userPreferences.create({
      data: { userId: user.id, timezone: "Africa/Lagos" },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "SEED_SUPER_ADMIN",
        entity_type: "USER",
        entity_id: user.id,
        success: true,
      },
    });

    return user;
  });

  console.log("✅ Super admin seeded:", superAdmin.id, superAdmin.email);
  return superAdmin;
}

// If executed directly
if (require.main === module) {
  seedSuperAdmin({
    email: process.env.SUPER_ADMIN_EMAIL || "admin@navsa.ng",
    password: process.env.SUPER_ADMIN_PASSWORD || "ChangeMe123!",
    full_name: process.env.SUPER_ADMIN_NAME || "NAVSA Super Admin",
    phone: process.env.SUPER_ADMIN_PHONE,
  })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}