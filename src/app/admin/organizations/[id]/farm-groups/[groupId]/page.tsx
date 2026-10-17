import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import FarmGroupDetailClient from "./page.client";

export default async function OrgFarmGroupDetailPage({
  params,
}: {
  params:
    | Promise<{ id: string; groupId: string }>
    | { id: string; groupId: string };
}) {
  const { id, groupId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      "/?callbackUrl=" +
        encodeURIComponent(
          `/admin/organizations/${id}/farm-groups/${groupId}`
        )
    );
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/unauthorized");
  }
  if (user.role === "ADMIN" && user.organizationId !== id) {
    notFound();
  }

  return (
    <FarmGroupDetailClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === "SUPER_ADMIN",
      }}
      organizationId={id}
      groupId={groupId}
    />
  );
}