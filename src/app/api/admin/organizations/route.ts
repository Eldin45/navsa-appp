// src/app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
// import {
//   createOrganization,
//   createOrganizationSchema,
//   listOrganizations,
// } from "~/lib/services/organization.service";
import { createOrganization, createOrganizationSchema, listOrganizations,} from "~/lib/services/organisation.service";
import { OrganizationType } from "@prisma/client";

// ============================================================
// GET — list
// ============================================================

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  console.log("🔵 [/api/admin/organizations] GET caller:", {
    email: user?.email,
    role: user?.role,
  });

  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const search =
      req.nextUrl.searchParams.get("search") || undefined;
    const type =
      (req.nextUrl.searchParams.get("type") as OrganizationType) || undefined;
    const verifiedParam = req.nextUrl.searchParams.get("verified");
    const verified =
      verifiedParam === "true"
        ? true
        : verifiedParam === "false"
          ? false
          : undefined;

    const orgs = await listOrganizations(user.id, {
      search,
      type,
      verified,
    });

    return NextResponse.json({
      success: true,
      data: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        legalName: o.legal_name,
        slug: o.slug,
        type: o.type,
        country: o.country,
        region: o.region,
        city: o.city,
        phone: o.phone,
        email: o.email,
        website: o.website,
        verified: o.verified,
        verifiedAt: o.verified_at ? o.verified_at.toISOString() : null,
        status: o.status,
        createdAt: o.created_at.toISOString(),
        counts: {
          users: o._count.users,
          farmers: o._count.farmers,
          suppliers: o._count.suppliers,
          farmGroups: o._count.farmGroups,
        },
      })),
    });
  } catch (err: any) {
    console.error("[/api/admin/organizations] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list organizations" },
      { status: 400 }
    );
  }
}

// ============================================================
// POST — create
// ============================================================

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();

  console.log("🔵 [/api/admin/organizations] POST caller:", {
    email: caller?.email,
    role: caller?.role,
  });

  if (!caller || caller.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // 🔍 log the raw body so we can see exactly what the client sent
    console.log("🔵 [/api/admin/organizations] POST body:", body);

    const validated = createOrganizationSchema.parse(body);

    const result = await createOrganization(validated, caller.id, req);

    return NextResponse.json(
      {
        success: true,
        message: result.representativeId
          ? "Organization created. Representative credentials emailed."
          : "Organization created.",
        data: {
          id: result.organization.id,
          slug: result.organization.slug,
          name: result.organization.name,
          representativeId: result.representativeId,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      console.error(
        "❌ [/api/admin/organizations] Zod validation failed:",
        JSON.stringify(err.errors, null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: err.errors,
        },
        { status: 400 }
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "A record with this information already exists",
        },
        { status: 409 }
      );
    }
    console.error("[/api/admin/organizations] POST error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to create organization",
      },
      { status: 400 }
    );
  }
}