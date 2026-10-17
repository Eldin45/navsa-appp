// src/app/api/dashboard/settings/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { UserRole, WalletType, UserStatus } from "@prisma/client";
import { createWalletWithVA } from "~/lib/services/wallet.service";
import { sendAdminCredentialsEmail } from "~/lib/email/utils";

export const dynamic = "force-dynamic";

const TAG = "[settings/users]";

// ============================================================
// MODULE-LOAD SANITY CHECK
// ============================================================
// Fires once when the server boots. Prints exactly which enum
// values the generated Prisma client knows about.
console.log(
  `${TAG} MODULE LOADED — UserRole enum values:`,
  Object.values(UserRole)
);
console.log(
  `${TAG} MODULE LOADED — WalletType enum values:`,
  Object.values(WalletType)
);

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalizes a phone number to Nigerian style and strips
 * every non-digit character.
 *   "+234 801 234 5678" → "08012345678"
 *   "0801-234-5678"     → "08012345678"
 *   "2348012345678"     → "08012345678"
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

// ============================================================
// SCHEMAS
// ============================================================

const createSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length >= 7, "Phone must have at least 7 digits"),
  role: z.enum(["ORG_ADMIN", "FARMER", "SUPPLIER"]),
});

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});

// ============================================================
// GET — list users visible to caller
// ============================================================

