// src/app/api/dashboard/farms/[id]/advice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { AIAdviceType } from "@prisma/client";
// import {
//   generateFarmAdvice,
//   type GeminiAdviceType,
// } from "~/lib/gemini/client";


import { generateFarmAdvice, type GeminiAdviceType, } from "~/lib/germini/client";


// ============================================================
// ACCESS HELPER
// ============================================================

async function loadFarmForUser(
  farmId: string,
  userId: string,
  role: string,
  orgId: string | null
) {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      user: { select: { organizationId: true } },
      group: { select: { organizationId: true } },
    },
  });
  if (!farm) return { ok: false as const, error: "Farm not found", status: 404 };

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isFarmer = role === "FARMER";
  const scopedOrg = orgId ?? "__none__";

  let allowed = isSuperAdmin;
  if (!allowed && isAdmin) {
    allowed =
      farm.user?.organizationId === scopedOrg ||
      farm.group?.organizationId === scopedOrg;
  }
  if (!allowed && isFarmer) {
    allowed = farm.userId === userId;
    if (!allowed && farm.groupId) {
      const membership = await prisma.farmGroupMember.findFirst({
        where: {
          groupId: farm.groupId,
          userId,
          membership_status: "ACTIVE",
        },
        select: { id: true },
      });
      allowed = !!membership;
    }
  }
  if (!allowed) return { ok: false as const, error: "Forbidden", status: 403 };

  return { ok: true as const, farm };
}

// ============================================================
// GET — list existing advice
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
  const access = await loadFarmForUser(
    farmId,
    user.id,
    user.role,
    user.organizationId
  );
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }

  const rows = await prisma.aIAgronomyAdvice.findMany({
    where: { farmId },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      advice_type: true,
      crop_type: true,
      advice_text: true,
      confidence_score: true,
      model_used: true,
      action_items: true,
      is_actioned: true,
      actioned_at: true,
      created_at: true,
      fieldId: true,
      cycleId: true,
      user: { select: { id: true, full_name: true, email: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      adviceType: r.advice_type,
      cropType: r.crop_type,
      adviceText: r.advice_text,
      confidenceScore: r.confidence_score,
      modelUsed: r.model_used,
      actionItems: r.action_items ? tryParseArray(r.action_items) : [],
      isActioned: r.is_actioned,
      actionedAt: r.actioned_at ? r.actioned_at.toISOString() : null,
      createdAt: r.created_at.toISOString(),
      fieldId: r.fieldId,
      cycleId: r.cycleId,
      requestedBy: r.user
        ? {
            id: r.user.id,
            name: r.user.full_name,
            email: r.user.email,
          }
        : null,
    })),
  });
}

// ============================================================
// POST — generate new advice
// ============================================================

