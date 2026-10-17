// src/ui/components/dashboard/header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  Calendar,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Check,
  Inbox,
  Clock,
  Leaf,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "harvest" | "alert" | "info" | "success";
}

interface HeaderProps {
  userData: {
    name: string;
    email: string;
    role: string;
  };
  notifications: NotificationItem[];
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  toggleMenu: () => void;
}

export default function DashboardHeader({
  userData,
  notifications,
  isNotificationOpen,
  setIsNotificationOpen,
  isProfileOpen,
  setIsProfileOpen,
  toggleMenu,
}: HeaderProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setIsNotificationOpen, setIsProfileOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    setQuery("");
  };

  const initials =
    userData.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const roleLabel: Record<string, string> = {
    FARMER: "Farmer",
    SUPPLIER: "Supplier",
    ADMIN: "Organization",
    SUPER_ADMIN: "Platform View",
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu */}
        <button
          onClick={toggleMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <form onSubmit={submitSearch} className="hidden flex-1 md:block max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search farms, orders, farmers…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </form>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 md:flex">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-700">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsProfileOpen(false);
              }}
              className={`relative rounded-lg p-2 transition ${
                isNotificationOpen
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      {unread > 0 ? `${unread} unread` : "All caught up"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <button
                      onClick={() => {
                        fetch("/api/notifications/mark-all-read", {
                          method: "POST",
                        }).then(() => window.location.reload());
                      }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Mark all
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                      <Inbox className="h-6 w-6" />
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 ${
                          !n.read ? "bg-emerald-50/40" : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                            n.read ? "bg-slate-300" : "bg-emerald-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                            {n.message}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(n.time).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 p-2">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationOpen(false);
              }}
              className={`flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition ${
                isProfileOpen ? "bg-emerald-50" : "hover:bg-slate-100"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-900">
                  {userData.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {roleLabel[userData.role] ?? userData.role}
                </p>
              </div>
              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition-transform md:block ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {userData.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {userData.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                    <Leaf className="h-3 w-3" />
                    {roleLabel[userData.role]?.toUpperCase() ?? userData.role}
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={() =>
                      signOut({
                        redirect: true,
                        callbackUrl: `${window.location.origin}/`,
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}