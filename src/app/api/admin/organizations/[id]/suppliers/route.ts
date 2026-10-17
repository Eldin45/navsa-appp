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

    const where: any = {
      OR: [
        { organizationId: orgId },
        { user: { organizationId: orgId } },
      ],
    };
    if (search) {
      where.AND = [
        {
          OR: [
            { business_name: { contains: search } },
            { user: { full_name: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        },
      ];
    }

    const [total, suppliers] = await Promise.all([
      prisma.supplierProfile.count({ where }),
      prisma.supplierProfile.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          supplier_code: true,
          business_name: true,
          business_type: true,
          product_categories: true,
          delivery_regions: true,
          verified: true,
          created_at: true,
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
          _count: {
            select: { inventory: true, orders: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: suppliers.map((s) => ({
          id: s.id,
          supplierCode: s.supplier_code,
          businessName: s.business_name,
          businessType: s.business_type,
          productCategories: s.product_categories,
          deliveryRegions: s.delivery_regions,
          verified: s.verified,
          createdAt: s.created_at.toISOString(),
          user: {
            id: s.user.id,
            name: s.user.full_name,
            email: s.user.email,
            phone: s.user.phone,
            status: s.user.status,
          },
          inventoryCount: s._count.inventory,
          ordersCount: s._count.orders,
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
    console.error("[admin/organizations/:id/suppliers]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}