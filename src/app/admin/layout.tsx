// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import AdminLayoutClient from "./layout.client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?callbackUrl=" + encodeURIComponent("/admin/dashboard"));
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isPlatformAdmin = isSuperAdmin || user.role === "PLATFORM_ADMIN";

  if (!isPlatformAdmin) {
    redirect("/unauthorized");
  }

  // Platform-wide stats — no org scoping for either role.
  const [
    activeFields,
    harvestReady,
    pendingApprovals,
    unreadNotifications,
    lowStockItems,
  ] = await Promise.all([
    prisma.farmField.count({ where: { status: "ACTIVE" } }),
    prisma.cropCycle.count({ where: { status: "HARVESTING" } }),
    prisma.inputRequest.count({ where: { status: "PENDING" } }),
    prisma.notification.count({
      where: { userId: user.id, is_read: false },
    }),
    prisma.inputInventory.count({
      where: { current_stock: { lte: 5 }, is_active: true },
    }),
  ]);

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

  return (
    <AdminLayoutClient
      userData={{
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email,
        role: user.role,
        isSuperAdmin,
        isPlatformAdmin,
        organizationId: user.organizationId,
      }}
      stats={{
        activeFields,
        harvestReady,
        lowStockItems,
        pendingApprovals,
        notifications: unreadNotifications,
      }}
      initialNotifications={notifications}
    >
      {children}
    </AdminLayoutClient>
  );
}