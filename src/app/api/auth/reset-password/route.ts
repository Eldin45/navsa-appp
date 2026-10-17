// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "~/lib/db";

export async function POST(req: NextRequest) {
  const { pin, password, token, phone } = await req.json();

  if (!pin || !password || !token || !phone) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const record = await prisma.passwordReset.findFirst({
    where: {
      token,
      used: false,
      expiresAt: { gt: new Date() },
      user: { phone },
    },
    include: { user: true },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Invalid or expired PIN" },
      { status: 400 }
    );
  }

  const password_hash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password_hash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ success: true });
}