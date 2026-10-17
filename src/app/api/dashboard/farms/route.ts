// src/app/api/dashboard/farms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

// ============================================================
// SCHEMAS
// ============================================================

const createFarmSchema = z
  .object({
    name: z.string().min(2),
    farm_type: z.string().default("INDIVIDUAL"),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    total_area_ha: z.coerce.number().positive(),
    cultivable_ha: z.coerce.number().nonnegative().nullable().optional(),
    soil_type: z.string().nullable().optional(),
    soil_ph: z.coerce.number().nullable().optional(),
    irrigation_type: z.string().nullable().optional(),
    irrigation_source: z.string().nullable().optional(),
    current_crop: z.string().nullable().optional(),
    crop_variety: z.string().nullable().optional(),
    planting_date: z.string().nullable().optional(),
    expected_harvest: z.string().nullable().optional(),

    // Exactly one of these must be set
    ownerUserId: z.string().optional(),
    groupId: z.string().optional(),
  })
  .refine(
    (v) => !!(v.ownerUserId || v.groupId),
    { message: "Provide ownerUserId or groupId", path: ["ownerUserId"] }
  )
  .refine(
    (v) => !(v.ownerUserId && v.groupId),
    { message: "Provide either ownerUserId or groupId, not both", path: ["groupId"] }
  );

// ============================================================
// GET — list farms visible to caller
// ============================================================

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  const isFarmer = user.role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  let where: any;

  if (isSuperAdmin) {
    where = {};
  } else if (isAdmin) {
    where = {
      OR: [
        { user: { organizationId: orgId } },
        { group: { organizationId: orgId } },
      ],
    };
  } else if (isFarmer) {
    const memberships = await prisma.farmGroupMember.findMany({
      where: { userId: user.id, membership_status: "ACTIVE" },
      select: { groupId: true },
    });
    const groupIds = memberships.map((m) => m.groupId);

    where = {
      OR: [
        { userId: user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    };
  } else {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const farms = await prisma.farm.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      farm_type: true,
      total_area_ha: true,
      status: true,
      current_crop: true,
      created_at: true,
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
      _count: {
        select: { fields: true, devices: true, weatherStations: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: farms.map((f) => ({
      id: f.id,
      name: f.name,
      farmType: f.farm_type,
      totalAreaHa: f.total_area_ha,
      status: f.status,
      currentCrop: f.current_crop,
      createdAt: f.created_at.toISOString(),
      owner: f.user,
      group: f.group,
      counts: f._count,
    })),
  });
}

// ============================================================
// POST — create farm
// ============================================================

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createFarmSchema.parse(body);

    // ---- Authorization scoped to the caller ----
    const isSuperAdmin = caller.role === "SUPER_ADMIN";
    const isAdmin = caller.role === "ADMIN";
    const isFarmer = caller.role === "FARMER";
    const orgId = caller.organizationId ?? "__none__";

    let ownerUserId: string | null = null;
    let groupId: string | null = null;

    if (isFarmer) {
      // Farmer can only create for themselves
      if (data.groupId && data.groupId !== null) {
        return NextResponse.json(
          { success: false, error: "Farmers cannot assign farms to groups" },
          { status: 403 }
        );
      }
      ownerUserId = caller.id;
      groupId = null;
    } else if (isAdmin) {
      if (data.ownerUserId) {
        const owner = await prisma.user.findUnique({
          where: { id: data.ownerUserId },
          select: { id: true, role: true, organizationId: true },
        });
        if (
          !owner ||
          owner.role !== "FARMER" ||
          owner.organizationId !== orgId
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Farmer not found in your organization",
            },
            { status: 403 }
          );
        }
        ownerUserId = owner.id;
      } else if (data.groupId) {
        const group = await prisma.farmGroup.findUnique({
          where: { id: data.groupId },
          select: { id: true, organizationId: true },
        });
        if (!group || group.organizationId !== orgId) {
          return NextResponse.json(
            {
              success: false,
              error: "Group not found in your organization",
            },
            { status: 403 }
          );
        }
        groupId = group.id;
      }
    } else {
      // SUPER_ADMIN can pick anything
      if (data.ownerUserId) {
        const owner = await prisma.user.findUnique({
          where: { id: data.ownerUserId },
          select: { id: true, role: true },
        });
        if (!owner || owner.role !== "FARMER") {
          return NextResponse.json(
            { success: false, error: "Farmer not found" },
            { status: 400 }
          );
        }
        ownerUserId = owner.id;
      } else if (data.groupId) {
        const group = await prisma.farmGroup.findUnique({
          where: { id: data.groupId },
          select: { id: true },
        });
        if (!group) {
          return NextResponse.json(
            { success: false, error: "Group not found" },
            { status: 400 }
          );
        }
        groupId = group.id;
      }
    }

    // ---- Create the farm ----
    const farm = await prisma.$transaction(async (tx) => {
      const created = await tx.farm.create({
        data: {
          name: data.name.trim(),
          farm_type: data.farm_type,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          total_area_ha: data.total_area_ha,
          cultivable_ha: data.cultivable_ha ?? null,
          soil_type: data.soil_type ?? null,
          soil_ph: data.soil_ph ?? null,
          irrigation_type: data.irrigation_type ?? null,
          irrigation_source: data.irrigation_source ?? null,
          current_crop: data.current_crop ?? null,
          crop_variety: data.crop_variety ?? null,
          planting_date: data.planting_date ? new Date(data.planting_date) : null,
          expected_harvest: data.expected_harvest
            ? new Date(data.expected_harvest)
            : null,
          status: "ACTIVE",
          // NOTE: schema requires userId — when the farm belongs to a group,
          // we still need a userId to satisfy the relation. We use the group's
          // creator (adminId) when assigned to a group, or the farmer's id.
          userId: ownerUserId ?? (await resolveGroupOwner(tx, groupId!)),
          groupId,
        },
        select: { id: true, name: true },
      });

      await tx.auditLog.create({
        data: {
          userId: caller.id,
          action: "CREATE_FARM",
          entity_type: "FARM",
          entity_id: created.id,
          new_values: JSON.stringify({
            name: created.name,
            ownerUserId,
            groupId,
          }),
          success: true,
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Farm created successfully",
        data: { id: farm.id, name: farm.name },
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
    console.error("[/api/dashboard/farms] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create farm" },
      { status: 400 }
    );
  }
}

/**
 * When a farm is assigned to a group, the `Farm.userId` field still must
 * reference a user. We use the group's `adminId` as the effective owner.
 */
async function resolveGroupOwner(tx: any, groupId: string): Promise<string> {
  const group = await tx.farmGroup.findUnique({
    where: { id: groupId },
    select: { adminId: true, organizationId: true },
  });
  if (!group) throw new Error("Group not found");

  if (group.adminId) return group.adminId;

  // Fallback: pick the first ADMIN user of the group's organization
  const orgAdmin = await tx.user.findFirst({
    where: { role: "ADMIN", organizationId: group.organizationId ?? undefined },
    select: { id: true },
  });
  if (!orgAdmin) throw new Error("No admin found for the group's organization");
  return orgAdmin.id;
}