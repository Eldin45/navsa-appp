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
    const role = sp.get("role") ?? "ALL";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { groupId };
    if (role !== "ALL") where.role = role;
    if (search) {
      where.user = {
        OR: [
          { full_name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const [total, members] = await Promise.all([
      prisma.farmGroupMember.count({ where }),
      prisma.farmGroupMember.findMany({
        where,
        orderBy: { joined_date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          role: true,
          membership_status: true,
          joined_date: true,
          exit_date: true,
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              status: true,
              _count: { select: { farms: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: members.map((m) => ({
          id: m.id,
          role: m.role,
          membershipStatus: m.membership_status,
          joinedDate: m.joined_date.toISOString(),
          exitDate: m.exit_date ? m.exit_date.toISOString() : null,
          user: {
            id: m.user.id,
            name: m.user.full_name,
            email: m.user.email,
            phone: m.user.phone,
            status: m.user.status,
            farmsCount: m.user._count.farms,
          },
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
    console.error("[org/:id/farm-groups/:groupId/members]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}