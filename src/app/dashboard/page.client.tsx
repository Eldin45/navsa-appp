// src/app/dashboard/page.client.tsx
"use client";

import Link from "next/link";
import {
  Sprout,
  Wallet,
  CloudSun,
  Package,
  ShoppingCart,
  Users,
  ClipboardList,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
  };
  wallets: Array<{
    id: string;
    type: string;
    accountNumber: string;
    accountName: string;
    balance: number;
    availableBalance: number;
    palmPayAccountNumber: string | null;
    palmPayBankName: string | null;
    palmPayStatus: string | null;
  }>;
  farms: Array<{
    id: string;
    name: string;
    totalAreaHa: number;
    currentCrop: string | null;
    status: string;
    fieldCount: number;
  }>;
  inputRequests: Array<{
    id: string;
    requestNumber: string;
    status: string;
    totalAmount: number;
    requestedDate: string;
    farmer: { id: string; full_name: string; email: string };
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    orderedDate: string;
    farmer: { id: string; full_name: string; email: string };
  }>;
  inventory: Array<{
    id: string;
    itemName: string;
    itemType: string;
    currentStock: number;
    unitType: string;
  }>;
  metrics: any;
}

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: any;
  color?: "primary" | "success" | "warning" | "info";
  hint?: string;
}) => {
  const styles = {
    primary: {
      ring: "ring-blue-100",
      chip: "bg-blue-50 text-blue-600",
      bar: "bg-blue-500",
    },
    success: {
      ring: "ring-emerald-100",
      chip: "bg-emerald-50 text-emerald-600",
      bar: "bg-emerald-500",
    },
    warning: {
      ring: "ring-amber-100",
      chip: "bg-amber-50 text-amber-600",
      bar: "bg-amber-500",
    },
    info: {
      ring: "ring-sky-100",
      chip: "bg-sky-50 text-sky-600",
      bar: "bg-sky-500",
    },
  } as const;

  const s = styles[color];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      {/* accent bar */}
      <span
        className={`absolute left-0 top-0 h-1 w-full ${s.bar} opacity-80`}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ${s.chip} ${s.ring}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
};

// ============================================================
// MAIN
// ============================================================

