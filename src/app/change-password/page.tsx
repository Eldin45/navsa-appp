// src/app/change-password/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser, resolveDashboardForRole } from "~/lib/session";
import ChangePasswordClient from "./page.client";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");
  if (!user.mustChangePassword) {
    // Already changed → send them to their normal landing
    redirect(resolveDashboardForRole(user.role));
  }

  return <ChangePasswordClient />;
}