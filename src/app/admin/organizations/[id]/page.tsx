import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import OrganizationDetailClient from "./page.client";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    redirect(
      "/?callbackUrl=" + encodeURIComponent(`/admin/organizations/${id}`)
    );
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/unauthorized");
  }

  // ADMIN can only view their own organization
  if (user.role === "ADMIN" && user.organizationId !== id) {
    notFound();
  }

  return (
    <OrganizationDetailClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === "SUPER_ADMIN",
      }}
      organizationId={id}
    />
  );
}