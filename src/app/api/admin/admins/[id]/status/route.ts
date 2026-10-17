// src/app/api/admin/admins/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import {
  updateAdminStatus,
  updateAdminStatusSchema,
} from "~/lib/services/admin.service";

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
    const resolved = await params;
    const body = await req.json();

    const validated = updateAdminStatusSchema.parse({
      ...body,
      adminId: resolved.id,
    });

    const result = await updateAdminStatus(validated, user.id, req);

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 400 }
    );
  }
}