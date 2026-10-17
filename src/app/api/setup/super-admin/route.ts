// src/app/api/setup/super-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "~/lib/db";
import { UserRole, WalletType } from "@prisma/client";
import crypto from "crypto";

export const runtime = "nodejs";

// ============================================================
// HELPERS
// ============================================================

function generateAccountNumber(prefix = "10"): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${ts}${rand}`;
}

function isStrongPassword(pw: string): boolean {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[@$!%*?&]/.test(pw)
  );
}

// ============================================================
// POST /api/setup/super-admin
// Body: { secret, email, password, full_name, phone? }
// ============================================================

export async function POST(req: NextRequest) {
  // 1. Setup must be enabled
  if (process.env.SETUP_ENABLED !== "true") {
    return NextResponse.json(
      { success: false, error: "Setup is disabled" },
      { status: 403 }
    );
  }

  // 2. Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { secret, email, password, full_name, phone } = body ?? {};

  // 3. Verify setup secret
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json(
      { success: false, error: "Invalid setup secret" },
      { status: 401 }
    );
  }

  // 4. Validate input
  if (!email || !password || !full_name) {
    return NextResponse.json(
      { success: false, error: "email, password, and full_name are required" },
      { status: 400 }
    );
  }

  const emailLower = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json(
      { success: false, error: "Invalid email address" },
      { status: 400 }
    );
  }

  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Password must be ≥8 chars and include uppercase, lowercase, number, and special character (@$!%*?&)",
      },
      { status: 400 }
    );
  }

  // 5. Refuse if a SUPER_ADMIN already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true, email: true },
  });

  if (existingSuperAdmin) {
    return NextResponse.json(
      {
        success: false,
        error: "A SUPER_ADMIN already exists",
        data: { email: existingSuperAdmin.email },
      },
      { status: 409 }
    );
  }

  // 6. Refuse if the email is already taken
  const existingUser = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "Email already in use" },
      { status: 409 }
    );
  }

  // 7. Create super admin + wallet + preferences in one transaction
  const password_hash = await hash(password, 12);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: emailLower,
            password_hash,
            full_name: String(full_name).trim(),
            phone: phone ? String(phone).trim() : null,
            role: UserRole.SUPER_ADMIN,
            status: "ACTIVE",
          },
        });

        // Wallet (SA wallet — no PalmPay VA required for the platform owner)
        const wallet = await tx.wallet.create({
          data: {
            userId: user.id,
            type: WalletType.SUPER_ADMIN,
            accountNumber: generateAccountNumber("10"),
            accountName: `${full_name} - Super Admin Wallet`,
          },
        });

        await tx.userPreferences.create({
          data: { userId: user.id, timezone: "Africa/Lagos" },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "SETUP_SUPER_ADMIN",
            entity_type: "USER",
            entity_id: user.id,
            ip_address:
              req.headers.get("x-forwarded-for") ||
              req.headers.get("x-real-ip") ||
              null,
            user_agent: req.headers.get("user-agent") || null,
            success: true,
          },
        });

        return { user, wallet };
      },
      { timeout: 60000, maxWait: 60000 }
    );

    // 8. Disable setup automatically (belt-and-braces if the env can be changed at runtime)
    process.env.SETUP_ENABLED = "false";

    return NextResponse.json(
      {
        success: true,
        message:
          "SUPER_ADMIN created. Set SETUP_ENABLED=false in your env and redeploy, then delete or guard this route in production.",
        data: {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role,
          walletId: result.wallet.id,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Unique constraint violation" },
        { status: 409 }
      );
    }
    console.error("[setup/super-admin]", err);
    return NextResponse.json(
      { success: false, error: "Failed to create SUPER_ADMIN" },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/setup/super-admin
// Returns whether setup is still open (safe to expose — no secrets)
// ============================================================

export async function GET() {
  const setupEnabled = process.env.SETUP_ENABLED === "true";
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      setupEnabled,
      superAdminExists: !!existingSuperAdmin,
      canSetup: setupEnabled && !existingSuperAdmin,
    },
  });
}