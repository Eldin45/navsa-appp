import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { UserRole, WalletType, UserStatus } from "@prisma/client";
import { createWalletWithVA } from "~/lib/services/wallet.service";
import { sendAdminCredentialsEmail } from "~/lib/email/utils";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .min(7)
    .regex(/^\d+$/, "Phone must contain only digits"),
  role: z.enum(["ADMIN", "FARMER", "SUPPLIER"]),
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

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const where =
    user.role === "SUPER_ADMIN"
      ? {}
      : { organizationId: user.organizationId ?? "__none__" };

  const users = await prisma.user.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 500,
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      created_at: true,
      last_login: true,
    },
  });

  return NextResponse.json({ success: true, data: users });
}

// ============================================================
// POST
// ============================================================

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();
  if (!caller || !["ADMIN", "SUPER_ADMIN"].includes(caller.role)) {
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
    const data = createSchema.parse(body);

    // -------------------------------------------------------
    // Permission gate for creating ADMINs
    // -------------------------------------------------------
    if (data.role === "ADMIN") {
      if (caller.role === "SUPER_ADMIN") {
        // allowed
      } else {
        // caller is ADMIN — only the PRIMARY admin of the org can
        // create sub-admins. "Primary" = the oldest ADMIN in the org
        // (the one created first, which is the org representative).
        const primary = await prisma.user.findFirst({
          where: {
            role: "ADMIN",
            organizationId: caller.organizationId!,
          },
          orderBy: { created_at: "asc" },
          select: { id: true },
        });

        if (!primary || primary.id !== caller.id) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Only the primary organization admin can create sub-admins",
            },
            { status: 403 }
          );
        }
      }
    }

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

    // Sub-admins (ADMIN created by ADMIN) share the org with their creator.
    // SUPER_ADMIN creates standalone admins with no org unless passed.
    const organizationId =
      data.role === "ADMIN" && caller.role === "SUPER_ADMIN"
        ? null
        : caller.organizationId;

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password_hash,
            full_name: data.full_name,
            phone,
            role: data.role as UserRole,
            status: UserStatus.ACTIVE,
            organizationId,
            createdById: caller.id,
            must_change_password: true,
          },
        });

        if (data.role === "FARMER") {
          await tx.farmerProfile.create({
            data: { userId: user.id, organizationId },
          });

          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.FARMER_CLOSED,
            accountName: `${data.full_name} - Input Wallet`,
            prefix: "41",
            holder: { name: data.full_name, email, phone },
          });

          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.FARMER_OPEN,
            accountName: `${data.full_name} - Payout Wallet`,
            prefix: "42",
            holder: { name: data.full_name, email, phone },
          });
        } else if (data.role === "ADMIN") {
          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.ADMIN,
            accountName: `${data.full_name} - Admin Wallet`,
            prefix: "43",
            holder: { name: data.full_name, email, phone },
          });
        } else if (data.role === "SUPPLIER") {
          await tx.supplierProfile.create({
            data: {
              userId: user.id,
              organizationId,
              business_name: data.full_name,
            },
          });

          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.SUPPLIER,
            accountName: `${data.full_name} - Supplier Wallet`,
            prefix: "44",
            holder: { name: data.full_name, email, phone },
          });
        }

        await tx.userPreferences.create({
          data: { userId: user.id, timezone: "Africa/Lagos" },
        });

        await tx.auditLog.create({
          data: {
            userId: caller.id,
            action: "CREATE_USER",
            entity_type: "USER",
            entity_id: user.id,
            new_values: JSON.stringify({
              email,
              role: data.role,
              organizationId,
            }),
            success: true,
          },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Welcome to NAVSA",
            body: `Your ${data.role.toLowerCase()} account has been created.`,
            type: "SYSTEM",
          },
        });

        return user;
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
    }).catch((err) => console.error("email error:", err));

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: result.id,
          email: result.email,
          phone: result.phone,
          role: result.role,
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
    console.error("[/api/dashboard/settings/users] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create user" },
      { status: 400 }
    );
  }
}