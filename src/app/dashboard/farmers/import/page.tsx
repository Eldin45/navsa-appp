// src/app/dashboard/farmers/import/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import ImportFarmersClient from "./page.client";

export default async function ImportFarmersPage() {
  const user = await getCurrentUser();

  if (!user)
    redirect(
      "/?callbackUrl=" + encodeURIComponent("/dashboard/farmers/import")
    );

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <ImportFarmersClient
      user={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === "SUPER_ADMIN",
        organizationId: user.organizationId,
      }}
    />
  );
}