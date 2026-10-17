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

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(5, parseInt(sp.get("pageSize") ?? "20", 10))
    );

    const where: any = { field: { farmId } };

    const [total, cycles] = await Promise.all([
      prisma.cropCycle.count({ where }),
      prisma.cropCycle.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          cycle_number: true,
          cycle_name: true,
          crop_type: true,
          variety: true,
          planting_date: true,
          expected_harvest: true,
          actual_harvest: true,
          status: true,
          total_yield_kg: true,
          yield_per_ha: true,
          total_cost: true,
          revenue: true,
          profit: true,
          field: { select: { id: true, name: true, field_number: true } },
          _count: { select: { harvests: true, activities: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: cycles.map((c) => ({
          id: c.id,
          cycleNumber: c.cycle_number,
          cycleName: c.cycle_name,
          cropType: c.crop_type,
          variety: c.variety,
          plantingDate: c.planting_date.toISOString(),
          expectedHarvest: c.expected_harvest
            ? c.expected_harvest.toISOString()
            : null,
          actualHarvest: c.actual_harvest
            ? c.actual_harvest.toISOString()
            : null,
          status: c.status,
          totalYieldKg: c.total_yield_kg,
          yieldPerHa: c.yield_per_ha,
          totalCost: c.total_cost,
          revenue: c.revenue,
          profit: c.profit,
          field: {
            id: c.field.id,
            name: c.field.name,
            fieldNumber: c.field.field_number,
          },
          harvestsCount: c._count.harvests,
          activitiesCount: c._count.activities,
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
    console.error("[org/:id/farms/:farmId/cycles]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}