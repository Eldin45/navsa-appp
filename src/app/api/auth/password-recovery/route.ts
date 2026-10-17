// src/app/api/auth/password-recovery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/db";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { phone } });

  // Don't leak whether phone exists
  if (!user) {
    return NextResponse.json({ success: true, pinId: "dummy" });
  }

  const pin = String(Math.floor(100000 + Math.random() * 900000));
  const pinId = crypto.randomUUID();

  // Reuse PasswordReset as PIN store (token = pinId, hash pin inside `token` in prod)
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: pinId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  // TODO: Integrate SMS provider
  console.log(`[password-recovery] PIN for ${phone}: ${pin}`);

  return NextResponse.json({ success: true, pinId });
}