// src/app/dashboard/farms/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import FarmDetailClient from "./page.client";

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent(`/dashboard/farms/${id}`));

  const farm = await prisma.farm.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          organizationId: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          group_type: true,
          organizationId: true,
        },
      },
      fields: {
        orderBy: { created_at: "asc" },
        include: {
          _count: {
            select: { devices: true, cropCycles: true },
          },
        },
      },
      devices: {
        orderBy: { installed_date: "desc" },
        include: {
          field: { select: { id: true, name: true, field_number: true } },
          _count: { select: { readings: true, alerts: true } },
        },
      },
      weatherStations: {
        orderBy: { created_at: "desc" },
        include: {
          _count: { select: { readings: true } },
        },
      },
      _count: {
        select: {
          fields: true,
          devices: true,
          weatherStations: true,
        },
      },
    },
  });

  if (!farm) notFound();

  // ---------- Access check ----------
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
    if (farm.userId === user.id) allowed = true;
    if (!allowed && farm.groupId) {
      const membership = await prisma.farmGroupMember.findFirst({
        where: {
          groupId: farm.groupId,
          userId: user.id,
          membership_status: "ACTIVE",
        },
        select: { id: true },
      });
      allowed = !!membership;
    }
  }

  if (!allowed) redirect("/unauthorized");

  // ---------- Existing AI advice ----------
  const adviceRows = await prisma.aIAgronomyAdvice.findMany({
    where: { farmId: id },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      advice_type: true,
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

  const geminiEnabled = !!process.env.GEMINI_API_KEY;

  return (
    <FarmDetailClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        isAdmin,
        isFarmer,
        organizationId: user.organizationId,
      }}
      geminiEnabled={geminiEnabled}
      farm={{
        id: farm.id,
        name: farm.name,
        farmType: farm.farm_type,
        latitude: farm.latitude,
        longitude: farm.longitude,
        gpsBoundary: farm.gps_boundary,
        totalAreaHa: farm.total_area_ha,
        cultivableHa: farm.cultivable_ha,
        soilType: farm.soil_type,
        soilPh: farm.soil_ph,
        irrigationType: farm.irrigation_type,
        irrigationSource: farm.irrigation_source,
        status: farm.status,
        currentCrop: farm.current_crop,
        cropVariety: farm.crop_variety,
        plantingDate: farm.planting_date
          ? farm.planting_date.toISOString()
          : null,
        expectedHarvest: farm.expected_harvest
          ? farm.expected_harvest.toISOString()
          : null,
        createdAt: farm.created_at.toISOString(),
        updatedAt: farm.updated_at.toISOString(),
        owner: farm.user
          ? {
              id: farm.user.id,
              name: farm.user.full_name,
              email: farm.user.email,
              role: farm.user.role,
              organizationId: farm.user.organizationId,
            }
          : null,
        group: farm.group
          ? {
              id: farm.group.id,
              name: farm.group.name,
              groupType: farm.group.group_type,
              organizationId: farm.group.organizationId,
            }
          : null,
        counts: farm._count,
      }}
      fields={farm.fields.map((f) => ({
        id: f.id,
        name: f.name,
        fieldNumber: f.field_number,
        areaHa: f.area_ha,
        latitude: f.latitude,
        longitude: f.longitude,
        soilType: f.soil_type,
        soilDepth: f.soil_depth,
        status: f.status,
        irrigationMethod: f.irrigation_method,
        createdAt: f.created_at.toISOString(),
        counts: {
          devices: f._count.devices,
          cropCycles: f._count.cropCycles,
        },
      }))}
      devices={farm.devices.map((d) => ({
        id: d.id,
        deviceType: d.device_type,
        deviceModel: d.device_model,
        manufacturer: d.manufacturer,
        serialNumber: d.serial_number,
        installedDate: d.installed_date.toISOString(),
        locationLat: d.location_lat,
        locationLng: d.location_lng,
        connectionType: d.connection_type,
        simCardNumber: d.sim_card_number,
        signalStrength: d.signal_strength,
        powerSource: d.power_source,
        batteryLevel: d.battery_level,
        status: d.status,
        readingFrequency: d.reading_frequency,
        lastReading: d.last_reading ? d.last_reading.toISOString() : null,
        field: d.field
          ? {
              id: d.field.id,
              name: d.field.name,
              fieldNumber: d.field.field_number,
            }
          : null,
        counts: {
          readings: d._count.readings,
          alerts: d._count.alerts,
        },
      }))}
      weatherStations={farm.weatherStations.map((s) => ({
        id: s.id,
        stationCode: s.station_code,
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        elevation: s.elevation,
        provider: s.provider,
        status: s.status,
        createdAt: s.created_at.toISOString(),
        readingCount: s._count.readings,
      }))}
      initialAdvice={adviceRows.map((a) => ({
        id: a.id,
        adviceType: a.advice_type,
        adviceText: a.advice_text,
        confidenceScore: a.confidence_score,
        modelUsed: a.model_used,
        actionItems: a.action_items ? tryParseArray(a.action_items) : [],
        isActioned: a.is_actioned,
        actionedAt: a.actioned_at ? a.actioned_at.toISOString() : null,
        createdAt: a.created_at.toISOString(),
        fieldId: a.fieldId,
        cycleId: a.cycleId,
        requestedBy: a.user
          ? { id: a.user.id, name: a.user.full_name, email: a.user.email }
          : null,
      }))}
    />
  );
}

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