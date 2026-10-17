// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const take = Number(req.nextUrl.searchParams.get("take") ?? 10);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { created_at: "desc" },
    take,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      is_read: true,
      created_at: true,
    },
  });

  return NextResponse.json({ success: true, data: notifications });
}