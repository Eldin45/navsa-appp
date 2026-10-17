// src/app/api/admin/invites/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  acceptAdminInvite,
  acceptAdminInviteSchema,
} from "~/lib/services/admin.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = acceptAdminInviteSchema.parse(body);
    const result = await acceptAdminInvite(validated, req);
    return NextResponse.json({
      success: true,
      data: {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}