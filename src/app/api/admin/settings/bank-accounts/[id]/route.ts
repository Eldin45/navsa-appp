import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isPrimary: z.boolean().optional(),
  bankName: z.string().min(2).optional(),
  accountName: z.string().min(2).optional(),
  accountNumber: z.string().min(6).max(20).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Bank account not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.bankAccount.updateMany({
          where: { userId: user.id },
          data: { is_primary: false },
        });
      }

      return tx.bankAccount.update({
        where: { id },
        data: {
          ...(data.isPrimary !== undefined
            ? { is_primary: data.isPrimary }
            : {}),
          ...(data.bankName ? { bank_name: data.bankName } : {}),
          ...(data.accountName ? { account_name: data.accountName } : {}),
          ...(data.accountNumber
            ? { account_number: data.accountNumber }
            : {}),
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Bank account not found" },
        { status: 404 }
      );
    }

    await prisma.bankAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete" },
      { status: 400 }
    );
  }
}