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
    const status = sp.get("status") ?? "ALL";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = {
      role: "FARMER",
      organizationId: orgId,
    };
    if (status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, farmers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          status: true,
          created_at: true,
          last_login: true,
          farmerProfile: {
            select: {
              farmer_code: true,
              primary_crops: true,
              total_land_ha: true,
            },
          },
          _count: {
            select: { farms: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: farmers.map((f) => ({
          id: f.id,
          name: f.full_name,
          email: f.email,
          phone: f.phone,
          status: f.status,
          farmerCode: f.farmerProfile?.farmer_code ?? null,
          primaryCrops: f.farmerProfile?.primary_crops ?? null,
          totalLandHa: f.farmerProfile?.total_land_ha ?? null,
          farmsCount: f._count.farms,
          createdAt: f.created_at.toISOString(),
          lastLoginAt: f.last_login ? f.last_login.toISOString() : null,
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
    console.error("[admin/organizations/:id/farmers]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}