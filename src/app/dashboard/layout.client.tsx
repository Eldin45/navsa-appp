// src/app/dashboard/layout.client.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardHeader from "~/ui/components/dashboard/header";
import DashboardSidebar from "~/ui/components/dashboard/sidebar";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "harvest" | "alert" | "info" | "success";
}

interface LayoutClientProps {
  children: React.ReactNode;
  userData: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
  };
  stats: {
    activeFields: number;
    pendingApprovals: number;
    inventoryCount: number;
    notifications: number;
  };
  initialNotifications?: NotificationItem[];
}

export default function DashboardLayoutClient({
  children,
  userData,
  stats,
  initialNotifications = [],
}: LayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Poll notifications
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch("/api/notifications?take=10");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.data)) {
            setNotifications(
              data.data.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.body,
                time: n.created_at,
                read: n.is_read,
                type: n.type,
              }))
            );
          }
        }
      } catch (err) {
        console.error("notifications refresh", err);
      }
    };
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isMobile={isMobile}
        userData={userData}
        stats={stats}
      />

      <div className={`flex min-h-screen flex-col transition-all duration-200 ${!isMobile ? "lg:pl-64" : ""}`}>
        <DashboardHeader
          userData={{
            name: userData.name,
            email: userData.email,
            role: userData.role,
          }}
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          setIsNotificationOpen={setIsNotificationOpen}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          toggleMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}