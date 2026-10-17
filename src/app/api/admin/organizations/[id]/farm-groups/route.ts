import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id: orgId } = await params;

    if (user.role === "ADMIN" && user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { organizationId: orgId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { region: { contains: search } },
        { village: { contains: search } },
      ];
    }

    const [total, groups] = await Promise.all([
      prisma.farmGroup.count({ where }),
      prisma.farmGroup.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          group_type: true,
          region: true,
          local_government: true,
          village: true,
          total_area_ha: true,
          member_count: true,
          status: true,
          created_at: true,
          _count: {
            select: { members: true, farms: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          groupType: g.group_type,
          region: g.region,
          localGovernment: g.local_government,
          village: g.village,
          totalAreaHa: g.total_area_ha,
          memberCount: g.member_count ?? g._count.members,
          status: g.status,
          createdAt: g.created_at.toISOString(),
          farmsCount: g._count.farms,
          membersCount: g._count.members,
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
    console.error("[admin/organizations/:id/farm-groups]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}