// src/app/api/dashboard/input-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const req = await prisma.inputRequest.findUnique({
    where: { id },
    include: {
      farmer: {
        select: {
          id: true,
          full_name: true,
          email: true,
          organizationId: true,
        },
      },
      items: true,
      approvedBy: { select: { id: true, full_name: true } },
      fundedBy: { select: { id: true, full_name: true } },
    },
  });

  if (!req) {
    return NextResponse.json(
      { success: false, error: "Request not found" },
      { status: 404 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  const isFarmer = user.role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  let allowed = isSuperAdmin;
  if (!allowed && isAdmin) {
    allowed = req.farmer.organizationId === orgId;
  }
  if (!allowed && isFarmer) {
    allowed = req.farmerId === user.id;
  }
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data: req });
}