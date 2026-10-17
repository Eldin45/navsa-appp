import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcrypt";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const password_hash = await hash(data.password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password_hash,
          must_change_password: false,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CHANGE_PASSWORD",
          entity_type: "USER",
          entity_id: user.id,
          success: true,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: err.errors[0]?.message ?? "Validation failed",
          details: err.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to change password" },
      { status: 400 }
    );
  }
}