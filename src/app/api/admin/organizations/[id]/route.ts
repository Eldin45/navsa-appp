// src/app/api/admin/organizations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
// import {
//   getOrganizationById,
//   updateOrganization,
//   updateOrganizationSchema,
// } from "~/lib/services/organization.service";

import { getOrganizationById, updateOrganization, updateOrganizationSchema } from "~/lib/services/organisation.service";

// ============================================================
// GET — single org
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const { organization, walletTotals } = await getOrganizationById(id, user.id);

    return NextResponse.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          legalName: organization.legal_name,
          slug: organization.slug,
          type: organization.type,
          country: organization.country,
          region: organization.region,
          city: organization.city,
          address: organization.address,
          phone: organization.phone,
          email: organization.email,
          website: organization.website,
          logoUrl: organization.logo_url,
          verified: organization.verified,
          verifiedAt: organization.verified_at
            ? organization.verified_at.toISOString()
            : null,
          status: organization.status,
          createdAt: organization.created_at.toISOString(),
          counts: {
            users: organization._count.users,
            farmers: organization._count.farmers,
            suppliers: organization._count.suppliers,
            farmGroups: organization._count.farmGroups,
          },
        },
        members: organization.users.map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.created_at.toISOString(),
          wallet: u.wallets[0]
            ? {
                id: u.wallets[0].id,
                type: u.wallets[0].type,
                accountNumber: u.wallets[0].accountNumber,
                balance: Number(u.wallets[0].balance),
                palmPayAccountNumber: u.wallets[0].palmPayAccountNumber,
                palmPayBankName: u.wallets[0].palmPayBankName,
                palmPayStatus: u.wallets[0].palmPayStatus,
              }
            : null,
        })),
        walletTotals,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch organization" },
      { status: err.message === "Forbidden" ? 403 : 400 }
    );
  }
}

// ============================================================
// PATCH — update org
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const validated = updateOrganizationSchema.parse({
      ...body,
      organizationId: id,
    });

    const result = await updateOrganization(validated, user.id, req);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update organization" },
      { status: 400 }
    );
  }
}