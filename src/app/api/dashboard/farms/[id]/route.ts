// src/app/api/dashboard/farms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

// ============================================================
// GET — one farm
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

  const { id } = await params;

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
      fields: true,
      devices: true,
      weatherStations: true,
    },
  });

  if (!farm) {
    return NextResponse.json(
      { success: false, error: "Farm not found" },
      { status: 404 }
    );
  }

  // Access check
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

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data: farm });
}

// ============================================================
// PATCH — update farm (status or fields)
// ============================================================

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  farm_type: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  total_area_ha: z.coerce.number().positive().optional(),
  cultivable_ha: z.coerce.number().nonnegative().nullable().optional(),
  soil_type: z.string().nullable().optional(),
  soil_ph: z.coerce.number().nullable().optional(),
  irrigation_type: z.string().nullable().optional(),
  irrigation_source: z.string().nullable().optional(),
  current_crop: z.string().nullable().optional(),
  crop_variety: z.string().nullable().optional(),
  planting_date: z.string().nullable().optional(),
  expected_harvest: z.string().nullable().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const data = updateSchema.parse(body);

    const farm = await prisma.farm.findUnique({
      where: { id },
      include: {
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

    // Access check
    const isSuperAdmin = caller.role === "SUPER_ADMIN";
    const isAdmin = caller.role === "ADMIN";
    const isFarmer = caller.role === "FARMER";
    const orgId = caller.organizationId ?? "__none__";

    let allowed = isSuperAdmin;
    if (!allowed && isAdmin) {
      allowed =
        farm.user?.organizationId === orgId ||
        farm.group?.organizationId === orgId;
    }
    if (!allowed && isFarmer) {
      allowed = farm.userId === caller.id;
    }

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const f = await tx.farm.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.farm_type !== undefined
            ? { farm_type: data.farm_type }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.total_area_ha !== undefined
            ? { total_area_ha: data.total_area_ha }
            : {}),
          ...(data.cultivable_ha !== undefined
            ? { cultivable_ha: data.cultivable_ha }
            : {}),
          ...(data.soil_type !== undefined
            ? { soil_type: data.soil_type }
            : {}),
          ...(data.soil_ph !== undefined ? { soil_ph: data.soil_ph } : {}),
          ...(data.irrigation_type !== undefined
            ? { irrigation_type: data.irrigation_type }
            : {}),
          ...(data.irrigation_source !== undefined
            ? { irrigation_source: data.irrigation_source }
            : {}),
          ...(data.current_crop !== undefined
            ? { current_crop: data.current_crop }
            : {}),
          ...(data.crop_variety !== undefined
            ? { crop_variety: data.crop_variety }
            : {}),
          ...(data.planting_date !== undefined
            ? {
                planting_date: data.planting_date
                  ? new Date(data.planting_date)
                  : null,
              }
            : {}),
          ...(data.expected_harvest !== undefined
            ? {
                expected_harvest: data.expected_harvest
                  ? new Date(data.expected_harvest)
                  : null,
              }
            : {}),
          ...(data.latitude !== undefined
            ? { latitude: data.latitude }
            : {}),
          ...(data.longitude !== undefined
            ? { longitude: data.longitude }
            : {}),
        },
        select: { id: true, name: true, status: true },
      });

      await tx.auditLog.create({
        data: {
          userId: caller.id,
          action: "UPDATE_FARM",
          entity_type: "FARM",
          entity_id: f.id,
          new_values: JSON.stringify(data),
          success: true,
        },
      });

      return f;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/farms/[id]] PATCH error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update farm" },
      { status: 400 }
    );
  }
}

// ============================================================
// DELETE — remove farm (SUPER_ADMIN / ADMIN only)
// ============================================================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const farm = await prisma.farm.findUnique({
    where: { id },
    include: {
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

  if (caller.role === "ADMIN") {
    const orgId = caller.organizationId ?? "__none__";
    const owns =
      farm.user?.organizationId === orgId ||
      farm.group?.organizationId === orgId;
    if (!owns) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.farm.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        userId: caller.id,
        action: "DELETE_FARM",
        entity_type: "FARM",
        entity_id: id,
        success: true,
      },
    });
  });

  return NextResponse.json({ success: true });
}