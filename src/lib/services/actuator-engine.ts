import { prisma } from "../db";

type CommandSource = "MANUAL" | "AUTO" | "SCHEDULE" | "SAFETY";

/**
 * Evaluate a device's AUTO rule against latest readings.
 * Call this right after inserting an IoTReading row.
 */
export async function evaluateActuatorForDevice(deviceId: string) {
  const device = await prisma.ioTDevice.findUnique({
    where: { id: deviceId },
    include: { actuator: true },
  });
  if (!device || !device.actuator) return;
  if (device.actuator.mode !== "AUTO") return;

  const act = device.actuator;
  if (!act.triggerType || act.onBelow == null || act.offAbove == null) return;

  const reading = await prisma.iOTReading.findFirst({
    where: { deviceId, reading_type: act.triggerType },
    orderBy: { reading_time: "desc" },
  });
  if (!reading) return;

  const value = reading.reading_value;
  const now = Date.now();

  // Safety: max run time
  if (
    act.state === "ON" &&
    act.maxRunMinutes != null &&
    act.lastRunStartedAt
  ) {
    const ranMin =
      (now - new Date(act.lastRunStartedAt).getTime()) / 60000;
    if (ranMin >= act.maxRunMinutes) {
      await turnOff(
        deviceId,
        "SAFETY",
        `Max run time of ${act.maxRunMinutes} min reached`,
        value,
        reading.reading_type
      );
      return;
    }
  }

  // Turn ON when below onBelow (respect cooldown)
  if (act.state === "OFF" && value < act.onBelow) {
    if (act.cooldownMinutes != null && act.lastStateChange) {
      const sinceLast =
        (now - new Date(act.lastStateChange).getTime()) / 60000;
      if (sinceLast < act.cooldownMinutes) return;
    }
    await turnOn(
      deviceId,
      "AUTO",
      `${act.triggerType} ${value}${act.triggerUnit ?? ""} < ${act.onBelow}`,
      value,
      reading.reading_type
    );
    return;
  }

  // Turn OFF when above offAbove
  if (act.state === "ON" && value > act.offAbove) {
    await turnOff(
      deviceId,
      "AUTO",
      `${act.triggerType} ${value}${act.triggerUnit ?? ""} > ${act.offAbove}`,
      value,
      reading.reading_type
    );
  }
}

// ============================================================
// Manual flip (used by control route)
// ============================================================

export async function manualFlip(
  deviceId: string,
  target: "ON" | "OFF",
  userId: string,
  reason?: string
) {
  if (target === "ON") {
    return turnOn(deviceId, "MANUAL", reason ?? "Manual switch", null, null, userId);
  }
  return turnOff(deviceId, "MANUAL", reason ?? "Manual switch", null, null, userId);
}

// ============================================================
// Internal helpers
// ============================================================

async function turnOn(
  deviceId: string,
  source: CommandSource,
  reason: string,
  readingValue: number | null,
  readingType: string | null,
  userId?: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.iOTDeviceActuator.update({
      where: { deviceId },
      data: {
        state: "ON",
        lastStateChange: new Date(),
        lastRunStartedAt: new Date(),
        lastChangedBy: userId ?? null,
      },
    });

    await tx.iotActuatorCommand.create({
      data: {
        deviceId,
        action: "ON",
        source,
        triggeredBy: userId ?? null,
        reason,
        readingValue,
        readingType,
        success: true,
      },
    });

    // TODO: dispatch hardware command here (MQTT / HTTP to gateway)
    console.log(
      `[actuator] ${deviceId} → ON (source=${source}, reason="${reason}")`
    );
  });
}

async function turnOff(
  deviceId: string,
  source: CommandSource,
  reason: string,
  readingValue: number | null,
  readingType: string | null,
  userId?: string
) {
  await prisma.$transaction(async (tx) => {
    const act = await tx.iOTDeviceActuator.findUnique({
      where: { deviceId },
      select: { lastRunStartedAt: true, totalRuntimeMinutes: true },
    });

    const extraMinutes =
      act?.lastRunStartedAt
        ? Math.max(
            0,
            Math.round(
              (Date.now() - new Date(act.lastRunStartedAt).getTime()) /
                60000
            )
          )
        : 0;

    await tx.iOTDeviceActuator.update({
      where: { deviceId },
      data: {
        state: "OFF",
        lastStateChange: new Date(),
        lastRunStartedAt: null,
        lastChangedBy: userId ?? null,
        totalRuntimeMinutes: (act?.totalRuntimeMinutes ?? 0) + extraMinutes,
      },
    });

    await tx.iotActuatorCommand.create({
      data: {
        deviceId,
        action: "OFF",
        source,
        triggeredBy: userId ?? null,
        reason,
        readingValue,
        readingType,
        success: true,
      },
    });

    // TODO: dispatch hardware command here
    console.log(
      `[actuator] ${deviceId} → OFF (source=${source}, reason="${reason}", ran=${extraMinutes}m)`
    );
  });
}