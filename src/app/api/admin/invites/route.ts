// src/app/api/admin/invites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import {
  createAdminInvite,
  createAdminInviteSchema,
  listAdminInvites,
} from "~/lib/services/admin.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invites = await listAdminInvites(user.id);
  return NextResponse.json({ success: true, data: invites });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const validated = createAdminInviteSchema.parse(body);
    const invite = await createAdminInvite(validated, user.id, req);
    return NextResponse.json({ success: true, data: invite }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}