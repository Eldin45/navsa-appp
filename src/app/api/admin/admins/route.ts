// src/app/api/admin/admins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isSuperAdmin } from "~/lib/session";
import {
  createAdmin,
  createAdminSchema,
  listAdmins,
} from "~/lib/services/admin.service";

// ============================================================
// GET — list platform admins
// ============================================================

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  console.log("🔵 [/api/admin/admins] GET caller:", {
    email: user?.email,
    role: user?.role,
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  if (!isSuperAdmin(user)) {
    return NextResponse.json(
      { success: false, error: `Forbidden — role is "${user.role}"` },
      { status: 403 }
    );
  }

  try {
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const admins = await listAdmins(user.id, { search });

    return NextResponse.json({
      success: true,
      data: admins.map((a) => ({
        id: a.id,
        name: a.full_name,
        email: a.email,
        phone: a.phone,
        status: a.status,
        createdAt: a.created_at.toISOString(),
        lastLogin: a.last_login ? a.last_login.toISOString() : null,
        mustChangePassword: a.must_change_password,
        wallet: a.wallets[0]
          ? {
              id: a.wallets[0].id,
              type: a.wallets[0].type,
              accountNumber: a.wallets[0].accountNumber,
              balance: Number(a.wallets[0].balance),
              availableBalance: Number(a.wallets[0].availableBalance),
              palmPayAccountNumber: a.wallets[0].palmPayAccountNumber,
              palmPayBankName: a.wallets[0].palmPayBankName,
              palmPayStatus: a.wallets[0].palmPayStatus,
            }
          : null,
        createdBy: a.createdBy,
      })),
    });
  } catch (err: any) {
    console.error("[/api/admin/admins] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list admins" },
      { status: 400 }
    );
  }
}

// ============================================================
// POST — create a platform admin
// ============================================================

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();

  console.log("🔵 [/api/admin/admins] POST caller:", {
    id: caller?.id,
    email: caller?.email,
    role: caller?.role,
    roleChars: caller?.role
      ? Array.from(caller.role).map((c) => c.charCodeAt(0))
      : null,
    isSuperAdmin: isSuperAdmin(caller),
  });

  if (!caller) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  if (!isSuperAdmin(caller)) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden — your role is "${caller.role}". Only SUPER_ADMIN can create admins.`,
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validated = createAdminSchema.parse(body);

    const result = await createAdmin(validated, caller.id, req);

    return NextResponse.json(
      {
        success: true,
        message:
          "Admin created. Credentials have been emailed to the admin address.",
        data: {
          userId: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phone: result.user.phone,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: err.errors,
        },
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
    console.error("[/api/admin/admins] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create admin" },
      { status: 400 }
    );
  }
}