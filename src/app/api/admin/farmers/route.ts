// src/app/api/admin/farmers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import {
  createFarmerByAdmin,
  createFarmerSchema,
  listFarmersByOrganization,
} from "~/lib/services/farmer.service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") || undefined;
  const farmers = await listFarmersByOrganization(user.id, { search });
  return NextResponse.json({ success: true, data: farmers });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const validated = createFarmerSchema.parse(body);
    const result = await createFarmerByAdmin(validated, user.id, req);
    return NextResponse.json(
      { success: true, data: { userId: result.user.id, email: result.user.email } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}