import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import ReportsClient from "./page.client";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/admin/reports"));
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/unauthorized");
  }

  return (
    <ReportsClient
      user={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === "SUPER_ADMIN",
      }}
    />
  );
}