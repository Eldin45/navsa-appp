// src/app/admin/dashboard/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Package,
  MapPin,
  TrendingUp,
  Download,
  ChevronRight,
  UserCog,
  Mail,
  Wallet,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";

// ============================================================
// TYPES
// ============================================================

interface Props {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isSuperAdmin: boolean;
    organizationId: string | null;
  };
  stats: {
    totalFarmers: number;
    totalOrganizations: number;
    totalAdmins: number;
    totalSuppliers: number;
    totalFarms: number;
    pendingApplications: number;
  };
  walletStats: {
    totalWallets: number;
    palmPayActive: number;
    palmPayFailed: number;
    totalBalance: number;
    totalAvailable: number;
  };
  farmersByOrganization: Array<{ organization: string; farmer_count: number }>;
  topOrganizations: Array<{ organization: string; farmer_count: number }>;
  recentApplications: Array<{
    id: string;
    application_number: string;
    business_name: string;
    contact_full_name: string;
    status: string;
    submittedAt: string;
  }>;
  recentInvites: Array<{
    id: string;
    email: string;
    full_name: string;
    organizationName: string;
    status: string;
    created_at: string;
  }>;
  farmerGrowth: Array<{ date: string; count: number }>;
}

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  hint,
  href,
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  hint?: string;
  href?: string;
}) => {
  const colorClasses = {
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-green-50 text-green-600 border-green-100",
    warning: "bg-yellow-50 text-yellow-600 border-yellow-100",
    danger: "bg-red-50 text-red-600 border-red-100",
    info: "bg-cyan-50 text-cyan-600 border-cyan-100",
  } as const;

  const body = (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${colorClasses[color]} hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="rounded-full p-2 bg-white/60">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
};

// ============================================================
// CHART — FARMERS BY ORGANIZATION
// ============================================================

const FarmersByOrganizationChart = ({
  data,
  isSuperAdmin,
}: {
  data: Array<{ organization: string; farmer_count: number }>;
  isSuperAdmin: boolean;
}) => {
  const chartData = (data || [])
    .map((d) => ({
      organization: d.organization || "Unassigned",
      count: Number(d.farmer_count) || 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const total = chartData.reduce((s, d) => s + d.count, 0);

  const COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#6B7280",
    "#0EA5E9", "#84CC16",
  ];

  const download = () => {
    const csv = chartData.map((d) => `${d.organization},${d.count}`).join("\n");
    const blob = new Blob([`Organization,Farmers\n${csv}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "farmers_by_organization.csv";
    a.click();
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900">
          {isSuperAdmin ? "Farmers by Organization" : "Farmers by Farm Group"}
        </h3>
        <p className="text-sm text-gray-600">No farmer data available</p>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No farmers registered yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isSuperAdmin ? "Farmers by Organization" : "Farmers by Farm Group"}
          </h3>
          <p className="text-sm text-gray-600">
            {isSuperAdmin
              ? "Distribution across NAVSA organizations"
              : "Distribution within your organization"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Total Farmers</div>
            <div className="text-lg font-bold text-[#2e7d32]">
              {total.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {isSuperAdmin ? "Organizations" : "Groups"}
            </div>
            <div className="text-lg font-bold text-[#2e7d32]">
              {chartData.length}
            </div>
          </div>
          <button
            onClick={download}
            className="rounded-lg border border-gray-300 bg-white p-1.5 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" stroke="#6B7280" />
            <YAxis
              type="category"
              dataKey="organization"
              stroke="#6B7280"
              width={110}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                borderColor: "#374151",
                color: "#F9FAFB",
              }}
              formatter={(v: number) => [
                `${v.toLocaleString()} farmers`,
                "Count",
              ]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================================
// CHART — 30-DAY GROWTH
// ============================================================

const FarmerGrowthChart = ({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <h3 className="text-lg font-bold text-gray-900">Growth</h3>
    <p className="text-sm text-gray-600">New farmers (last 30 days)</p>
    <div className="h-56 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" hide />
          <YAxis stroke="#6B7280" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              borderColor: "#374151",
              color: "#F9FAFB",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#2e7d32"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ============================================================
// MAIN
// ============================================================

export default function AdminDashboardClient({
  user,
  stats,
  walletStats,
  farmersByOrganization,
  topOrganizations,
  recentApplications,
  recentInvites,
  farmerGrowth,
}: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const isSuperAdmin = user.isSuperAdmin;

  const maxOrg = useMemo(
    () => Math.max(1, ...topOrganizations.map((o) => o.farmer_count)),
    [topOrganizations]
  );

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Welcome back
          </h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin
              ? "Platform-wide oversight — organizations, suppliers, farmers, and wallets"
              : "Organization overview — farmers, wallets, and input requests"}
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            window.location.reload();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2e7d32] px-4 py-2 text-white text-sm font-medium hover:bg-[#1b5e20]"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Farmers"
          value={stats.totalFarmers.toLocaleString()}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Total Farms"
          value={stats.totalFarms.toLocaleString()}
          icon={MapPin}
          color="primary"
        />
        <StatCard
          title="Total Wallets"
          value={walletStats.totalWallets.toLocaleString()}
          icon={Wallet}
          color="primary"
          hint={`${walletStats.palmPayActive} PalmPay active · ${walletStats.palmPayFailed} failed`}
        />
        <StatCard
          title={isSuperAdmin ? "Platform Balance" : "Org Balance"}
          value={`₦${walletStats.totalBalance.toLocaleString()}`}
          icon={TrendingUp}
          color="success"
          hint={`Available: ₦${walletStats.totalAvailable.toLocaleString()}`}
        />

        {isSuperAdmin ? (
          <>
            <StatCard
              title="Organizations"
              value={stats.totalOrganizations.toLocaleString()}
              icon={Building2}
              color="primary"
              href="/admin/organizations"
            />
            <StatCard
              title="Admins"
              value={stats.totalAdmins.toLocaleString()}
              icon={UserCog}
              color="info"
              href="/admin/admins"
            />
            <StatCard
              title="Suppliers"
              value={stats.totalSuppliers.toLocaleString()}
              icon={Package}
              color="warning"
              href="/admin/suppliers/applications"
            />
            <StatCard
              title="Pending Applications"
              value={stats.pendingApplications.toLocaleString()}
              icon={AlertTriangle}
              color={stats.pendingApplications > 0 ? "danger" : "success"}
              href="/admin/suppliers/applications"
              hint={
                stats.pendingApplications > 0 ? "Needs review" : "All caught up"
              }
            />
          </>
        ) : (
          <>
            <StatCard
              title="Admins"
              value={stats.totalAdmins.toLocaleString()}
              icon={UserCog}
              color="info"
            />
            <StatCard
              title="Suppliers"
              value={stats.totalSuppliers.toLocaleString()}
              icon={Package}
              color="warning"
            />
            <StatCard
              title="Organization"
              value={stats.totalOrganizations.toLocaleString()}
              icon={Building2}
              color="primary"
            />
            <StatCard
              title="Pending Applications"
              value={stats.pendingApplications.toLocaleString()}
              icon={AlertTriangle}
              color={stats.pendingApplications > 0 ? "danger" : "success"}
              hint={
                stats.pendingApplications > 0
                  ? "Platform-wide pending review"
                  : "All caught up"
              }
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FarmersByOrganizationChart
          data={farmersByOrganization}
          isSuperAdmin={isSuperAdmin}
        />

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-lg font-bold text-gray-900">
              {isSuperAdmin ? "Top Organizations" : "Top Farm Groups"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">Highest farmer counts</p>
            {topOrganizations.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topOrganizations.map((o, i) => {
                  const colors = [
                    "#3B82F6",
                    "#10B981",
                    "#F59E0B",
                    "#EF4444",
                    "#8B5CF6",
                  ];
                  return (
                    <div key={o.organization}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate max-w-[60%]">
                          {o.organization}
                        </span>
                        <span className="font-medium text-gray-900">
                          {o.farmer_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(o.farmer_count / maxOrg) * 100}%`,
                            backgroundColor: colors[i % colors.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 p-3">
                <div className="text-xs text-green-600">PalmPay Active</div>
                <div className="text-lg font-bold text-gray-900">
                  {walletStats.palmPayActive}
                </div>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <div className="text-xs text-red-600">PalmPay Failed</div>
                <div className="text-lg font-bold text-gray-900">
                  {walletStats.palmPayFailed}
                </div>
              </div>
            </div>
          </div>

          <FarmerGrowthChart data={farmerGrowth} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent supplier applications */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Recent Supplier Applications
              </h3>
              <p className="text-sm text-gray-600">Latest submissions</p>
            </div>
            {isSuperAdmin && (
              <Link
                href="/admin/suppliers/applications"
                className="text-sm text-[#2e7d32] flex items-center"
              >
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>

          {recentApplications.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet</p>
          ) : (
            <div className="divide-y">
              {recentApplications.map((a) => (
                <div
                  key={a.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {a.business_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {a.contact_full_name} · {a.application_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        a.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : a.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {a.status}
                    </span>
                    {isSuperAdmin && (
                      <Link
                        href={`/admin/suppliers/applications/${a.id}`}
                        className="text-[#2e7d32] text-sm"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isSuperAdmin ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Recent Admin Invites
                </h3>
                <p className="text-sm text-gray-600">Latest invitations sent</p>
              </div>
              <Link
                href="/admin/invites"
                className="text-sm text-[#2e7d32] flex items-center"
              >
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {recentInvites.length === 0 ? (
              <p className="text-sm text-gray-500">No invites yet</p>
            ) : (
              <div className="divide-y">
                {recentInvites.map((i) => (
                  <div
                    key={i.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {i.full_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {i.organizationName} · {i.email}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        i.status === "ACCEPTED"
                          ? "bg-green-100 text-green-700"
                          : i.status === "REVOKED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-lg font-bold text-gray-900">
              Organization Info
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Your organization at a glance
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Organization ID</span>
                <span className="font-mono text-xs text-gray-900 truncate max-w-[60%]">
                  {user.organizationId ?? "—"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Role</span>
                <span className="text-gray-900">{user.role}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Email</span>
                <span className="text-gray-900 truncate max-w-[60%]">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scope</span>
                <span className="text-gray-900">Organization-wide</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isSuperAdmin ? (
            <>
              <Link
                href=""
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm font-medium">Invite an Admin</span>
              </Link>
              <Link
                href=""
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-700" />
                </div>
                <span className="text-sm font-medium">Review Suppliers</span>
              </Link>
              <Link
                href="/admin/admins"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCog className="h-4 w-4 text-purple-700" />
                </div>
                <span className="text-sm font-medium">Manage Admins</span>
              </Link>
              <Link
                href="/admin/wallets"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-orange-700" />
                </div>
                <span className="text-sm font-medium">Platform Wallets</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/farmers"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm font-medium">Manage Farmers</span>
              </Link>
              <Link
                href="/dashboard/input-requests"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-700" />
                </div>
                <span className="text-sm font-medium">Input Requests</span>
              </Link>
              <Link
                href="/dashboard/wallet"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-orange-700" />
                </div>
                <span className="text-sm font-medium">Organization Wallet</span>
              </Link>
              <Link
                href="/admin/organizations"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-700" />
                </div>
                <span className="text-sm font-medium">View Organizations</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}