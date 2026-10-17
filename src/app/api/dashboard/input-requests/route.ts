// src/app/api/dashboard/input-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

// ============================================================
// HELPERS
// ============================================================

function generateRequestNumber(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `REQ-${ts}-${rand}`;
}

async function loadRequestScoped(
  id: string,
  userId: string,
  role: string,
  orgId: string | null
) {
  const req = await prisma.inputRequest.findUnique({
    where: { id },
    include: {
      farmer: { select: { id: true, organizationId: true } },
    },
  });
  if (!req)
    return { ok: false as const, error: "Request not found", status: 404 };

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isFarmer = role === "FARMER";
  const scopedOrg = orgId ?? "__none__";

  let allowed = isSuperAdmin;
  if (!allowed && isAdmin) {
    allowed = req.farmer.organizationId === scopedOrg;
  }
  if (!allowed && isFarmer) {
    allowed = req.farmerId === userId;
  }
  if (!allowed)
    return { ok: false as const, error: "Forbidden", status: 403 };

  return { ok: true as const, req };
}

// ============================================================
// SCHEMAS
// ============================================================

const lineItemSchema = z.object({
  inventoryId: z.string().nullable().optional(),
  item_name: z.string().min(1),
  item_type: z.string().default("OTHER"),
  quantity: z.coerce.number().positive(),
  unit: z.string().default("unit"),
  unit_price: z.coerce.number().nonnegative().nullable().optional(),
});

const createSchema = z.object({
  farmerId: z.string().min(1),
  farmId: z.string().nullable().optional(),
  cycleId: z.string().nullable().optional(),
  neededByDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(lineItemSchema).min(1),
});

// ============================================================
// GET — list
// ============================================================

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  const orgId = user.organizationId ?? "__none__";

  const where = isSuperAdmin
    ? {}
    : isAdmin
      ? { farmer: { organizationId: orgId } }
      : { farmerId: user.id };

  const rows = await prisma.inputRequest.findMany({
    where,
    orderBy: { requested_date: "desc" },
    take: 300,
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
    },
  });

  return NextResponse.json({ success: true, data: rows });
}

// ============================================================
// POST — create
// ============================================================

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Farmer creating for themselves: force farmerId = caller.id
    let farmerId = data.farmerId;
    if (caller.role === "FARMER") {
      farmerId = caller.id;
    }

    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      select: { id: true, role: true, organizationId: true },
    });
    if (!farmer || farmer.role !== "FARMER") {
      return NextResponse.json(
        { success: false, error: "Farmer not found" },
        { status: 400 }
      );
    }

    // Admin scoping
    if (caller.role === "ADMIN") {
      if (farmer.organizationId !== caller.organizationId) {
        return NextResponse.json(
          { success: false, error: "Farmer not in your organization" },
          { status: 403 }
        );
      }
    }

    // Optional farm ownership check
    if (data.farmId) {
      const farm = await prisma.farm.findUnique({
        where: { id: data.farmId },
        select: { id: true, userId: true, groupId: true },
      });
      if (!farm) {
        return NextResponse.json(
          { success: false, error: "Farm not found" },
          { status: 400 }
        );
      }
      const ownsFarm =
        farm.userId === farmerId ||
        (farm.groupId
          ? await prisma.farmGroupMember
              .findFirst({
                where: {
                  groupId: farm.groupId,
                  userId: farmerId,
                  membership_status: "ACTIVE",
                },
                select: { id: true },
              })
              .then((m) => !!m)
          : false);
      if (!ownsFarm) {
        return NextResponse.json(
          { success: false, error: "Farm does not belong to the farmer" },
          { status: 400 }
        );
      }
    }

    // Compute totals
    let totalAmount = 0;
    for (const it of data.items) {
      const up = it.unit_price ?? 0;
      totalAmount += it.quantity * up;
    }

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.inputRequest.create({
        data: {
          request_number: generateRequestNumber(),
          farmerId,
          farmId: data.farmId ?? null,
          cycleId: data.cycleId ?? null,
          status: "PENDING",
          requested_date: new Date(),
          needed_by_date: data.neededByDate
            ? new Date(data.neededByDate)
            : null,
          total_amount: totalAmount,
          currency: "NGN",
          notes: data.notes ?? null,
          items: {
            create: data.items.map((it) => ({
              inventoryId: it.inventoryId ?? null,
              item_name: it.item_name,
              item_type: it.item_type,
              quantity: it.quantity,
              unit: it.unit,
              unit_price: it.unit_price ?? null,
              total_price:
                it.unit_price != null ? it.unit_price * it.quantity : null,
            })),
          },
        },
        select: { id: true, request_number: true },
      });

      await tx.auditLog.create({
        data: {
          userId: caller.id,
          action: "CREATE_INPUT_REQUEST",
          entity_type: "INPUT_REQUEST",
          entity_id: created.id,
          new_values: JSON.stringify({
            farmerId,
            farmId: data.farmId ?? null,
            totalAmount,
          }),
          success: true,
        },
      });

      // Notify admins of the org
      if (farmer.organizationId) {
        const admins = await tx.user.findMany({
          where: { role: "ADMIN", organizationId: farmer.organizationId },
          select: { id: true },
        });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              title: "New input request",
              body: `${created.request_number} awaits review.`,
              type: "INPUT_REQUEST",
              reference_type: "INPUT_REQUEST",
              reference_id: created.id,
            })),
          });
        }
      }

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: request.id, requestNumber: request.request_number },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/input-requests] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create request" },
      { status: 400 }
    );
  }
}