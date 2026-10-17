import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import InputsClient from "./page.client";

export default async function InputsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard/inputs"));
  }
  if (user.role !== "FARMER") {
    redirect("/unauthorized");
  }

  return (
    <InputsClient
      user={{
        id: user.id,
        name: user.name ?? "Farmer",
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      }}
    />
  );
}