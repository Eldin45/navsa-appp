import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { IoTDeviceStatus } from "@prisma/client";

const ACTUATOR_TYPES = [
  "WATER_PUMP",
  "VALVE",
  "FAN",
  "LIGHT",
  "MOTOR",
  "HEATER",
];

// ============================================================
// GET — single device with actuator config
// ============================================================

export async function GET(
  _req: NextRequest,
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

  const device = await prisma.ioTDevice.findUnique({
    where: { id: deviceId },
    include: {
      actuator: true,
      _count: {
        select: { readings: true, alerts: true, actuatorCommands: true },
      },
    },
  });

  if (!device || device.farmId !== farmId) {
    return NextResponse.json(
      { success: false, error: "Device not found" },
      { status: 404 }
    );
  }

  let latestReading: {
    value: number;
    type: string;
    unit: string;
    at: string;
  } | null = null;

  if (device.actuator?.triggerType) {
    const r = await prisma.ioTReading.findFirst({
      where: {
        deviceId,
        reading_type: device.actuator.triggerType,
      },
      orderBy: { reading_time: "desc" },
      select: {
        reading_value: true,
        reading_type: true,
        unit: true,
        reading_time: true,
      },
    });
    if (r) {
      latestReading = {
        value: r.reading_value,
        type: r.reading_type,
        unit: r.unit,
        at: r.reading_time.toISOString(),
      };
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      ...device,
      isActuator: ACTUATOR_TYPES.includes(device.device_type as any),
      latestReading,
    },
  });
}

// ============================================================
// PATCH — update device + actuator config
// ============================================================

const patchSchema = z.object({
  device_model: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  field_id: z.string().nullable().optional(),
  status: z.nativeEnum(IoTDeviceStatus).optional(),
  connection_type: z.string().nullable().optional(),
  power_source: z.string().nullable().optional(),
  reading_frequency: z.coerce.number().int().positive().nullable().optional(),
});

export async function PATCH(
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
  if (!user || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id: farmId, deviceId } = await params;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

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

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.ioTDevice.update({
        where: { id: deviceId },
        data: {
          ...(data.device_model !== undefined
            ? { device_model: data.device_model }
            : {}),
          ...(data.manufacturer !== undefined
            ? { manufacturer: data.manufacturer }
            : {}),
          ...(data.serial_number !== undefined
            ? { serial_number: data.serial_number }
            : {}),
          ...(data.field_id !== undefined ? { fieldId: data.field_id } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.connection_type !== undefined
            ? { connection_type: data.connection_type }
            : {}),
          ...(data.power_source !== undefined
            ? { power_source: data.power_source }
            : {}),
          ...(data.reading_frequency !== undefined
            ? { reading_frequency: data.reading_frequency }
            : {}),
        },
        select: { id: true, status: true, fieldId: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_IOT_DEVICE",
          entity_type: "IOT_DEVICE",
          entity_id: d.id,
          new_values: JSON.stringify(data),
          success: true,
        },
      });

      return d;
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
      { success: false, error: err.message || "Failed to update device" },
      { status: 400 }
    );
  }
}

// ============================================================
// DELETE
// ============================================================

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; deviceId: string }>
      | { id: string; deviceId: string };
  }
) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id: farmId, deviceId } = await params;

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

  await prisma.$transaction(async (tx) => {
    await tx.ioTDevice.delete({ where: { id: deviceId } });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_IOT_DEVICE",
        entity_type: "IOT_DEVICE",
        entity_id: deviceId,
        success: true,
      },
    });
  });

  return NextResponse.json({ success: true });
}