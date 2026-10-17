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
      | Promise<{ id: string; farmId: string }>
      | { id: string; farmId: string };
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id: orgId, farmId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    if (!isSuperAdmin && user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        user: { select: { organizationId: true } },
        group: { select: { organizationId: true } },
      },
    });
    if (!farm) {
      return NextResponse.json(
        { success: false, error: "Farm not found" },
        { status: 404 }
      );
    }
    const belongsToOrg =
      farm.user.organizationId === orgId ||
      farm.group?.organizationId === orgId;
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: "Farm not in this organization" },
        { status: 404 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { farmId };
    if (search) {
      where.OR = [
        { device_model: { contains: search } },
        { serial_number: { contains: search } },
        { manufacturer: { contains: search } },
      ];
    }

    const [total, devices] = await Promise.all([
      prisma.ioTDevice.count({ where }),
      prisma.ioTDevice.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          device_type: true,
          device_model: true,
          manufacturer: true,
          serial_number: true,
          installed_date: true,
          status: true,
          battery_level: true,
          signal_strength: true,
          last_reading: true,
          location_lat: true,
          location_lng: true,
          field: { select: { id: true, name: true, field_number: true } },
          _count: { select: { readings: true, alerts: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: devices.map((d) => ({
          id: d.id,
          deviceType: d.device_type,
          deviceModel: d.device_model,
          manufacturer: d.manufacturer,
          serialNumber: d.serial_number,
          installedDate: d.installed_date.toISOString(),
          status: d.status,
          batteryLevel: d.battery_level,
          signalStrength: d.signal_strength,
          lastReadingAt: d.last_reading ? d.last_reading.toISOString() : null,
          latitude: d.location_lat,
          longitude: d.location_lng,
          field: d.field
            ? {
                id: d.field.id,
                name: d.field.name,
                fieldNumber: d.field.field_number,
              }
            : null,
          readingsCount: d._count.readings,
          alertsCount: d._count.alerts,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      },
    });
  } catch (err: any) {
    console.error("[org/:id/farms/:farmId/devices]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}