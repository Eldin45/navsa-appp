// src/ui/components/admin/sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Truck,
  UserCog,
  Wallet,
  FileBarChart,
  Settings,
  Users,
  ClipboardList,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import { SYSTEM_CONFIG } from "~/lib/config";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  userData: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    isPlatformAdmin: boolean;
    organizationId: string | null;
  };
  stats?: {
    activeFields?: number;
    harvestReady?: number;
    lowStockItems?: number;
    pendingApprovals?: number;
    notifications?: number;
  };
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
}

export default function AdminSidebar({
  isOpen,
  onClose,
  isMobile,
  userData,
  stats = {},
}: AdminSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = userData.isSuperAdmin;

  const superAdminNav: NavItem[] = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Organizations", href: "/admin/organizations", icon: Building2 },
    {
      title: "Suppliers",
      href: "/admin/suppliers",
      icon: Truck,
      badge: stats.pendingApprovals,
    },
    { title: "Admins", href: "/admin/admins", icon: UserCog },
    { title: "Wallets", href: "/admin/wallets", icon: Wallet },
    { title: "Farmers", href: "/admin/farmers", icon: Users },
    { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  ];

  const adminNav: NavItem[] = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Organizations", href: "/admin/organizations", icon: Building2 },
    {
      title: "Suppliers",
      href: "/admin/suppliers/applications",
      icon: Truck,
      badge: stats.pendingApprovals,
    },
    { title: "Wallets", href: "/admin/wallets", icon: Wallet },
    { title: "Farmers", href: "/admin/farmers", icon: Users },
    { title: "Requests", href: "/admin/input-requests", icon: ClipboardList },
    { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  ];

  const nav = isSuperAdmin ? superAdminNav : adminNav;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  const renderNav = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                active
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {/* Left accent bar */}
              <span
                className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-opacity ${
                  active ? "bg-emerald-500 opacity-100" : "opacity-0"
                }`}
              />

              <span className="flex items-center gap-3">
                <Icon
                  className={`h-[18px] w-[18px] ${
                    active
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.title}</span>
              </span>

              {item.badge && item.badge > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const body = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-emerald-500/20 ring-1 ring-slate-100">
            <Image
              src={SYSTEM_CONFIG.logo}
              alt="NAVSA"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-slate-900">
              NAVSA
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </div>
          </div>
        </Link>
      </div>

      {/* Role pill */}
      <div className="px-4 pt-4">
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
            isSuperAdmin
              ? "bg-emerald-50 text-emerald-700"
              : "bg-sky-50 text-sky-700"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{isSuperAdmin ? "Platform Owner" : "System Admin"}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {renderNav(nav)}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-100 p-3">
        <Link
          href="/admin/settings"
          onClick={isMobile ? onClose : undefined}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Settings className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600" />
          <span>Settings</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px] text-slate-400 group-hover:text-red-500" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  // ----------------------------------------------------------
  // MOBILE
  // ----------------------------------------------------------
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-white transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
          {body}
        </aside>
      </>
    );
  }

  // ----------------------------------------------------------
  // DESKTOP
  // ----------------------------------------------------------
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-100 bg-white shadow-sm">
      {body}
    </aside>
  );
}