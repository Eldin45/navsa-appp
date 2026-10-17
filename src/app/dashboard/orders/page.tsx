import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import OrdersClient from "./page.client";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/orders"));
  }
  if (user.role !== "SUPPLIER") {
    redirect("/unauthorized");
  }

  return (
    <OrdersClient
      user={{
        id: user.id,
        name: user.name ?? "Supplier",
        email: user.email,
        role: user.role,
      }}
    />
  );
}