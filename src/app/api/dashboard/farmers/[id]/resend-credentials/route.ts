// src/app/api/dashboard/farmers/[id]/resend-credentials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { sendAdminCredentialsEmail } from "~/lib/email/utils";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const farmer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      role: true,
      organizationId: true,
    },
  });

  if (!farmer || farmer.role !== "FARMER") {
    return NextResponse.json(
      { success: false, error: "Farmer not found" },
      { status: 404 }
    );
  }

  if (
    caller.role === "ADMIN" &&
    farmer.organizationId !== caller.organizationId
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  if (!farmer.phone) {
    return NextResponse.json(
      { success: false, error: "Farmer has no phone on file" },
      { status: 400 }
    );
  }

  const defaultPassword = normalizePhone(farmer.phone);
  const password_hash = await hash(defaultPassword, 12);

  await prisma.user.update({
    where: { id: farmer.id },
    data: { password_hash, must_change_password: true },
  });

  const loginUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  }/`;

  const ok = await sendAdminCredentialsEmail({
    to: farmer.email,
    name: farmer.full_name,
    email: farmer.email,
    password: defaultPassword,
    loginUrl,
  });

  return NextResponse.json({
    success: true,
    message: `Credentials resent to ${farmer.email}`,
    data: { email: farmer.email, sent: ok },
  });
}