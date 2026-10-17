// src/app/admin/layout.client.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "~/ui/components/admin/header";
import AdminSidebar from "~/ui/components/admin/sidebar";

interface LayoutClientProps {
  children: React.ReactNode;
  userData: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    isPlatformAdmin: boolean; // ← NEW
    organizationId: string | null;
  };
  stats: {
    activeFields: number;
    harvestReady: number;
    lowStockItems: number;
    pendingApprovals: number;
    notifications: number;
  };
  initialNotifications?: any[];
}

export default function AdminLayoutClient({
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
  const [notifications, setNotifications] = useState(initialNotifications);
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

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — fixed, z-30 (mobile drawer at z-50) */}
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isMobile={isMobile}
        userData={{
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isSuperAdmin: userData.isSuperAdmin,
          isPlatformAdmin: userData.isPlatformAdmin, // ← NEW
          organizationId: userData.organizationId,
        }}
        stats={stats}
      />

      {/* Content column — offset by sidebar width on desktop */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          !isMobile ? "lg:pl-64" : ""
        }`}
      >
        {/* Header — sticky inside the content column so it never sits under the sidebar */}
        <AdminHeader
          userData={{
            name: userData.name,
            email: userData.email,
            role: userData.role,
            isSuperAdmin: userData.isSuperAdmin,
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