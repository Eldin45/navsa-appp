import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { ActuatorMode, ActuatorState } from "@prisma/client";

export const dynamic = "force-dynamic";

// ============================================================
// SCHEMA
// ============================================================

const controlSchema = z
  .object({
    action: z.enum(["TURN_ON", "TURN_OFF", "SET_MODE"]).optional(),
    mode: z.nativeEnum(ActuatorMode).optional(),

    triggerType: z.string().optional(),
    triggerUnit: z.string().optional(),
    onBelow: z.coerce.number().optional(),
    offAbove: z.coerce.number().optional(),
    maxRunMinutes: z.coerce.number().int().positive().optional(),
    cooldownMinutes: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      !!v.action ||
      v.mode === "MANUAL" ||
      (v.mode === "AUTO" &&
        v.triggerType &&
        v.onBelow != null &&
        v.offAbove != null),
    {
      message:
        "Provide an action, or mode=MANUAL, or mode=AUTO with triggerType + onBelow + offAbove",
      path: ["action"],
    }
  )
  .refine(
    (v) =>
      v.mode !== "AUTO" ||
      (v.onBelow != null && v.offAbove != null && v.onBelow < v.offAbove),
    {
      message: "AUTO requires onBelow < offAbove",
      path: ["onBelow"],
    }
  );

// ============================================================
// POST
// ============================================================

export async function POST(
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
    const data = controlSchema.parse(body);

    const device = await prisma.ioTDevice.findUnique({
      where: { id: deviceId },
      include: { actuator: true },
    });

    if (!device || device.farmId !== farmId) {
      return NextResponse.json(
        { success: false, error: "Device not found" },
        { status: 404 }
      );
    }

    if (!device.actuator) {
      return NextResponse.json(
        { success: false, error: "This device is not an actuator" },
        { status: 400 }
      );
    }

    const previousState = device.actuator.state;

    // ---------------------------------------------------------
    // SET_MODE
    // ---------------------------------------------------------
    if (data.action === "SET_MODE" || data.mode) {
      const mode = data.mode ?? device.actuator.mode;

      const updated = await prisma.$transaction(async (tx) => {
        const act = await tx.ioTDeviceActuator.update({
          where: { deviceId },
          data: {
            mode,
            ...(mode === "AUTO"
              ? {
                  triggerType:
                    data.triggerType ?? device.actuator!.triggerType,
                  triggerUnit:
                    data.triggerUnit ?? device.actuator!.triggerUnit,
                  onBelow: data.onBelow ?? device.actuator!.onBelow,
                  offAbove: data.offAbove ?? device.actuator!.offAbove,
                  maxRunMinutes:
                    data.maxRunMinutes ?? device.actuator!.maxRunMinutes,
                  cooldownMinutes:
                    data.cooldownMinutes ?? device.actuator!.cooldownMinutes,
                }
              : {}),
          },
        });

        await tx.ioTActuatorCommand.create({
          data: {
            deviceId,
            action: act.state,
            source: "MANUAL",
            triggeredBy: user.id,
            reason: `Mode changed to ${mode}`,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "SET_ACTUATOR_MODE",
            entity_type: "IOT_DEVICE",
            entity_id: deviceId,
            new_values: JSON.stringify({ mode, ...data }),
            success: true,
          },
        });

        return act;
      });

      return NextResponse.json({
        success: true,
        data: { mode: updated.mode, state: updated.state },
      });
    }

    // ---------------------------------------------------------
    // TURN_ON / TURN_OFF
    // ---------------------------------------------------------
    if (data.action === "TURN_ON" || data.action === "TURN_OFF") {
      const target: ActuatorState =
        data.action === "TURN_ON" ? "ON" : "OFF";

      const updated = await prisma.$transaction(async (tx) => {
        const extraRuntime =
          target === "OFF" && device.actuator!.lastRunStartedAt
            ? Math.max(
                0,
                Math.round(
                  (Date.now() -
                    new Date(device.actuator!.lastRunStartedAt).getTime()) /
                    60000
                )
              )
            : 0;

        const act = await tx.ioTDeviceActuator.update({
          where: { deviceId },
          data: {
            state: target,
            lastStateChange: new Date(),
            lastChangedBy: user.id,
            lastRunStartedAt: target === "ON" ? new Date() : null,
            ...(target === "OFF" && extraRuntime > 0
              ? {
                  totalRuntimeMinutes:
                    device.actuator!.totalRuntimeMinutes + extraRuntime,
                }
              : {}),
          },
        });

        await tx.ioTActuatorCommand.create({
          data: {
            deviceId,
            action: target,
            source: "MANUAL",
            triggeredBy: user.id,
            reason: `Manual switch from ${previousState} to ${target}`,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CONTROL_ACTUATOR",
            entity_type: "IOT_DEVICE",
            entity_id: deviceId,
            new_values: JSON.stringify({
              from: previousState,
              to: target,
            }),
            success: true,
          },
        });

        return act;
      });

      return NextResponse.json({
        success: true,
        data: { mode: updated.mode, state: updated.state },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[actuator control] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}