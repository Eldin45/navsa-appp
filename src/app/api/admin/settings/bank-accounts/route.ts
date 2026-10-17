import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  bankName: z.string().min(2),
  bankCode: z.string().optional(),
  accountName: z.string().min(2),
  accountNumber: z.string().min(6).max(20),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
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
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const existing = await prisma.bankAccount.findFirst({
      where: {
        userId: user.id,
        account_number: data.accountNumber,
        bank_code: data.bankCode || null,
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "This bank account is already linked" },
        { status: 409 }
      );
    }

    const hasAny = await prisma.bankAccount.count({
      where: { userId: user.id },
    });

    const created = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bank_name: data.bankName,
        bank_code: data.bankCode || null,
        account_name: data.accountName,
        account_number: data.accountNumber,
        is_primary: hasAny === 0,
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
      { success: false, error: err.message || "Failed to add bank account" },
      { status: 400 }
    );
  }
}