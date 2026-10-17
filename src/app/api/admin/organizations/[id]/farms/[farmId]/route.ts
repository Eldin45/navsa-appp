import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; farmId: string }>
      | { id: string; farmId: string };
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id: orgId, farmId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    if (!isSuperAdmin && user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        name: true,
        farm_type: true,
        latitude: true,
        longitude: true,
        gps_boundary: true,
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
        updated_at: true,
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            organizationId: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    if (!farm) {
      return NextResponse.json(
        { success: false, error: "Farm not found" },
        { status: 404 }
      );
    }

    // Verify farm belongs to the org (either via owner or via group)
    const belongsToOrg =
      farm.user.organizationId === orgId ||
      farm.group?.organizationId === orgId;

    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: "Farm not in this organization" },
        { status: 404 }
      );
    }

    const [
      totalFields,
      totalCropCycles,
      totalHarvests,
      totalDevices,
      totalWeatherStations,
      activeCycles,
      harvestAgg,
      cycleByStatus,
      deviceByStatus,
    ] = await Promise.all([
      prisma.farmField.count({ where: { farmId } }),
      prisma.cropCycle.count({ where: { field: { farmId } } }),
      prisma.harvest.count({ where: { farmId } }),
      prisma.ioTDevice.count({ where: { farmId } }),
      prisma.weatherStation.count({ where: { farmId } }),
      prisma.cropCycle.count({
        where: {
          field: { farmId },
          status: { in: ["PLANTED", "GROWING", "HARVESTING"] },
        },
      }),
      prisma.harvest.aggregate({
        _sum: { quantity: true },
        where: { farmId },
      }),
      prisma.cropCycle.groupBy({
        by: ["status"],
        where: { field: { farmId } },
        _count: { _all: true },
      }),
      prisma.ioTDevice.groupBy({
        by: ["status"],
        where: { farmId },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        farm: {
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
          owner: {
            id: farm.user.id,
            name: farm.user.full_name,
            email: farm.user.email,
            phone: farm.user.phone,
          },
          group: farm.group
            ? { id: farm.group.id, name: farm.group.name }
            : null,
        },
        summary: {
          totalFields,
          totalCropCycles,
          totalHarvests,
          totalDevices,
          totalWeatherStations,
          activeCycles,
          totalHarvestQuantity: Number(harvestAgg._sum.quantity ?? 0),
        },
        cycleByStatus: cycleByStatus.map((r) => ({
          status: r.status,
          count: r._count._all,
        })),
        deviceByStatus: deviceByStatus.map((r) => ({
          status: r.status,
          count: r._count._all,
        })),
      },
    });
  } catch (err: any) {
    console.error("[org/:id/farms/:farmId]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}