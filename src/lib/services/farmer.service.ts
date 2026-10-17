// src/lib/services/farmer.service.ts
import { prisma } from "../db";
import { hash } from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import { UserRole, WalletType } from "@prisma/client";
import { createWalletWithVA } from "./wallet.service";

export const createFarmerSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  phone: z.string().min(7),
  farmer_code: z.string().optional(),
  primary_crops: z.string().optional(),
  years_farming: z.coerce.number().int().min(0).optional(),
  total_land_ha: z.coerce.number().min(0).optional(),
});

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;

export async function createFarmerByAdmin(
  data: CreateFarmerInput,
  adminId: string,
  request?: Request
) {
  const caller = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!caller || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(caller.role))
    throw new Error("Only ADMIN or SUPER_ADMIN can create farmers");
  if (!caller.organizationId && caller.role === UserRole.ADMIN)
    throw new Error("Admin is not linked to an organization");

  const email = data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists");

  const existingPhone = await prisma.user.findFirst({ where: { phone: data.phone } });
  if (existingPhone) throw new Error("Phone number already in use");

  const tempPassword = crypto.randomBytes(8).toString("hex");
  const password_hash = await hash(tempPassword, 12);

  const result = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password_hash,
          full_name: data.full_name,
          phone: data.phone,
          role: UserRole.FARMER,
          status: "ACTIVE",
          organizationId: caller.organizationId,
          createdById: adminId,
          must_change_password: true,
        },
      });

      await tx.farmerProfile.create({
        data: {
          userId: user.id,
          organizationId: caller.organizationId,
          farmer_code: data.farmer_code,
          primary_crops: data.primary_crops,
          years_farming: data.years_farming,
          total_land_ha: data.total_land_ha,
        },
      });

      const holder = {
        name: data.full_name,
        email: data.email,
        phone: data.phone,
      };

      // FARMER gets TWO wallets, each with a PalmPay virtual account
      await createWalletWithVA(tx, {
        userId: user.id,
        type: WalletType.FARMER_CLOSED,
        accountName: `${data.full_name} - Input Wallet`,
        prefix: "41",
        holder,
      });

      await createWalletWithVA(tx, {
        userId: user.id,
        type: WalletType.FARMER_OPEN,
        accountName: `${data.full_name} - Payout Wallet`,
        prefix: "42",
        holder,
      });

      await tx.userPreferences.create({
        data: { userId: user.id, timezone: "Africa/Lagos" },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "CREATE_FARMER",
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
          body: `Your farmer account has been created by your organization.`,
          type: "SYSTEM",
        },
      });

      return { user };
    },
    { timeout: 60000, maxWait: 60000 }
  );

  console.log(`✅ Farmer created ${data.email}. Temp password: ${tempPassword}`);
  return result;
}

export async function listFarmersByOrganization(
  requesterId: string,
  filter?: { search?: string }
) {
  const caller = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true, organizationId: true },
  });
  if (!caller || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(caller.role))
    throw new Error("Forbidden");

  const orgId = caller.role === UserRole.ADMIN ? caller.organizationId : undefined;

  return prisma.user.findMany({
    where: {
      role: UserRole.FARMER,
      ...(orgId ? { organizationId: orgId } : {}),
      ...(filter?.search
        ? {
            OR: [
              { email: { contains: filter.search } },
              { full_name: { contains: filter.search } },
              { phone: { contains: filter.search } },
            ],
          }
        : {}),
    },
    include: {
      farmerProfile: true,
      wallets: {
        select: {
          id: true,
          type: true,
          accountNumber: true,
          balance: true,
          palmPayAccountNumber: true,
          palmPayBankName: true,
          palmPayAccountName: true,
          palmPayStatus: true,
        },
      },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
}