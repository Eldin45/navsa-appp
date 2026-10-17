// src/ui/components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Sprout,
  CloudSun,
  Wallet,
  Users,
  ClipboardList,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  X,
  Building2,
  UserCog,
  FileBarChart,
  Network,
} from "lucide-react";
import { SYSTEM_CONFIG } from "~/lib/config";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  userData: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
  };
  stats?: {
    activeFields?: number;
    pendingApprovals?: number;
    inventoryCount?: number;
    notifications?: number;
  };
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
}

export default function DashboardSidebar({
  isOpen,
  onClose,
  isMobile,
  userData,
  stats = {},
}: SidebarProps) {
  const pathname = usePathname();
  const role = userData.role;

  const isOrgAdminLike = role === "ADMIN" || role === "ORG_ADMIN";

  // ----------------------------------------------------------
  // ROLE-SPECIFIC NAVIGATION
  // ----------------------------------------------------------

  const farmerNav: NavItem[] = [
    { title: "Home", href: "/dashboard", icon: Home },
    { title: "My Farms", href: "/dashboard/farms", icon: Sprout },
    { title: "Inputs", href: "/dashboard/inputs", icon: Package },
    { title: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  ];

  const supplierNav: NavItem[] = [
    { title: "Home", href: "/dashboard", icon: Home },
    {
      title: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      badge: stats.inventoryCount,
    },
    { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { title: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  ];

  const adminNav: NavItem[] = [
    { title: "Home", href: "/dashboard", icon: Home },
    { title: "Farmers", href: "/dashboard/farmers", icon: Users },
    { title: "Farms", href: "/dashboard/farms", icon: Sprout },
   
    {
      title: "Input Requests",
      href: "/dashboard/input-requests",
      icon: ClipboardList,
      badge: stats.pendingApprovals,
    },
    { title: "Wallets", href: "/dashboard/wallet", icon: Wallet },
    { title: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  ];

  const navByRole: Record<string, NavItem[]> = {
    FARMER: farmerNav,
    SUPPLIER: supplierNav,
    ADMIN: adminNav,
    ORG_ADMIN: adminNav,
    SUPER_ADMIN: adminNav,
  };

  const nav = navByRole[role] ?? farmerNav;

  // ----------------------------------------------------------
  // ROLE LABELS
  // ----------------------------------------------------------

  const roleLabel: Record<string, string> = {
    FARMER: "Farmer",
    SUPPLIER: "Supplier",
    ADMIN: "Organization",
    ORG_ADMIN: "Organization",
    SUPER_ADMIN: "Platform View",
  };

  const brandColor: Record<string, string> = {
    FARMER: "text-emerald-700",
    SUPPLIER: "text-sky-700",
    ADMIN: "text-indigo-700",
    ORG_ADMIN: "text-indigo-700",
    SUPER_ADMIN: "text-slate-700",
  };

  const accentBg: Record<string, string> = {
    FARMER: "bg-emerald-50 text-emerald-700",
    SUPPLIER: "bg-sky-50 text-sky-700",
    ADMIN: "bg-indigo-50 text-indigo-700",
    ORG_ADMIN: "bg-indigo-50 text-indigo-700",
    SUPER_ADMIN: "bg-slate-100 text-slate-700",
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  // Match exact or subpath, but avoid matching "/dashboard" for every route
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // ----------------------------------------------------------
  // NAV RENDER
  // ----------------------------------------------------------

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
              className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? `${accentBg[role] ?? "bg-emerald-50 text-emerald-700"} font-medium`
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-opacity ${
                  active
                    ? role === "FARMER"
                      ? "bg-emerald-500 opacity-100"
                      : role === "SUPPLIER"
                        ? "bg-sky-500 opacity-100"
                        : isOrgAdminLike
                          ? "bg-indigo-500 opacity-100"
                          : "bg-slate-500 opacity-100"
                    : "opacity-0"
                }`}
              />
              <span className="flex min-w-0 items-center gap-3">
                <Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 ${
                    active ? "" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </span>
              {item.badge && item.badge > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-white/70" : "bg-red-50 text-red-600"
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

  // ----------------------------------------------------------
  // BODY
  // ----------------------------------------------------------

  const body = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
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
            <div
              className={`text-sm font-bold tracking-tight ${
                brandColor[role] ?? "text-slate-900"
              }`}
            >
              NAVSA
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {roleLabel[role] ?? "Workspace"}
            </div>
          </div>
        </Link>
      </div>

      {/* Org pill for ADMIN / ORG_ADMIN */}
      {isOrgAdminLike && userData.organizationName && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{userData.organizationName}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {roleLabel[role] ?? "Workspace"}
        </div>
        {renderNav(nav)}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3">
        {role === "SUPER_ADMIN" && (
          <Link
            href="/admin/dashboard"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <UserCog className="h-[18px] w-[18px] text-slate-400" />
            <span>Admin Console</span>
          </Link>
        )}

        <Link
          href="/dashboard/settings"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Settings className="h-[18px] w-[18px] text-slate-400" />
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