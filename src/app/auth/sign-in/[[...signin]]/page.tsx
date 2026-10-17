// src/app/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser, resolveDashboardForRole } from "~/lib/session";
import LoginPage from "./page.client";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.status === "PENDING_VERIFICATION") {
      redirect("/pending-verification");
    }
    redirect(resolveDashboardForRole(user.role));
  }

  return <LoginPage />;
}