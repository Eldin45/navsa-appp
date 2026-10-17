// src/app/dashboard/farms/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import FarmsClient from "./page.client";

export default async function FarmsPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/farms"));

  if (!["SUPER_ADMIN", "ADMIN", "FARMER"].includes(user.role)) {
    redirect("/unauthorized");
  }

  const role = user.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isFarmer = role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  // ---- Farms visible to this user ----
  let farmWhere: any;

  if (isSuperAdmin) {
    farmWhere = {};
  } else if (isAdmin) {
    // Farms owned by any user in the org, OR farms belonging to groups in the org
    farmWhere = {
      OR: [
        { user: { organizationId: orgId } },
        { group: { organizationId: orgId } },
      ],
    };
  } else {
    // Farmer: own farms + farms of groups they belong to
    const memberships = await prisma.farmGroupMember.findMany({
      where: { userId: user.id, membership_status: "ACTIVE" },
      select: { groupId: true },
    });
    const groupIds = memberships.map((m) => m.groupId);

    farmWhere = {
      OR: [
        { userId: user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    };
  }

  const farms = await prisma.farm.findMany({
    where: farmWhere,
    orderBy: { created_at: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      farm_type: true,
      latitude: true,
      longitude: true,
      total_area_ha: true,
      cultivable_ha: true,
      soil_type: true,
      soil_ph: true,
      irrigation_type: true,
      irrigation_source: true,
      status: true,
      current_crop: true,
      crop_variety: true,
      planting_date: true,
      expected_harvest: true,
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
        select: {
          fields: true,
          devices: true,
          weatherStations: true,
        },
      },
    },
  });

  // ---- Assigned users/groups for the picker (create modal) ----
  // ADMIN can pick from farmers of their org and groups of their org.
  // SUPER_ADMIN can pick anything.
  // FARMER just creates a farm for themselves (no picker).
  let farmers: any[] = [];
  let groups: any[] = [];

  if (isSuperAdmin || isAdmin) {
    const userWhere = isSuperAdmin
      ? { role: "FARMER" as const }
      : { role: "FARMER" as const, organizationId: orgId };

    farmers = await prisma.user.findMany({
      where: userWhere,
      orderBy: { full_name: "asc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        organizationId: true,
      },
    });

    const groupWhere = isSuperAdmin
      ? { status: "ACTIVE" as const }
      : { status: "ACTIVE" as const, organizationId: orgId };

    groups = await prisma.farmGroup.findMany({
      where: groupWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        group_type: true,
        organizationId: true,
        _count: { select: { members: true } },
      },
    });
  }

  const stats = {
    total: farms.length,
    active: farms.filter((f) => f.status === "ACTIVE").length,
    totalAreaHa: farms.reduce((s, f) => s + (f.total_area_ha ?? 0), 0),
    totalFields: farms.reduce((s, f) => s + f._count.fields, 0),
    deviceCount: farms.reduce((s, f) => s + f._count.devices, 0),
  };

  return (
    <FarmsClient
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
      farms={farms.map((f) => ({
        id: f.id,
        name: f.name,
        farmType: f.farm_type,
        latitude: f.latitude,
        longitude: f.longitude,
        totalAreaHa: f.total_area_ha,
        cultivableHa: f.cultivable_ha,
        soilType: f.soil_type,
        soilPh: f.soil_ph,
        irrigationType: f.irrigation_type,
        irrigationSource: f.irrigation_source,
        status: f.status,
        currentCrop: f.current_crop,
        cropVariety: f.crop_variety,
        plantingDate: f.planting_date ? f.planting_date.toISOString() : null,
        expectedHarvest: f.expected_harvest
          ? f.expected_harvest.toISOString()
          : null,
        createdAt: f.created_at.toISOString(),
        owner: f.user
          ? {
              id: f.user.id,
              name: f.user.full_name,
              email: f.user.email,
              role: f.user.role,
              organizationId: f.user.organizationId,
            }
          : null,
        group: f.group
          ? {
              id: f.group.id,
              name: f.group.name,
              groupType: f.group.group_type,
              organizationId: f.group.organizationId,
            }
          : null,
        counts: {
          fields: f._count.fields,
          devices: f._count.devices,
          weatherStations: f._count.weatherStations,
        },
      }))}
      farmers={farmers}
      groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        groupType: g.group_type,
        organizationId: g.organizationId,
        memberCount: g._count.members,
      }))}
      stats={stats}
    />
  );
}