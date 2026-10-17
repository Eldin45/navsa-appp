import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import FarmDetailClient from "./page.client";

export default async function OrgFarmDetailPage({
  params,
}: {
  params:
    | Promise<{ id: string; farmId: string }>
    | { id: string; farmId: string };
}) {
  const { id, farmId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      "/?callbackUrl=" +
        encodeURIComponent(`/admin/organizations/${id}/farms/${farmId}`)
    );
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/unauthorized");
  }
  if (user.role === "ADMIN" && user.organizationId !== id) {
    notFound();
  }

  return (
    <FarmDetailClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === "SUPER_ADMIN",
      }}
      organizationId={id}
      farmId={farmId}
    />
  );
}