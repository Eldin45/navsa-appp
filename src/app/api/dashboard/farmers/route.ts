// src/app/api/dashboard/farmers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { UserRole, WalletType } from "@prisma/client";
import { createWalletWithVA } from "~/lib/services/wallet.service";
import { sendAdminCredentialsEmail } from "~/lib/email/utils";

// ============================================================
// HELPERS
// ============================================================

const createFarmerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .min(7)
    .regex(/^\d+$/, "Phone must contain only digits"),
  farmer_code: z.string().optional(),
  primary_crops: z.string().optional(),
  years_farming: z.coerce.number().int().min(0).optional(),
  total_land_ha: z.coerce.number().min(0).optional(),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

// ============================================================
// GET
// ============================================================

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const orgId = user.organizationId ?? "__none__";
  const where = isSuperAdmin
    ? { role: "FARMER" as const }
    : { role: "FARMER" as const, organizationId: orgId };

  const farmers = await prisma.user.findMany({
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
      organizationId: true,
      farmerProfile: {
        select: {
          farmer_code: true,
          primary_crops: true,
          years_farming: true,
          total_land_ha: true,
        },
      },
      wallets: {
        select: {
          id: true,
          type: true,
          accountNumber: true,
          balance: true,
          palmPayAccountNumber: true,
          palmPayBankName: true,
          palmPayStatus: true,
        },
      },
      _count: { select: { farms: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: farmers.map((f) => ({
      id: f.id,
      name: f.full_name,
      email: f.email,
      phone: f.phone,
      status: f.status,
      createdAt: f.created_at.toISOString(),
      lastLogin: f.last_login ? f.last_login.toISOString() : null,
      mustChangePassword: f.must_change_password,
      organizationId: f.organizationId,
      profile: f.farmerProfile
        ? {
            farmerCode: f.farmerProfile.farmer_code,
            primaryCrops: f.farmerProfile.primary_crops,
            yearsFarming: f.farmerProfile.years_farming,
            totalLandHa: f.farmerProfile.total_land_ha,
          }
        : null,
      wallets: f.wallets.map((w) => ({
        id: w.id,
        type: w.type,
        accountNumber: w.accountNumber,
        balance: Number(w.balance),
        palmPayAccountNumber: w.palmPayAccountNumber,
        palmPayBankName: w.palmPayBankName,
        palmPayStatus: w.palmPayStatus,
      })),
      farmCount: f._count.farms,
    })),
  });
}

// ============================================================
// POST
// ============================================================

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();

  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  if (caller.role === "ADMIN" && !caller.organizationId) {
    return NextResponse.json(
      { success: false, error: "Admin has no organization linked" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const data = createFarmerSchema.parse(body);

    const email = data.email.trim().toLowerCase();
    const phone = normalizePhone(data.phone);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "Phone number already in use" },
        { status: 409 }
      );
    }

    const defaultPassword = phone;
    const password_hash = await hash(defaultPassword, 12);

    const organizationId =
      caller.role === "ADMIN" ? caller.organizationId : null;

    const farmer = await prisma.$transaction(
      async (tx) => {
        const u = await tx.user.create({
          data: {
            email,
            password_hash,
            full_name: data.full_name,
            phone,
            role: UserRole.FARMER,
            status: "ACTIVE",
            organizationId,
            createdById: caller.id,
            must_change_password: true,
          },
        });

        await tx.farmerProfile.create({
          data: {
            userId: u.id,
            organizationId,
            farmer_code: data.farmer_code,
            primary_crops: data.primary_crops,
            years_farming: data.years_farming,
            total_land_ha: data.total_land_ha,
          },
        });

        await createWalletWithVA(tx, {
          userId: u.id,
          type: WalletType.FARMER_CLOSED,
          accountName: `${data.full_name} - Input Wallet`,
          prefix: "41",
          holder: { name: data.full_name, email, phone },
        });

        await createWalletWithVA(tx, {
          userId: u.id,
          type: WalletType.FARMER_OPEN,
          accountName: `${data.full_name} - Payout Wallet`,
          prefix: "42",
          holder: { name: data.full_name, email, phone },
        });

        await tx.userPreferences.create({
          data: { userId: u.id, timezone: "Africa/Lagos" },
        });

        await tx.notification.create({
          data: {
            userId: u.id,
            title: "Welcome to NAVSA",
            body: `Your farmer account has been created. Check your email for credentials.`,
            type: "SYSTEM",
          },
        });

        await tx.auditLog.create({
          data: {
            userId: caller.id,
            action: "CREATE_FARMER",
            entity_type: "USER",
            entity_id: u.id,
            new_values: JSON.stringify({ email, phone, organizationId }),
            success: true,
          },
        });

        return u;
      },
      { timeout: 60000, maxWait: 60000 }
    );

    const loginUrl = `${
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    }/`;

    sendAdminCredentialsEmail({
      to: email,
      name: data.full_name,
      email,
      password: defaultPassword,
      loginUrl,
    }).catch((err) => console.error("farmer email error:", err));

    console.log(`✅ Farmer created: ${email} | password = ${phone}`);

    return NextResponse.json(
      {
        success: true,
        message: "Farmer created. Credentials have been emailed.",
        data: {
          userId: farmer.id,
          email: farmer.email,
          name: farmer.full_name,
          phone: farmer.phone,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "A record with this information already exists",
        },
        { status: 409 }
      );
    }
    console.error("[/api/dashboard/farmers] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create farmer" },
      { status: 400 }
    );
  }
}