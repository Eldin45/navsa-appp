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
      | Promise<{ id: string; groupId: string }>
      | { id: string; groupId: string };
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

    const { id: orgId, groupId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    if (!isSuperAdmin && user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const group = await prisma.farmGroup.findUnique({
      where: { id: groupId },
      select: { organizationId: true },
    });
    if (!group || group.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Farm group not found" },
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

    const where: any = { groupId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { current_crop: { contains: search } },
        { user: { full_name: { contains: search } } },
      ];
    }

    const [total, farms] = await Promise.all([
      prisma.farm.count({ where }),
      prisma.farm.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          farm_type: true,
          total_area_ha: true,
          cultivable_ha: true,
          current_crop: true,
          crop_variety: true,
          status: true,
          created_at: true,
          user: { select: { id: true, full_name: true, email: true } },
          _count: { select: { fields: true, devices: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: farms.map((f) => ({
          id: f.id,
          name: f.name,
          farmType: f.farm_type,
          totalAreaHa: f.total_area_ha,
          cultivableHa: f.cultivable_ha,
          currentCrop: f.current_crop,
          cropVariety: f.crop_variety,
          status: f.status,
          createdAt: f.created_at.toISOString(),
          owner: {
            id: f.user.id,
            name: f.user.full_name,
            email: f.user.email,
          },
          fieldsCount: f._count.fields,
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
    console.error("[org/:id/farm-groups/:groupId/farms]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}