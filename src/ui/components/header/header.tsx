// src/components/dashboard/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Add this import
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Menu, X, Calendar, RefreshCw, User, Settings, ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    try {
      // Your logout logic here
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          {/* Left side: Logo and menu button */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 mr-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white transition-all duration-200 group-hover:bg-gray-50 p-1.5">
                <Image
                  src="/uploads/NITDA.png"
                  alt="NITDA Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">NAVSA</h1>
                <p className="text-xs text-gray-700 dark:text-gray-400">NAVSA ADMIN</p>
              </div>
            </Link>
          </div>

          {/* Center: Search bar for desktop */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Search farmers, farms, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Right side: User actions */}
          <div className="flex items-center space-x-3">
            {/* Date display */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
              <Calendar className="w-4 h-4 text-gray-700 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>

            {/* Refresh button */}
            <button className="p-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:bg-gray-800">
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:bg-gray-800 relative"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:hover:bg-gray-800"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2e7d32]/10 group-hover:bg-[#2e7d32]/20 transition-colors duration-200">
                  <User className="w-5 h-5 text-[#2e7d32]" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-400">
                    Administrator
                  </p>
                </div>
                <ChevronDown className="hidden lg:block w-4 h-4 text-gray-700 dark:text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 z-50">
                  <div className="p-3 border-b dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2e7d32]/10">
                        <User className="w-6 h-6 text-[#2e7d32]" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">Admin User</p>
                        <p className="text-xs text-gray-700 dark:text-gray-400 truncate">
                          admin@navsa.com
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                      onClick={() =>
                        signOut({
                          redirect: true,
                          callbackUrl: `${window.location.origin}/`,
                        })
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors duration-200 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="mt-3 lg:hidden">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Search farmers, farms, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
}