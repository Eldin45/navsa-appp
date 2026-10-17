// src/app/api/dashboard/settings/bank-accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Account not found" },
      { status: 404 }
    );
  }

  if (body.isPrimary) {
    await prisma.$transaction([
      prisma.bankAccount.updateMany({
        where: { userId: user.id },
        data: { is_primary: false },
      }),
      prisma.bankAccount.update({
        where: { id },
        data: { is_primary: true },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Account not found" },
      { status: 404 }
    );
  }

  await prisma.bankAccount.delete({ where: { id } });

  return NextResponse.json({ success: true });
}