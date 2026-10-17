// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import DashboardHomeClient from "./page.client";

export default async function DashboardHome() {
  const user = await getCurrentUser();

  if (!user) redirect("/?callbackUrl=" + encodeURIComponent("/dashboard"));

  if (
    !["SUPER_ADMIN", "ADMIN", "ORG_ADMIN", "SUPPLIER", "FARMER"].includes(
      user.role
    )
  ) {
    redirect("/unauthorized");
  }

  const role = user.role;
  const isAdminLike = role === "ADMIN" || role === "ORG_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  // ---- Role-scoped data ----
  let farms: any[] = [];
  let inputRequests: any[] = [];
  let orders: any[] = [];
  let inventory: any[] = [];

  if (role === "FARMER") {
    farms = await prisma.farm.findMany({
      where: { userId: user.id },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        total_area_ha: true,
        current_crop: true,
        status: true,
        _count: { select: { fields: true } },
      },
    });
  }

  if (isAdminLike) {
    inputRequests = await prisma.inputRequest.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        farmer: { organizationId: orgId },
      },
      orderBy: { requested_date: "desc" },
      take: 5,
      select: {
        id: true,
        request_number: true,
        status: true,
        total_amount: true,
        requested_date: true,
        farmer: { select: { id: true, full_name: true, email: true } },
      },
    });
  }

  if (role === "SUPPLIER") {
    orders = await prisma.inputOrder.findMany({
      where: {
        supplier: { userId: user.id },
        status: { in: ["PENDING", "ACCEPTED", "PROCESSING"] },
      },
      orderBy: { ordered_date: "desc" },
      take: 5,
      select: {
        id: true,
        order_number: true,
        status: true,
        total_amount: true,
        ordered_date: true,
        farmer: { select: { id: true, full_name: true, email: true } },
      },
    });

    inventory = await prisma.inputInventory.findMany({
      where: { supplier: { userId: user.id }, is_active: true },
      orderBy: { item_name: "asc" },
      take: 5,
      select: {
        id: true,
        item_name: true,
        item_type: true,
        current_stock: true,
        unit_type: true,
      },
    });
  }

  // Wallet snapshot
  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      type: true,
      accountNumber: true,
      accountName: true,
      balance: true,
      availableBalance: true,
      palmPayAccountNumber: true,
      palmPayBankName: true,
      palmPayStatus: true,
    },
  });

  // Metrics for role home cards
  const metrics =
    role === "FARMER"
      ? {
          farms: await prisma.farm.count({ where: { userId: user.id } }),
          activeCycles: await prisma.cropCycle.count({
            where: {
              field: { farm: { userId: user.id } },
              status: { in: ["PLANTED", "GROWING", "HARVESTING"] },
            },
          }),
          totalAreaHa: (
            await prisma.farm.aggregate({
              where: { userId: user.id },
              _sum: { total_area_ha: true },
            })
          )._sum.total_area_ha ?? 0,
        }
      : isAdminLike
        ? {
            farmers: await prisma.user.count({
              where: { role: "FARMER", organizationId: orgId },
            }),
            pendingRequests: await prisma.inputRequest.count({
              where: {
                farmer: { organizationId: orgId },
                status: "PENDING",
              },
            }),
          }
        : role === "SUPPLIER"
          ? {
              pendingOrders: await prisma.inputOrder.count({
                where: {
                  supplier: { userId: user.id },
                  status: { in: ["PENDING", "ACCEPTED", "PROCESSING"] },
                },
              }),
              inventoryItems: await prisma.inputInventory.count({
                where: { supplier: { userId: user.id }, is_active: true },
              }),
            }
          : {};

  return (
    <DashboardHomeClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      }}
      wallets={wallets.map((w) => ({
        id: w.id,
        type: w.type,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        balance: Number(w.balance),
        availableBalance: Number(w.availableBalance),
        palmPayAccountNumber: w.palmPayAccountNumber,
        palmPayBankName: w.palmPayBankName,
        palmPayStatus: w.palmPayStatus,
      }))}
      farms={farms.map((f) => ({
        id: f.id,
        name: f.name,
        totalAreaHa: f.total_area_ha,
        currentCrop: f.current_crop,
        status: f.status,
        fieldCount: f._count.fields,
      }))}
      inputRequests={inputRequests.map((r) => ({
        id: r.id,
        requestNumber: r.request_number,
        status: r.status,
        totalAmount: Number(r.total_amount),
        requestedDate: r.requested_date.toISOString(),
        farmer: r.farmer,
      }))}
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        totalAmount: Number(o.total_amount),
        orderedDate: o.ordered_date.toISOString(),
        farmer: o.farmer,
      }))}
      inventory={inventory.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        itemType: i.item_type,
        currentStock: i.current_stock,
        unitType: i.unit_type,
      }))}
      metrics={metrics as any}
    />
  );
}