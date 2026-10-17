// src/app/admin/organizations/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import OrganizationsListClient from "./page.client";

export default async function OrganizationsListPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect("/?callbackUrl=" + encodeURIComponent("/admin/organizations"));
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // ADMIN only sees their own organization
  const where = isSuperAdmin
    ? {}
    : { id: user.organizationId ?? "__none__" };

  const orgs = await prisma.organization.findMany({
    where,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      legal_name: true,
      slug: true,
      type: true,
      country: true,
      region: true,
      city: true,
      phone: true,
      email: true,
      website: true,
      verified: true,
      status: true,
      created_at: true,
      _count: {
        select: {
          users: true,
          farmers: true,
          suppliers: true,
          farmGroups: true,
        },
      },
    },
  });

  const organizations = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    legalName: o.legal_name,
    slug: o.slug,
    type: o.type,
    country: o.country,
    region: o.region,
    city: o.city,
    phone: o.phone,
    email: o.email,
    website: o.website,
    verified: o.verified,
    status: o.status,
    createdAt: o.created_at.toISOString(),
    counts: {
      users: o._count.users,
      farmers: o._count.farmers,
      suppliers: o._count.suppliers,
      farmGroups: o._count.farmGroups,
    },
  }));

  const totalOrganizations = organizations.length;
  const totalFarmers = organizations.reduce((s, o) => s + o.counts.farmers, 0);
  const totalSuppliers = organizations.reduce(
    (s, o) => s + o.counts.suppliers,
    0
  );
  const totalUsers = organizations.reduce((s, o) => s + o.counts.users, 0);

  return (
    <OrganizationsListClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin,
      }}
      organizations={organizations}
      stats={{
        totalOrganizations,
        totalFarmers,
        totalSuppliers,
        totalUsers,
      }}
    />
  );
}