const bodySchema = z.object({
  adviceType: z.enum([
    "IRRIGATION",
    "FERTILIZER",
    "PEST",
    "DISEASE",
    "PLANTING",
    "HARVEST",
    "GENERAL",
  ]),
  fieldId: z.string().nullable().optional(),
  cycleId: z.string().nullable().optional(),
  extraNotes: z.string().optional(),
  language: z.string().optional(),
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
  const access = await loadFarmForUser(
    farmId,
    user.id,
    user.role,
    user.organizationId
  );
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }

  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    const farm = access.farm;

    // Optional field
    const field = data.fieldId
      ? await prisma.farmField.findUnique({
          where: { id: data.fieldId },
          select: {
            id: true,
            name: true,
            field_number: true,
            area_ha: true,
            soil_type: true,
            soil_depth: true,
            irrigation_method: true,
            farmId: true,
          },
        })
      : null;

    if (field && field.farmId !== farmId) {
      return NextResponse.json(
        { success: false, error: "Field does not belong to this farm" },
        { status: 400 }
      );
    }

    // Latest weather (best-effort)
    let weather: any = null;
    const station = await prisma.weatherStation.findFirst({
      where: { farmId: farm.id },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });
    if (station) {
      const latest = await prisma.weatherReading.findFirst({
        where: { stationId: station.id },
        orderBy: { reading_time: "desc" },
        select: {
          temperature_c: true,
          humidity_pct: true,
          rainfall_mm: true,
          forecast_3day: true,
        },
      });
      if (latest) {
        weather = {
          temperatureC: latest.temperature_c,
          humidityPct: latest.humidity_pct,
          rainfallMm: latest.rainfall_mm,
          forecast3Day: latest.forecast_3day,
        };
      }
    }

    // Recent activity
    const recentActivities = data.cycleId
      ? await prisma.cropActivity.findMany({
          where: { cycleId: data.cycleId },
          orderBy: { activity_date: "desc" },
          take: 5,
          select: {
            activity_type: true,
            activity_date: true,
            observations: true,
          },
        })
      : [];

    const ctx = {
      farm: {
        name: farm.name,
        farmType: farm.farm_type,
        totalAreaHa: farm.total_area_ha,
        cultivableHa: farm.cultivable_ha,
        soilType: farm.soil_type,
        soilPh: farm.soil_ph,
        irrigationType: farm.irrigation_type,
        irrigationSource: farm.irrigation_source,
        currentCrop: farm.current_crop,
        cropVariety: farm.crop_variety,
        plantingDate: farm.planting_date
          ? farm.planting_date.toISOString().slice(0, 10)
          : null,
        expectedHarvest: farm.expected_harvest
          ? farm.expected_harvest.toISOString().slice(0, 10)
          : null,
        latitude: farm.latitude,
        longitude: farm.longitude,
      },
      field: field
        ? {
            name: field.name,
            fieldNumber: field.field_number,
            areaHa: field.area_ha,
            soilType: field.soil_type,
            soilDepth: field.soil_depth,
            irrigationMethod: field.irrigation_method,
          }
        : null,
      weather,
      recentActivity: recentActivities.map((a) => ({
        activityType: a.activity_type,
        activityDate: a.activity_date.toISOString().slice(0, 10),
        notes: a.observations,
      })),
      language: data.language ?? "ENGLISH",
    };

    const extra = data.extraNotes?.trim()
      ? `\nAdditional farmer note: ${data.extraNotes.trim()}`
      : "";

    let result;
    try {
      result = await generateFarmAdvice(
        data.adviceType as GeminiAdviceType,
        ctx
      );
    } catch (geminiErr: any) {
      console.error("[Gemini] generate error:", geminiErr);
      return NextResponse.json(
        {
          success: false,
          error: `AI generation failed: ${geminiErr.message}`,
        },
        { status: 502 }
      );
    }

    const saved = await prisma.$transaction(async (tx) => {
      const advice = await tx.aIAgronomyAdvice.create({
        data: {
          userId: user.id,
          farmId: farm.id,
          fieldId: field?.id ?? null,
          cycleId: data.cycleId ?? null,
          advice_type: data.adviceType as AIAdviceType,
          crop_type: farm.current_crop ?? null,
          context: JSON.stringify(ctx) + extra,
          advice_text: result.adviceText,
          confidence_score: result.confidenceScore,
          model_used: result.modelUsed,
          action_items: JSON.stringify(result.actionItems),
        },
        select: {
          id: true,
          advice_type: true,
          advice_text: true,
          confidence_score: true,
          model_used: true,
          action_items: true,
          created_at: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "GENERATE_AI_ADVICE",
          entity_type: "AI_ADVICE",
          entity_id: advice.id,
          new_values: JSON.stringify({
            farmId: farm.id,
            adviceType: data.adviceType,
            model: result.modelUsed,
          }),
          success: true,
        },
      });

      return advice;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: saved.id,
          adviceType: saved.advice_type,
          adviceText: saved.advice_text,
          confidenceScore: saved.confidence_score,
          modelUsed: saved.model_used,
          actionItems: tryParseArray(saved.action_items),
          createdAt: saved.created_at.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/farms/[id]/advice] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate advice" },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPERS
// ============================================================

function tryParseArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return [raw];
  }
}