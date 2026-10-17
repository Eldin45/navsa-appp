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
      select: {
        id: true,
        name: true,
        description: true,
        group_type: true,
        region: true,
        local_government: true,
        village: true,
        gps_boundary: true,
        total_area_ha: true,
        member_count: true,
        status: true,
        created_at: true,
        organizationId: true,
        _count: { select: { members: true, farms: true } },
      },
    });

    if (!group || group.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Farm group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          groupType: group.group_type,
          region: group.region,
          localGovernment: group.local_government,
          village: group.village,
          gpsBoundary: group.gps_boundary,
          totalAreaHa: group.total_area_ha,
          memberCount: group.member_count ?? group._count.members,
          status: group.status,
          createdAt: group.created_at.toISOString(),
        },
        summary: {
          totalMembers: group._count.members,
          totalFarms: group._count.farms,
        },
      },
    });
  } catch (err: any) {
    console.error("[org/:id/farm-groups/:groupId]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}