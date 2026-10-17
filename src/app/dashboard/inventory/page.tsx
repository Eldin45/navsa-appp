import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import InventoryClient from "./page.client";

export default async function InventoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/inventory"));
  }
  if (user.role !== "SUPPLIER") {
    redirect("/unauthorized");
  }

  return (
    <InventoryClient
      user={{
        id: user.id,
        name: user.name ?? "Supplier",
        email: user.email,
        role: user.role,
      }}
    />
  );
}