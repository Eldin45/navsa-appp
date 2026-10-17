import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { IoTDeviceType } from "@prisma/client";

const ACTUATOR_TYPES: IoTDeviceType[] = [
  "WATER_PUMP",
  "VALVE",
  "FAN",
  "LIGHT",
  "MOTOR",
  "HEATER",
];

function isActuator(type: IoTDeviceType): boolean {
  return ACTUATOR_TYPES.includes(type);
}

// ============================================================
// GET — list devices of a farm
// ============================================================

export async function GET(
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

  const { id: farmId } = await params;

  const devices = await prisma.ioTDevice.findMany({
    where: { farmId },
    orderBy: { installed_date: "desc" },
    include: { actuator: true },
  });

  return NextResponse.json({
    success: true,
    data: devices.map((d) => ({
      ...d,
      isActuator: ACTUATOR_TYPES.includes(d.device_type as IoTDeviceType),
    })),
  });
}

// ============================================================
// POST — register a device (no actuator config here)
// ============================================================

const deviceSchema = z.object({
  device_type: z.nativeEnum(IoTDeviceType),
  device_model: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  installed_date: z.string(),
  field_id: z.string().nullable().optional(),
  location_lat: z.coerce.number().nullable().optional(),
  location_lng: z.coerce.number().nullable().optional(),
  connection_type: z.string().nullable().optional(),
  sim_card_number: z.string().nullable().optional(),
  power_source: z.string().nullable().optional(),
  reading_frequency: z.coerce.number().int().positive().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id: farmId } = await params;

  try {
    const body = await req.json();
    const data = deviceSchema.parse(body);

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        userId: true,
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

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdmin = user.role === "ADMIN";
    const isFarmer = user.role === "FARMER";
    const orgId = user.organizationId ?? "__none__";

    let allowed = isSuperAdmin;
    if (!allowed && isAdmin) {
      allowed =
        farm.user?.organizationId === orgId ||
        farm.group?.organizationId === orgId;
    }
    if (!allowed && isFarmer) {
      allowed = farm.userId === user.id;
    }
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (data.serial_number) {
      const existing = await prisma.ioTDevice.findUnique({
        where: { serial_number: data.serial_number },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Serial number already registered" },
          { status: 409 }
        );
      }
    }

    const device = await prisma.$transaction(async (tx) => {
      const d = await tx.ioTDevice.create({
        data: {
          farmId,
          fieldId: data.field_id ?? null,
          userId: user.id,
          device_type: data.device_type,
          device_model: data.device_model ?? null,
          manufacturer: data.manufacturer ?? null,
          serial_number: data.serial_number ?? null,
          installed_date: new Date(data.installed_date),
          location_lat: data.location_lat ?? null,
          location_lng: data.location_lng ?? null,
          connection_type: data.connection_type ?? null,
          sim_card_number: data.sim_card_number ?? null,
          power_source: data.power_source ?? null,
          reading_frequency: data.reading_frequency ?? null,
          status: "ACTIVE",
        },
        select: { id: true, device_type: true, serial_number: true },
      });

      // Auto-create actuator row with safe defaults for actuator device types
      if (isActuator(data.device_type)) {
        await tx.ioTDeviceActuator.create({
          data: {
            deviceId: d.id,
            mode: "MANUAL",
            state: "OFF",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "REGISTER_IOT_DEVICE",
          entity_type: "IOT_DEVICE",
          entity_id: d.id,
          new_values: JSON.stringify({
            farmId,
            device_type: d.device_type,
            serial: d.serial_number,
            isActuator: isActuator(data.device_type),
          }),
          success: true,
        },
      });

      return d;
    });

    return NextResponse.json({ success: true, data: device }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/farms/:id/devices POST]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register device" },
      { status: 400 }
    );
  }
}