export async function GET() {
  console.log(`${TAG} ── GET ─────────────────────────`);

  const user = await getCurrentUser();
  console.log(`${TAG} GET caller:`, {
    id: user?.id,
    email: user?.email,
    role: user?.role,
    organizationId: user?.organizationId,
  });

  if (
    !user ||
    !["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(user.role)
  ) {
    console.warn(`${TAG} GET forbidden — caller not in allowed roles`);
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const where =
    user.role === "SUPER_ADMIN"
      ? {}
      : { organizationId: user.organizationId ?? "__none__" };
  console.log(`${TAG} GET where:`, where);

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

  console.log(`${TAG} GET returning ${users.length} user(s)`);
  return NextResponse.json({ success: true, data: users });
}

// ============================================================
// POST — create a user in the caller's organization
// ============================================================

export async function POST(req: NextRequest) {
  console.log(`\n${TAG} ═══════════ POST START ═══════════`);

  // ----------------------------------------------------------
  // 1) Identify caller
  // ----------------------------------------------------------
  const caller = await getCurrentUser();
  console.log(`${TAG} caller:`, {
    id: caller?.id,
    email: caller?.email,
    role: caller?.role,
    organizationId: caller?.organizationId,
  });

  if (
    !caller ||
    !["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(caller.role)
  ) {
    console.warn(`${TAG} ✖ caller rejected (role not allowed)`);
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  if (caller.role !== "SUPER_ADMIN" && !caller.organizationId) {
    console.warn(`${TAG} ✖ caller has no organizationId`);
    return NextResponse.json(
      { success: false, error: "You are not linked to an organization" },
      { status: 400 }
    );
  }

  try {
    // ----------------------------------------------------------
    // 2) Read raw body
    // ----------------------------------------------------------
    const body = await req.json();
    console.log(`${TAG} raw body:`, body);

    // ----------------------------------------------------------
    // 3) Zod parse — safeParse so we can log every issue
    // ----------------------------------------------------------
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      console.error(
        `${TAG} ✖ Zod validation failed:`,
        JSON.stringify(parsed.error.issues, null, 2)
      );
      const issues = parsed.error.issues.map((i) => ({
        path: i.path,
        message: i.message,
        code: i.code,
      }));
      console.error(`${TAG} ═══════════ POST END (400 zod) ═══════════\n`);
      return NextResponse.json(
        {
          success: false,
          error: issues[0]?.message || "Validation failed",
          details: issues,
        },
        { status: 400 }
      );
    }
    const data = parsed.data;
    console.log(`${TAG} ✔ Zod passed:`, data);

    // ----------------------------------------------------------
    // 4) Pre-flight: is the requested role actually valid for the
    //    generated Prisma client? This catches the "ORG_ADMIN not
    //    in enum" case BEFORE Prisma throws a cryptic error.
    // ----------------------------------------------------------
    const knownRoles = Object.values(UserRole) as string[];
    if (!knownRoles.includes(data.role)) {
      console.error(
        `${TAG} ✖ FATAL: requested role "${data.role}" is not in the ` +
          `generated Prisma UserRole enum.`
      );
      console.error(
        `${TAG}    Generated values are:`,
        knownRoles
      );
      console.error(
        `${TAG}    FIX: run \`npx prisma migrate dev\`, then ` +
          `\`npx prisma generate\`, then restart the dev server.`
      );
      console.error(`${TAG} ═══════════ POST END (400 stale client) ═══════════\n`);
      return NextResponse.json(
        {
          success: false,
          error:
            `Role "${data.role}" is not present in the generated Prisma client. ` +
            `Available: ${knownRoles.join(", ")}. ` +
            `Run: npx prisma migrate dev && npx prisma generate && restart.`,
        },
        { status: 400 }
      );
    }
    console.log(`${TAG} ✔ role "${data.role}" is in the generated enum`);

    // ----------------------------------------------------------
    // 5) Permission gate for ORG_ADMIN
    // ----------------------------------------------------------
    if (data.role === "ORG_ADMIN") {
      const allowed =
        caller.role === "ADMIN" || caller.role === "SUPER_ADMIN";
      console.log(`${TAG} ORG_ADMIN allowed:`, allowed);
      if (!allowed) {
        console.warn(`${TAG} ✖ ORG_ADMIN forbidden for caller role`);
        return NextResponse.json(
          {
            success: false,
            error: "Only the organization admin can create sub-admins",
          },
          { status: 403 }
        );
      }
    }

    // ----------------------------------------------------------
    // 6) Normalize + uniqueness
    // ----------------------------------------------------------
    const email = data.email;
    const phone = normalizePhone(data.phone);
    console.log(`${TAG} normalized:`, { email, phone });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn(`${TAG} ✖ email already exists:`, email);
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      console.warn(`${TAG} ✖ phone already in use:`, phone);
      return NextResponse.json(
        { success: false, error: "Phone number already in use" },
        { status: 409 }
      );
    }
    console.log(`${TAG} ✔ uniqueness checks passed`);

    // ----------------------------------------------------------
    // 7) Hash password + choose organization
    // ----------------------------------------------------------
    const defaultPassword = phone;
    console.log(`${TAG} hashing password (bcrypt, 12 rounds)…`);
    const password_hash = await hash(defaultPassword, 12);
    console.log(`${TAG} ✔ password hashed`);

    const organizationId =
      caller.role === "SUPER_ADMIN" ? null : caller.organizationId;
    console.log(`${TAG} organizationId for new user:`, organizationId);

    // ----------------------------------------------------------
    // 8) Transaction
    // ----------------------------------------------------------
    console.log(`${TAG} starting transaction…`);
    const result = await prisma.$transaction(
      async (tx) => {
        console.log(`${TAG}   → tx.user.create`);
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
        console.log(`${TAG}   ✔ user created:`, {
          id: user.id,
          email: user.email,
          role: user.role,
        });

        // ---- Role-specific side data ----
        if (data.role === "FARMER") {
          console.log(`${TAG}   → tx.farmerProfile.create`);
          await tx.farmerProfile.create({
            data: { userId: user.id, organizationId },
          });

          console.log(`${TAG}   → createWalletWithVA (FARMER_CLOSED)`);
          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.FARMER_CLOSED,
            accountName: `${data.full_name} - Input Wallet`,
            prefix: "41",
            holder: { name: data.full_name, email, phone },
          });

          console.log(`${TAG}   → createWalletWithVA (FARMER_OPEN)`);
          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.FARMER_OPEN,
            accountName: `${data.full_name} - Payout Wallet`,
            prefix: "42",
            holder: { name: data.full_name, email, phone },
          });
        } else if (data.role === "ORG_ADMIN") {
          console.log(`${TAG}   → createWalletWithVA (ADMIN)`);
          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.ADMIN,
            accountName: `${data.full_name} - Admin Wallet`,
            prefix: "43",
            holder: { name: data.full_name, email, phone },
          });
        } else if (data.role === "SUPPLIER") {
          console.log(`${TAG}   → tx.supplierProfile.create`);
          await tx.supplierProfile.create({
            data: {
              userId: user.id,
              organizationId,
              business_name: data.full_name,
            },
          });

          console.log(`${TAG}   → createWalletWithVA (SUPPLIER)`);
          await createWalletWithVA(tx, {
            userId: user.id,
            type: WalletType.SUPPLIER,
            accountName: `${data.full_name} - Supplier Wallet`,
            prefix: "44",
            holder: { name: data.full_name, email, phone },
          });
        }

        console.log(`${TAG}   → tx.userPreferences.create`);
        await tx.userPreferences.create({
          data: { userId: user.id, timezone: "Africa/Lagos" },
        });

        console.log(`${TAG}   → tx.auditLog.create`);
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

        console.log(`${TAG}   → tx.notification.create`);
        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Welcome to NAVSA",
            body: `Your ${data.role.toLowerCase()} account has been created.`,
            type: "SYSTEM",
          },
        });

        console.log(`${TAG}   ✔ transaction body finished`);
        return user;
      },
      { timeout: 60000, maxWait: 60000 }
    );
    console.log(`${TAG} ✔ transaction committed`);

    // ----------------------------------------------------------
    // 9) Email (fire-and-forget)
    // ----------------------------------------------------------
    const loginUrl = `${
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    }/`;

    console.log(`${TAG} → sending credentials email to:`, email);
    sendAdminCredentialsEmail({
      to: email,
      name: data.full_name,
      email,
      password: defaultPassword,
      loginUrl,
    })
      .then(() => console.log(`${TAG} ✔ credentials email sent`))
      .catch((err) => console.error(`${TAG} ✖ email error:`, err));

    console.log(`${TAG} ═══════════ POST END (201) ═══════════\n`);
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
    // ----------------------------------------------------------
    // 10) Catch-all — print everything about the error
    // ----------------------------------------------------------
    console.error(`\n${TAG} ✖✖✖ POST THREW ✖✖✖`);
    console.error(`${TAG} name:`, err?.name);
    console.error(`${TAG} message:`, err?.message);
    console.error(`${TAG} code:`, err?.code);
    if (err?.meta) {
      console.error(`${TAG} meta:`, JSON.stringify(err.meta, null, 2));
    }
    if (err?.stack) {
      console.error(`${TAG} stack:\n${err.stack}`);
    }

    // Zod
    if (err.name === "ZodError" || err instanceof z.ZodError) {
      const issues = (err as z.ZodError).issues.map((i) => ({
        path: i.path,
        message: i.message,
        code: i.code,
      }));
      console.error(`${TAG} ═══════════ POST END (400 zod) ═══════════\n`);
      return NextResponse.json(
        {
          success: false,
          error: issues[0]?.message || "Validation failed",
          details: issues,
        },
        { status: 400 }
      );
    }

    // Prisma unique violation
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(", ")
        : String(err.meta?.target ?? "field");
      console.error(
        `${TAG} ═══════════ POST END (409 unique: ${target}) ═══════════\n`
      );
      return NextResponse.json(
        {
          success: false,
          error: `A record with this ${target} already exists`,
        },
        { status: 409 }
      );
    }

    // Prisma enum-mismatch surface (shouldn't happen — pre-flight
    // check catches it — but log it in case a different enum fails)
    if (
      typeof err.message === "string" &&
      err.message.includes("Invalid enum value")
    ) {
      console.error(
        `${TAG} ⚠ This is a Prisma enum mismatch — the generated client ` +
          `doesn't know about one of the enum values being written.`
      );
      console.error(
        `${TAG}    Regenerate: npx prisma migrate dev && npx prisma generate, ` +
          `then restart the dev server.`
      );
    }

    console.error(`${TAG} ═══════════ POST END (400 generic) ═══════════\n`);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create user" },
      { status: 400 }
    );
  }
}