import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
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
    const belongsToOrg =
      farm.user.organizationId === orgId ||
      farm.group?.organizationId === orgId;
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: "Farm not in this organization" },
        { status: 404 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { farmId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { field_number: { contains: search } },
      ];
    }

    const [total, fields] = await Promise.all([
      prisma.farmField.count({ where }),
      prisma.farmField.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          field_number: true,
          area_ha: true,
          soil_type: true,
          soil_depth: true,
          irrigation_method: true,
          status: true,
          latitude: true,
          longitude: true,
          created_at: true,
          _count: { select: { cropCycles: true, devices: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: fields.map((f) => ({
          id: f.id,
          name: f.name,
          fieldNumber: f.field_number,
          areaHa: f.area_ha,
          soilType: f.soil_type,
          soilDepth: f.soil_depth,
          irrigationMethod: f.irrigation_method,
          status: f.status,
          latitude: f.latitude,
          longitude: f.longitude,
          createdAt: f.created_at.toISOString(),
          cropCyclesCount: f._count.cropCycles,
          devicesCount: f._count.devices,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      },
    });
  } catch (err: any) {
    console.error("[org/:id/farms/:farmId/fields]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}