import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; deviceId: string }>
      | { id: string; deviceId: string };
  }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const { id: farmId, deviceId } = await params;
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
  );

  const device = await prisma.ioTDevice.findUnique({
    where: { id: deviceId },
    select: { id: true, farmId: true },
  });
  if (!device || device.farmId !== farmId) {
    return NextResponse.json(
      { success: false, error: "Device not found" },
      { status: 404 }
    );
  }

  const [total, items] = await Promise.all([
    prisma.ioTActuatorCommand.count({ where: { deviceId } }),
    prisma.ioTActuatorCommand.findMany({
      where: { deviceId },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: items.map((c) => ({
        id: c.id,
        action: c.action,
        source: c.source,
        triggeredBy: c.triggeredBy,
        reason: c.reason,
        readingValue: c.readingValue,
        readingType: c.readingType,
        success: c.success,
        errorMessage: c.errorMessage,
        createdAt: c.created_at.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    },
  });
}