import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { listSupplierApplications } from "~/lib/services/supplier-application.service";
import { ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const status = req.nextUrl.searchParams.get(
    "status"
  ) as ApplicationStatus | null;

  const apps = await listSupplierApplications(
    user.id,
    status ? { status } : undefined
  );
  return NextResponse.json({ success: true, data: apps });
}