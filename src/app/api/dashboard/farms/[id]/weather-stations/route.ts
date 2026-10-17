// src/app/api/dashboard/farms/[id]/weather-stations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

const stationSchema = z.object({
  station_code: z.string().min(1),
  name: z.string().min(2),
  provider: z.string().nullable().optional(),
  elevation: z.coerce.number().nullable().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
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
    const data = stationSchema.parse(body);

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

    const existing = await prisma.weatherStation.findUnique({
      where: { station_code: data.station_code },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Station code already exists" },
        { status: 409 }
      );
    }

    const station = await prisma.weatherStation.create({
      data: {
        farmId,
        station_code: data.station_code,
        name: data.name,
        provider: data.provider ?? null,
        elevation: data.elevation ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: "ACTIVE",
      },
      select: { id: true, name: true, station_code: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_WEATHER_STATION",
        entity_type: "WEATHER_STATION",
        entity_id: station.id,
        success: true,
      },
    });

    return NextResponse.json({ success: true, data: station }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create station" },
      { status: 400 }
    );
  }
}