import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import DeviceDetailClient from "./page.client";

export default async function DeviceDetailPage({
  params,
}: {
  params:
    | Promise<{ id: string; deviceId: string }>
    | { id: string; deviceId: string };
}) {
  const { id: farmId, deviceId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      "/?callbackUrl=" +
        encodeURIComponent(`/dashboard/farms/${farmId}/devices/${deviceId}`)
    );
  }

  const device = await prisma.ioTDevice.findUnique({
    where: { id: deviceId },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          userId: true,
          user: { select: { organizationId: true } },
          group: { select: { organizationId: true } },
        },
      },
      field: { select: { id: true, name: true, field_number: true } },
      actuator: true,
      _count: {
        select: { readings: true, alerts: true, actuatorCommands: true },
      },
    },
  });

  if (!device || device.farmId !== farmId) notFound();

  // ---------- Access check ----------
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  const isFarmer = user.role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  let allowed = isSuperAdmin;
  if (!allowed && isAdmin) {
    allowed =
      device.farm.user?.organizationId === orgId ||
      device.farm.group?.organizationId === orgId;
  }
  if (!allowed && isFarmer) {
    allowed = device.farm.userId === user.id;
  }
  if (!allowed) redirect("/unauthorized");

  const ACTUATOR_TYPES = [
    "WATER_PUMP",
    "VALVE",
    "FAN",
    "LIGHT",
    "MOTOR",
    "HEATER",
  ];
  const isActuator = ACTUATOR_TYPES.includes(device.device_type);

  // Latest reading for actuator preview
  let latestReading: {
    value: number;
    type: string;
    unit: string;
    at: string;
  } | null = null;

  if (isActuator && device.actuator?.triggerType) {
    const r = await prisma.iOTReading.findFirst({
      where: { deviceId, reading_type: device.actuator.triggerType },
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

  return (
    <DeviceDetailClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        isAdmin,
        isFarmer,
      }}
      farm={{
        id: device.farm.id,
        name: device.farm.name,
      }}
      isActuator={isActuator}
      device={{
        id: device.id,
        deviceType: device.device_type,
        deviceModel: device.device_model,
        manufacturer: device.manufacturer,
        serialNumber: device.serial_number,
        installedDate: device.installed_date.toISOString(),
        status: device.status,
        connectionType: device.connection_type,
        signalStrength: device.signal_strength,
        powerSource: device.power_source,
        batteryLevel: device.battery_level,
        readingFrequency: device.reading_frequency,
        lastReading: device.last_reading
          ? device.last_reading.toISOString()
          : null,
        locationLat: device.location_lat,
        locationLng: device.location_lng,
        simCardNumber: device.sim_card_number,
        field: device.field
          ? {
              id: device.field.id,
              name: device.field.name,
              fieldNumber: device.field.field_number,
            }
          : null,
        counts: {
          readings: device._count.readings,
          alerts: device._count.alerts,
          commands: device._count.actuatorCommands,
        },
      }}
      actuator={
        device.actuator
          ? {
              mode: device.actuator.mode,
              state: device.actuator.state,
              lastStateChange: device.actuator.lastStateChange
                ? device.actuator.lastStateChange.toISOString()
                : null,
              lastChangedBy: device.actuator.lastChangedBy,
              triggerType: device.actuator.triggerType,
              triggerUnit: device.actuator.triggerUnit,
              onBelow: device.actuator.onBelow,
              offAbove: device.actuator.offAbove,
              maxRunMinutes: device.actuator.maxRunMinutes,
              cooldownMinutes: device.actuator.cooldownMinutes,
              totalRuntimeMinutes: device.actuator.totalRuntimeMinutes,
              lastRunStartedAt: device.actuator.lastRunStartedAt
                ? device.actuator.lastRunStartedAt.toISOString()
                : null,
            }
          : null
      }
      latestReading={latestReading}
    />
  );
}