// src/app/api/dashboard/farms/[id]/fields/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

const fieldSchema = z.object({
  name: z.string().nullable().optional(),
  field_number: z.string().min(1),
  area_ha: z.coerce.number().positive(),
  soil_type: z.string().nullable().optional(),
  soil_depth: z.coerce.number().nullable().optional(),
  irrigation_method: z.string().nullable().optional(),
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
    const data = fieldSchema.parse(body);

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

    const field = await prisma.farmField.create({
      data: {
        farmId,
        name: data.name ?? null,
        field_number: data.field_number,
        area_ha: data.area_ha,
        soil_type: data.soil_type ?? null,
        soil_depth: data.soil_depth ?? null,
        irrigation_method: data.irrigation_method ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: "ACTIVE",
      },
      select: { id: true, name: true, field_number: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_FARM_FIELD",
        entity_type: "FARM_FIELD",
        entity_id: field.id,
        success: true,
      },
    });

    return NextResponse.json({ success: true, data: field }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create field" },
      { status: 400 }
    );
  }
}