// src/app/dashboard/input-requests/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import InputRequestsClient from "./page.client";

export default async function InputRequestsPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect(
      "/?callbackUrl=" + encodeURIComponent("/dashboard/input-requests")
    );

  const role = user.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isFarmer = role === "FARMER";
  const orgId = user.organizationId ?? "__none__";

  if (!["SUPER_ADMIN", "ADMIN", "FARMER"].includes(role)) {
    redirect("/unauthorized");
  }

  // ---- Scope ----
  let requestWhere: any;
  if (isSuperAdmin) {
    requestWhere = {};
  } else if (isAdmin) {
    requestWhere = { farmer: { organizationId: orgId } };
  } else {
    requestWhere = { farmerId: user.id };
  }

  // ---- Farmers the admin can create requests for ----
  let farmers: any[] = [];
  if (isAdmin || isSuperAdmin) {
    farmers = await prisma.user.findMany({
      where: isSuperAdmin
        ? { role: "FARMER" }
        : { role: "FARMER", organizationId: orgId },
      orderBy: { full_name: "asc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        organizationId: true,
      },
    });
  }

  // ---- Farms per farmer (for the create modal) ----
  let farms: any[] = [];
  if (isAdmin || isSuperAdmin || isFarmer) {
    farms = await prisma.farm.findMany({
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
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        userId: true,
        groupId: true,
      },
    });
  }

  // ---- Supplier inventory items (for the line-item picker) ----
  const inventory = await prisma.inputInventory.findMany({
    where: { is_active: true },
    orderBy: { item_name: "asc" },
    take: 300,
    select: {
      id: true,
      item_name: true,
      item_type: true,
      unit_type: true,
      unit_cost: true,
      currency: true,
      supplierId: true,
      supplier: {
        select: {
          id: true,
          business_name: true,
          userId: true,
        },
      },
    },
  });

  // ---- Requests ----
  const requests = await prisma.inputRequest.findMany({
    where: requestWhere,
    orderBy: { requested_date: "desc" },
    take: 300,
    include: {
      farmer: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          organizationId: true,
        },
      },
      approvedBy: { select: { id: true, full_name: true } },
      fundedBy: { select: { id: true, full_name: true } },
      fundedFromWallet: {
        select: { id: true, accountNumber: true, type: true },
      },
      items: true,
    },
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    funded: requests.filter((r) => r.status === "FUNDED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
    totalAmount: requests.reduce((s, r) => s + Number(r.total_amount), 0),
  };

  return (
    <InputRequestsClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        isAdmin,
        isFarmer,
        organizationId: user.organizationId,
      }}
      requests={requests.map((r) => ({
        id: r.id,
        requestNumber: r.request_number,
        farmerId: r.farmerId,
        farmId: r.farmId,
        cycleId: r.cycleId,
        status: r.status,
        requestedDate: r.requested_date.toISOString(),
        neededByDate: r.needed_by_date
          ? r.needed_by_date.toISOString()
          : null,
        totalAmount: Number(r.total_amount),
        currency: r.currency,
        notes: r.notes,
        approvedAt: r.approved_at ? r.approved_at.toISOString() : null,
        approvedBy: r.approvedBy
          ? { id: r.approvedBy.id, name: r.approvedBy.full_name }
          : null,
        rejectionReason: r.rejection_reason,
        fundedAt: r.funded_at ? r.funded_at.toISOString() : null,
        fundedBy: r.fundedBy
          ? { id: r.fundedBy.id, name: r.fundedBy.full_name }
          : null,
        fundedAmount: r.funded_amount ? Number(r.funded_amount) : null,
        fundedFromWallet: r.fundedFromWallet
          ? {
              id: r.fundedFromWallet.id,
              accountNumber: r.fundedFromWallet.accountNumber,
              type: r.fundedFromWallet.type,
            }
          : null,
        farmer: {
          id: r.farmer.id,
          name: r.farmer.full_name,
          email: r.farmer.email,
          phone: r.farmer.phone,
          organizationId: r.farmer.organizationId,
        },
        items: r.items.map((i) => ({
          id: i.id,
          inventoryId: i.inventoryId,
          itemName: i.item_name,
          itemType: i.item_type,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unit_price ? Number(i.unit_price) : null,
          totalPrice: i.total_price ? Number(i.total_price) : null,
          notes: i.notes,
        })),
      }))}
      farmers={farmers}
      farms={farms}
      inventory={inventory.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        itemType: i.item_type,
        unitType: i.unit_type,
        unitCost: i.unit_cost ? Number(i.unit_cost) : null,
        currency: i.currency,
        supplierId: i.supplierId,
        supplier: i.supplier
          ? {
              id: i.supplier.id,
              businessName: i.supplier.business_name,
              userId: i.supplier.userId,
            }
          : null,
      }))}
      stats={stats}
    />
  );
}