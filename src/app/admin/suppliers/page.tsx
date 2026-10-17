// src/app/admin/suppliers/applications/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import SupplierApplicationsClient from "./page.client";

export default async function SupplierApplicationsPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect(
      "/?callbackUrl=" + encodeURIComponent("/admin/suppliers/applications")
    );
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/unauthorized");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const applications = await prisma.supplierApplication.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      reviewedBy: { select: { id: true, full_name: true, email: true } },
      approvedUser: { select: { id: true, email: true, full_name: true } },
    },
  });

  // ✅ Active organizations for the approve picker
  //    SUPER_ADMIN sees all; ADMIN sees only their own org
  const organizations = await prisma.organization.findMany({
    where: {
      status: "ACTIVE",
      ...(isSuperAdmin
        ? {}
        : { id: user.organizationId ?? "__none__" }),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  return (
    <SupplierApplicationsClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        organizationId: user.organizationId,
      }}
      applications={applications.map((a) => ({
        id: a.id,
        applicationNumber: a.application_number,
        contactFullName: a.contact_full_name,
        contactEmail: a.contact_email,
        contactPhone: a.contact_phone,
        businessName: a.business_name,
        businessType: a.business_type,
        registrationNumber: a.registration_number,
        taxId: a.tax_id,
        country: a.country,
        state: a.state,
        city: a.city,
        address: a.address,
        website: a.website,
        productCategories: a.product_categories,
        deliveryRegions: a.delivery_regions,
        yearsInBusiness: a.years_in_business,
        description: a.description,
        documents: Array.isArray(a.documents) ? a.documents : [],
        status: a.status,
        submittedAt: a.submittedAt.toISOString(),
        reviewedAt: a.reviewedAt ? a.reviewedAt.toISOString() : null,
        rejectionReason: a.rejectionReason,
        decisionNotes: a.decision_notes ?? null,
        approvedUserId: a.approvedUserId,
        reviewedBy: a.reviewedBy
          ? {
              id: a.reviewedBy.id,
              name: a.reviewedBy.full_name,
              email: a.reviewedBy.email,
            }
          : null,
        approvedUser: a.approvedUser
          ? {
              id: a.approvedUser.id,
              name: a.approvedUser.full_name,
              email: a.approvedUser.email,
            }
          : null,
      }))}
      organizations={organizations}
    />
  );
}