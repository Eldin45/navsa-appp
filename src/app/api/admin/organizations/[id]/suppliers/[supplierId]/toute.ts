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
      | Promise<{ id: string; supplierId: string }>
      | { id: string; supplierId: string };
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
    const { id: orgId, supplierId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    if (!isSuperAdmin && user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const s = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        supplier_code: true,
        business_name: true,
        business_type: true,
        registration_no: true,
        tax_id: true,
        product_categories: true,
        delivery_regions: true,
        verified: true,
        verified_at: true,
        created_at: true,
        organizationId: true,
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            status: true,
            organizationId: true,
          },
        },
        _count: { select: { inventory: true, orders: true } },
      },
    });

    if (!s) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const belongs =
      s.organizationId === orgId || s.user.organizationId === orgId;
    if (!belongs) {
      return NextResponse.json(
        { success: false, error: "Supplier not in this organization" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        supplier: {
          id: s.id,
          supplierCode: s.supplier_code,
          businessName: s.business_name,
          businessType: s.business_type,
          registrationNo: s.registration_no,
          taxId: s.tax_id,
          productCategories: s.product_categories,
          deliveryRegions: s.delivery_regions,
          verified: s.verified,
          verifiedAt: s.verified_at ? s.verified_at.toISOString() : null,
          createdAt: s.created_at.toISOString(),
          user: {
            id: s.user.id,
            name: s.user.full_name,
            email: s.user.email,
            phone: s.user.phone,
            status: s.user.status,
          },
        },
        summary: {
          inventoryCount: s._count.inventory,
          ordersCount: s._count.orders,
        },
      },
    });
  } catch (err: any) {
    console.error("[org/:id/suppliers/:supplierId]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}