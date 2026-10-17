"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
  QrCode,
} from "lucide-react";
import { signOut } from "next-auth/react";

// 1. Define the type for a single notification
interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

// 2. Define the props for the Header component
interface HeaderProps {
  userData: {
    name: string;
    email: string;
    avatar?: string | null; // avatar can be a string or null
  } | null; // userData can be null if the user isn't logged in
  notifications: Notification[];
  isNotificationOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isProfileOpen: boolean;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMenu: () => void;
}

// 3. Apply the HeaderProps interface to the component
const Header = ({
  userData,
  notifications,
  isNotificationOpen,
  setIsNotificationOpen,
  isProfileOpen,
  setIsProfileOpen,
  toggleMenu,
}: HeaderProps) => (
  <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    {/* Left section: Mobile Menu & Branding */}
    <div className="flex items-center space-x-2">
      <button className="p-1 md:hidden" onClick={toggleMenu}>
        <Menu className="h-6 w-6" />
      </button>

      {/* Replaced Dashboard icon and text with the Qreta logo */}
      <Link
        className="flex items-center space-x-2 text-2xl font-extrabold tracking-tight text-primary transition-transform duration-300 hover:scale-105"
        href="/dashboard"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white ml-4">
          <QrCode className="h-5 w-5" />
        </div>
        <span>Qreta</span>
      </Link>
    </div>

    {/* Right section: Actions & User Profile */}
    <div className="flex items-center space-x-4">
      {/* Search Bar - Hidden on mobile */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="w-64 rounded-lg border bg-white py-2 pl-10 pr-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          placeholder="Search..."
          type="text"
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          className="relative p-1"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        >
          <Bell className="h-5 w-5" />
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>

        {isNotificationOpen && (
          <div className="absolute right-0 top-12 w-80 rounded-lg border bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-3 dark:border-gray-800">
              <h3 className="font-medium">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-3 dark:border-gray-800 ${!notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <p className="text-sm">{notification.text}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {notification.time}
                    </p>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </p>
              )}
            </div>
            <div className="border-t p-2 dark:border-gray-800">
              <button className="w-full py-2 text-sm text-primary hover:text-primary/80">
                Mark all as read
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="relative">
        <button
          className="flex items-center space-x-2"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          {userData?.avatar ? (
            <img
              src={userData.avatar}
              alt="User"
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-5 w-5" />
            </div>
          )}
          <span className="hidden text-sm font-medium md:block">
            {userData?.name || "User"}
          </span>
          <ChevronDown className="hidden h-4 w-4 md:block" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 top-12 w-48 rounded-lg border bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-4 dark:border-gray-800">
              <p className="text-sm font-medium">{userData?.name || "User"}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {userData?.email}
              </p>
              {/* <p> </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {userData?.rf_link}
              </p> */}
            </div>
            <div className="p-2">
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                <User className="mr-2 h-4 w-4" />
                Profile
              </button>
            </div>
            <div className="border-t p-2 dark:border-gray-800">
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() =>
                  signOut({
                    redirect: true,
                    callbackUrl: `${window.location.origin}/auth/sign-in`,
                  })
                }
                className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </header>
);

export default Header;