export default function DashboardHomeClient({
  user,
  wallets,
  farms,
  inputRequests,
  orders,
  inventory,
  metrics,
}: Props) {
  const isAdminLike = user.role === "ADMIN" || user.role === "ORG_ADMIN";
  const isFarmer = user.role === "FARMER";
  const isSupplier = user.role === "SUPPLIER";

  const roleTitle: Record<string, string> = {
    FARMER: "Farmer Workspace",
    SUPPLIER: "Supplier Workspace",
    ADMIN: "Workspace",
    ORG_ADMIN: "Workspace",
    SUPER_ADMIN: "Platform View",
  };

  const roleDescription: Record<string, string> = {
    FARMER: "Your farms, weather, and wallet — all in one place.",
    SUPPLIER: "Your inventory, orders, and receivables.",
    ADMIN: "Your organization — farmers, input requests, and wallet.",
    ORG_ADMIN: "Your organization — farmers, input requests, and wallet.",
    SUPER_ADMIN: "View organizations, suppliers, and farmers.",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {roleTitle[user.role] ?? "Workspace"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {roleDescription[user.role] ?? ""}
        </p>
      </div>

      {/* Stat cards — role-specific */}
      {isFarmer && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="My Farms"
            value={metrics.farms ?? 0}
            icon={Sprout}
            color="success"
          />
          <StatCard
            label="Active Cycles"
            value={metrics.activeCycles ?? 0}
            icon={CloudSun}
            color="info"
          />
          <StatCard
            label="Total Area"
            value={`${Number(metrics.totalAreaHa ?? 0).toFixed(1)} ha`}
            icon={Sprout}
            color="primary"
          />
          <StatCard
            label="Wallets"
            value={wallets.length}
            icon={Wallet}
            color="warning"
          />
        </div>
      )}

      {isAdminLike && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Farmers"
            value={metrics.farmers ?? 0}
            icon={Users}
            color="success"
          />
          <StatCard
            label="Pending Requests"
            value={metrics.pendingRequests ?? 0}
            icon={ClipboardList}
            color={metrics.pendingRequests > 0 ? "warning" : "info"}
          />
          <StatCard
            label="Wallets"
            value={wallets.length}
            icon={Wallet}
            color="primary"
          />
        </div>
      )}

      {isSupplier && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pending Orders"
            value={metrics.pendingOrders ?? 0}
            icon={ShoppingCart}
            color="warning"
          />
          <StatCard
            label="Inventory Items"
            value={metrics.inventoryItems ?? 0}
            icon={Package}
            color="primary"
          />
          <StatCard
            label="Wallets"
            value={wallets.length}
            icon={Wallet}
            color="success"
          />
        </div>
      )}

      {/* Wallets */}
      {wallets.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Your Wallets</h2>
          <p className="text-xs text-slate-500">
            Fund via bank transfer to your dedicated virtual account
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {w.type.replace("_", " ")}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      {w.accountName}
                    </div>
                  </div>
                  <Wallet className="h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-3 text-2xl font-bold text-slate-900">
                  ₦{w.balance.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  Available: ₦{w.availableBalance.toLocaleString()}
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="text-slate-600">
                    NAVSA Acct:{" "}
                    <span className="font-mono">{w.accountNumber}</span>
                  </div>
                  {w.palmPayAccountNumber && (
                    <div className="text-slate-600">
                      PalmPay VA:{" "}
                      <span className="font-mono">
                        {w.palmPayAccountNumber}
                      </span>{" "}
                      · {w.palmPayBankName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FARMER: farms list */}
      {isFarmer && farms.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">My Farms</h2>
              <p className="text-xs text-slate-500">Recently added farms</p>
            </div>
            <Link
              href="/dashboard/farms"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {farms.map((f) => (
              <Link
                key={f.id}
                href={`/dashboard/farms/${f.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {f.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {f.fieldCount} field{f.fieldCount === 1 ? "" : "s"} ·{" "}
                    {f.totalAreaHa} ha
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN + ORG_ADMIN: pending input requests */}
      {isAdminLike && inputRequests.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Input Requests
              </h2>
              <p className="text-xs text-slate-500">
                From your organization's farmers
              </p>
            </div>
            <Link
              href="/dashboard/input-requests"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {inputRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {r.farmer.full_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.requestNumber} · ₦{r.totalAmount.toLocaleString()}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPLIER: orders + inventory */}
      {isSupplier && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {orders.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Orders
                </h2>
                <Link
                  href="/dashboard/orders"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900">
                        {o.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        {o.farmer.full_name} · ₦
                        {o.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inventory.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Inventory Snapshot
                </h2>
                <Link
                  href="/dashboard/inventory"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Manage
                </Link>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {inventory.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900">
                        {i.itemName}
                      </div>
                      <div className="text-xs text-slate-500">{i.itemType}</div>
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {i.currentStock} {i.unitType}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isFarmer && (
            <>
              <QuickAction
                href="/dashboard/farms"
                icon={Sprout}
                label="My Farms"
              />
              <QuickAction
                href="/dashboard/weather"
                icon={CloudSun}
                label="Weather"
              />
              <QuickAction
                href="/dashboard/wallet"
                icon={Wallet}
                label="Wallet"
              />
            </>
          )}

          {isAdminLike && (
            <>
              <QuickAction
                href="/dashboard/farmers"
                icon={Users}
                label="Manage Farmers"
              />
              <QuickAction
                href="/dashboard/input-requests"
                icon={ClipboardList}
                label="Input Requests"
              />
              <QuickAction
                href="/dashboard/wallet"
                icon={Wallet}
                label="Org Wallet"
              />
              <QuickAction
                href="/dashboard/reports"
                icon={TrendingUp}
                label="Reports"
              />
            </>
          )}

          {isSupplier && (
            <>
              <QuickAction
                href="/dashboard/inventory"
                icon={Package}
                label="Inventory"
              />
              <QuickAction
                href="/dashboard/orders"
                icon={ShoppingCart}
                label="Orders"
              />
              <QuickAction
                href="/dashboard/wallet"
                icon={Wallet}
                label="Wallet"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
    </Link>
  );
}