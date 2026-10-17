import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import FarmerDetailClient from "./page.client";

export default async function OrgFarmerDetailPage({
  params,
}: {
  params:
    | Promise<{ id: string; farmerId: string }>
    | { id: string; farmerId: string };
}) {
  const { id, farmerId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      "/?callbackUrl=" +
        encodeURIComponent(`/admin/organizations/${id}/farmers/${farmerId}`)
    );
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/unauthorized");
  }
  if (user.role === "ADMIN" && user.organizationId !== id) {
    notFound();
  }

  return (
    <FarmerDetailClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === "SUPER_ADMIN",
      }}
      organizationId={id}
      farmerId={farmerId}
    />
  );
}