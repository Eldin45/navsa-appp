// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[@$!%*?&]/.test(password)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must include uppercase, lowercase, number, and a special character",
        },
        { status: 400 }
      );
    }

    const password_hash = await hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        must_change_password: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CHANGE_PASSWORD",
        entity_type: "USER",
        entity_id: user.id,
        success: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[/api/auth/change-password] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to change password" },
      { status: 500 }
    );
  }
}