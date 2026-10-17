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

    const where: any = { farmId };

    const [total, harvests] = await Promise.all([
      prisma.harvest.count({ where }),
      prisma.harvest.findMany({
        where,
        orderBy: { harvest_date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          harvest_date: true,
          quantity: true,
          unit: true,
          quality_grade: true,
          moisture_pct: true,
          status: true,
          verified_at: true,
          cycle: {
            select: {
              id: true,
              crop_type: true,
              cycle_number: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: harvests.map((h) => ({
          id: h.id,
          harvestDate: h.harvest_date.toISOString(),
          quantity: h.quantity,
          unit: h.unit,
          qualityGrade: h.quality_grade,
          moisturePct: h.moisture_pct,
          status: h.status,
          verifiedAt: h.verified_at ? h.verified_at.toISOString() : null,
          cycle: {
            id: h.cycle.id,
            cropType: h.cycle.crop_type,
            cycleNumber: h.cycle.cycle_number,
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
    console.error("[org/:id/farms/:farmId/harvests]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}