// src/app/admin/input-requests/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import InputRequestsClient from "./page.client";

export default async function InputRequestsPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/?callbackUrl=" + encodeURIComponent("/admin/input-requests"));
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  const where = isSuperAdmin
    ? {}
    : { farmer: { organizationId: orgId } };

  const requests = await prisma.inputRequest.findMany({
    where,
    orderBy: { requested_date: "desc" },
    take: 300,
    include: {
      farmer: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          organization: { select: { id: true, name: true } },
        },
      },
      approvedBy: { select: { id: true, full_name: true } },
      fundedBy: { select: { id: true, full_name: true } },
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
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin,
      }}
      requests={requests.map((r) => ({
        id: r.id,
        requestNumber: r.request_number,
        farmerId: r.farmerId,
        farmId: r.farmId,
        cycleId: r.cycleId,
        status: r.status,
        requestedDate: r.requested_date.toISOString(),
        neededByDate: r.needed_by_date ? r.needed_by_date.toISOString() : null,
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
        farmer: {
          id: r.farmer.id,
          name: r.farmer.full_name,
          email: r.farmer.email,
          phone: r.farmer.phone,
          organization: r.farmer.organization
            ? { id: r.farmer.organization.id, name: r.farmer.organization.name }
            : null,
        },
        items: r.items.map((i) => ({
          id: i.id,
          itemName: i.item_name,
          itemType: i.item_type,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unit_price ? Number(i.unit_price) : null,
          totalPrice: i.total_price ? Number(i.total_price) : null,
        })),
      }))}
      stats={stats}
    />
  );
}