// src/app/api/admin/organizations/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
// import {
//   verifyOrganization,
//   verifyOrganizationSchema,
// } from "~/lib/services/organization.service";

import { verifyOrganization, verifyOrganizationSchema} from "~/lib/services/organisation.service";


export async function POST(
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

    const validated = verifyOrganizationSchema.parse({
      ...body,
      organizationId: id,
    });

    const result = await verifyOrganization(validated, user.id, req);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify organization" },
      { status: 400 }
    );
  }
}