// src/app/api/dashboard/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const runtime = "nodejs";

function toCSV(rows: any[], headers: string[]): string {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = headers.join(",");
  const body = rows
    .map((r) => headers.map((h) => esc(r[h])).join(","))
    .join("\n");
  return head + "\n" + body;
}

function sinceDate(range: string): Date | undefined {
  const now = Date.now();
  switch (range) {
    case "30":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "90":
      return new Date(now - 90 * 24 * 60 * 60 * 1000);
    case "365":
      return new Date(now - 365 * 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "FARMER"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { type, range } = await req.json();
    const since = sinceDate(range ?? "all");

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdmin = user.role === "ADMIN";
    const orgId = user.organizationId ?? "__none__";

    let csv = "";

    if (type === "farmers") {
      const rows = await prisma.user.findMany({
        where: {
          role: "FARMER",
          ...(isSuperAdmin ? {} : isAdmin ? { organizationId: orgId } : { id: user.id }),
          ...(since ? { created_at: { gte: since } } : {}),
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          status: true,
          created_at: true,
          farmerProfile: {
            select: {
              farmer_code: true,
              primary_crops: true,
              years_farming: true,
              total_land_ha: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      csv = toCSV(
        rows.map((r) => ({
          id: r.id,
          name: r.full_name,
          email: r.email,
          phone: r.phone ?? "",
          status: r.status,
          farmer_code: r.farmerProfile?.farmer_code ?? "",
          primary_crops: r.farmerProfile?.primary_crops ?? "",
          years_farming: r.farmerProfile?.years_farming ?? "",
          total_land_ha: r.farmerProfile?.total_land_ha ?? "",
          created_at: r.created_at.toISOString(),
        })),
        [
          "id",
          "name",
          "email",
          "phone",
          "status",
          "farmer_code",
          "primary_crops",
          "years_farming",
          "total_land_ha",
          "created_at",
        ]
      );
    } else if (type === "farms") {
      const rows = await prisma.farm.findMany({
        where: {
          ...(isSuperAdmin
            ? {}
            : isAdmin
              ? {
                  OR: [
                    { user: { organizationId: orgId } },
                    { group: { organizationId: orgId } },
                  ],
                }
              : { userId: user.id }),
          ...(since ? { created_at: { gte: since } } : {}),
        },
        select: {
          id: true,
          name: true,
          farm_type: true,
          status: true,
          total_area_ha: true,
          cultivable_ha: true,
          current_crop: true,
          created_at: true,
          user: { select: { full_name: true } },
          group: { select: { name: true } },
          _count: { select: { fields: true, devices: true } },
        },
        orderBy: { created_at: "desc" },
      });

      csv = toCSV(
        rows.map((f) => ({
          id: f.id,
          name: f.name,
          farm_type: f.farm_type,
          status: f.status,
          total_area_ha: f.total_area_ha,
          cultivable_ha: f.cultivable_ha ?? "",
          current_crop: f.current_crop ?? "",
          owner: f.user?.full_name ?? "",
          group: f.group?.name ?? "",
          fields: f._count.fields,
          devices: f._count.devices,
          created_at: f.created_at.toISOString(),
        })),
        [
          "id",
          "name",
          "farm_type",
          "status",
          "total_area_ha",
          "cultivable_ha",
          "current_crop",
          "owner",
          "group",
          "fields",
          "devices",
          "created_at",
        ]
      );
    } else if (type === "input-requests") {
      const rows = await prisma.inputRequest.findMany({
        where: {
          ...(isSuperAdmin
            ? {}
            : isAdmin
              ? { farmer: { organizationId: orgId } }
              : { farmerId: user.id }),
          ...(since ? { requested_date: { gte: since } } : {}),
        },
        select: {
          id: true,
          request_number: true,
          status: true,
          total_amount: true,
          currency: true,
          requested_date: true,
          farmer: { select: { full_name: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { requested_date: "desc" },
      });

      csv = toCSV(
        rows.map((r) => ({
          id: r.id,
          request_number: r.request_number,
          farmer: r.farmer.full_name,
          email: r.farmer.email,
          items: r._count.items,
          total_amount: r.total_amount,
          currency: r.currency,
          status: r.status,
          requested_date: r.requested_date.toISOString(),
        })),
        [
          "id",
          "request_number",
          "farmer",
          "email",
          "items",
          "total_amount",
          "currency",
          "status",
          "requested_date",
        ]
      );
    } else if (type === "wallets") {
      const walletIds = (
        await prisma.wallet.findMany({
          where: isSuperAdmin
            ? {}
            : isAdmin
              ? { user: { organizationId: orgId } }
              : { userId: user.id },
          select: { id: true },
        })
      ).map((w) => w.id);

      const rows = await prisma.walletTransaction.findMany({
        where: {
          walletId: { in: walletIds },
          ...(since ? { created_at: { gte: since } } : {}),
        },
        select: {
          id: true,
          type: true,
          category: true,
          amount: true,
          fee: true,
          balanceBefore: true,
          balanceAfter: true,
          reference: true,
          description: true,
          status: true,
          created_at: true,
          wallet: { select: { type: true, accountNumber: true } },
          user: { select: { full_name: true, email: true } },
        },
        orderBy: { created_at: "desc" },
        take: 5000,
      });

      csv = toCSV(
        rows.map((t) => ({
          id: t.id,
          date: t.created_at.toISOString(),
          owner: t.user.full_name,
          email: t.user.email,
          wallet_type: t.wallet.type,
          wallet_account: t.wallet.accountNumber,
          type: t.type,
          category: t.category ?? "",
          amount: t.amount,
          fee: t.fee,
          balance_before: t.balanceBefore,
          balance_after: t.balanceAfter,
          reference: t.reference,
          description: t.description,
          status: t.status,
        })),
        [
          "id",
          "date",
          "owner",
          "email",
          "wallet_type",
          "wallet_account",
          "type",
          "category",
          "amount",
          "fee",
          "balance_before",
          "balance_after",
          "reference",
          "description",
          "status",
        ]
      );
    } else if (type === "full") {
      // Combined report
      const [farmers, farms, requests, wallets] = await Promise.all([
        prisma.user.count({
          where: {
            role: "FARMER",
            ...(isSuperAdmin ? {} : isAdmin ? { organizationId: orgId } : { id: user.id }),
          },
        }),
        prisma.farm.count({
          where: isSuperAdmin
            ? {}
            : isAdmin
              ? {
                  OR: [
                    { user: { organizationId: orgId } },
                    { group: { organizationId: orgId } },
                  ],
                }
              : { userId: user.id },
        }),
        prisma.inputRequest.count({
          where: isSuperAdmin
            ? {}
            : isAdmin
              ? { farmer: { organizationId: orgId } }
              : { farmerId: user.id },
        }),
        prisma.wallet.aggregate({
          _sum: { balance: true, availableBalance: true },
          where: isSuperAdmin
            ? {}
            : isAdmin
              ? { user: { organizationId: orgId } }
              : { userId: user.id },
        }),
      ]);

      csv = toCSV(
        [
          { metric: "Total farmers", value: farmers },
          { metric: "Total farms", value: farms },
          { metric: "Input requests", value: requests },
          {
            metric: "Wallet balance",
            value: Number(walletAgg._sum.balance ?? 0),
          },
          {
            metric: "Wallet available",
            value: Number(walletAgg._sum.availableBalance ?? 0),
          },
        ],
        ["metric", "value"]
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Unknown report type" },
        { status: 400 }
      );
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="navsa-${type}-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("[/api/dashboard/reports/export] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Export failed" },
      { status: 500 }
    );
  }
}