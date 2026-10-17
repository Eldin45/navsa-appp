// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import DashboardLayoutClient from "./layout.client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/dashboard"));
  }

  // ORG_ADMIN is treated as an org admin here (same as ADMIN).
  if (
    !["SUPER_ADMIN", "ADMIN", "ORG_ADMIN", "SUPPLIER", "FARMER"].includes(
      user.role
    )
  ) {
    redirect("/unauthorized");
  }

  // Fetch role-scoped stats for the sidebar
  const role = user.role;
  const isAdminLike = role === "ADMIN" || role === "ORG_ADMIN";
  const orgId = user.organizationId ?? "__none__";

  let activeFields = 0;
  let pendingApprovals = 0;
  let inventoryCount = 0;

  if (role === "FARMER") {
    activeFields = await prisma.farmField.count({
      where: {
        status: "ACTIVE",
        farm: { userId: user.id },
      },
    });
  } else if (isAdminLike) {
    pendingApprovals = await prisma.inputRequest.count({
      where: {
        status: "PENDING",
        farmer: { organizationId: orgId },
      },
    });
  } else if (role === "SUPPLIER") {
    inventoryCount = await prisma.inputInventory.count({
      where: { supplier: { userId: user.id }, is_active: true },
    });
  }

  // Unread notifications
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, is_read: false },
  });

  // Latest 10 notifications
  const notificationsRaw = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { created_at: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      is_read: true,
      created_at: true,
    },
  });

  const notifications = notificationsRaw.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.body,
    time: n.created_at.toISOString(),
    read: n.is_read,
    type:
      n.type === "WALLET_FUNDED"
        ? ("success" as const)
        : n.type === "SYSTEM"
          ? ("info" as const)
          : ("info" as const),
  }));

  // Organization name for the admin / sub-admin pill
  let organizationName: string | null = null;
  if (isAdminLike && user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    });
    organizationName = org?.name ?? null;
  }

  return (
    <DashboardLayoutClient
      userData={{
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName,
      }}
      stats={{
        activeFields,
        pendingApprovals,
        inventoryCount,
        notifications: unreadCount,
      }}
      initialNotifications={notifications}
    >
      {children}
    </DashboardLayoutClient>
  );
}