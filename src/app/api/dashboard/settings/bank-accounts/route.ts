// src/app/api/dashboard/settings/bank-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

const schema = z.object({
  bankName: z.string().min(2),
  bankCode: z.string().optional(),
  accountName: z.string().min(2),
  accountNumber: z.string().min(6),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    orderBy: [{ is_primary: "desc" }, { created_at: "desc" }],
  });

  return NextResponse.json({ success: true, data: accounts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existingCount = await prisma.bankAccount.count({
      where: { userId: user.id },
    });

    const created = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bank_name: data.bankName,
        bank_code: data.bankCode || null,
        account_name: data.accountName,
        account_number: data.accountNumber,
        is_primary: existingCount === 0,
        is_verified: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADD_BANK_ACCOUNT",
        entity_type: "BANK_ACCOUNT",
        entity_id: created.id,
        success: true,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to add account" },
      { status: 400 }
    );
  }
}