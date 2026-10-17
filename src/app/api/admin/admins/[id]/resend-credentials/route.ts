// src/app/api/admin/admins/[id]/resend-credentials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { resendAdminCredentials } from "~/lib/services/admin.service";

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
    const result = await resendAdminCredentials(resolved.id, user.id);

    return NextResponse.json({
      success: true,
      message: `New credentials sent to ${result.email}`,
      data: { email: result.email, sent: result.ok },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to resend credentials" },
      { status: 400 }
    );
  }
}