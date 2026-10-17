// src/app/dashboard/reports/page.client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Sprout,
  Layers,
  Activity,
  Package,
  ShoppingCart,
  Banknote,
  TrendingUp,
  Download,
  Cpu,
  CheckCircle2,
  Network,
  BarChart3,
  FileText,
  Loader2,
  AlertCircle,
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
  Legend,
  PieChart,
  Pie,
} from "recharts";

// ============================================================
// TYPES
// ============================================================

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isFarmer: boolean;
    organizationId: string | null;
  };
  stats: {
    totalUsers: number;
    totalFarmers: number;
    totalFarms: number;
    totalFields: number;
    totalCropCycles: number;
    totalHarvests: number;
    totalInputRequests: number;
    totalInputOrders: number;
    totalFarmGroups: number;
    totalDevices: number;
    walletBalance: number;
    walletAvailable: number;
    totalHarvestQuantity: number;
  };
  farmersByStatus: Array<{ status: string; count: number }>;
  requestsByStatus: Array<{ status: string; count: number }>;
  requestsByMonth: Array<{ month: string; count: number }>;
  farmersByMonth: Array<{ month: string; count: number }>;
  topFarmers: Array<{
    farmerId: string;
    name: string;
    email: string;
    requestCount: number;
    totalAmount: number;
  }>;
}

type Range = "30" | "90" | "365" | "all";

// ============================================================
// COLORS
// ============================================================

const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#10B981",
  INACTIVE: "#94A3B8",
  SUSPENDED: "#EF4444",
  PENDING_VERIFICATION: "#F59E0B",
  PENDING: "#3B82F6",
  APPROVED: "#F59E0B",
  FUNDED: "#10B981",
  REJECTED: "#EF4444",
  ORDERED: "#8B5CF6",
  DELIVERED: "#059669",
  CANCELLED: "#6B7280",
  DRAFT: "#94A3B8",
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: "primary" | "success" | "warning" | "info" | "danger";
  hint?: string;
  href?: string;
}) => {
  const styles = {
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    info: "bg-sky-50 text-sky-600 border-sky-100",
    danger: "bg-red-50 text-red-600 border-red-100",
  } as const;

  const body = (
    <div
      className={`rounded-xl border p-4 ${styles[color]} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-full bg-white/60 p-2">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
};

// ============================================================
// MAIN
// ============================================================

export default function ReportsClient({
  user,
  stats,
  farmersByStatus,
  requestsByStatus,
  requestsByMonth,
  farmersByMonth,
  topFarmers,
}: Props) {
  const [range, setRange] = useState<Range>("90");
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pageTitle = user.isSuperAdmin
    ? "Platform Reports"
    : user.isAdmin
      ? "Organization Reports"
      : "My Reports";

  const pageSubtitle = user.isSuperAdmin
    ? "Platform-wide metrics across all organizations."
    : user.isAdmin
      ? "Analytics for your organization."
      : "Your farm analytics.";

  // ----------------------------------------------------------
  // Export
  // ----------------------------------------------------------
  const exportCSV = async (type: string) => {
    setExporting(type);
    setError("");
    try {
      const res = await fetch("/api/dashboard/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, range }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `navsa-${type}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(null);
    }
  };

  // ----------------------------------------------------------
  // Data shaping for charts
  // ----------------------------------------------------------
  const farmersByStatusChart = farmersByStatus.map((r) => ({
    status: r.status.replace("_", " "),
    count: r.count,
    color: STATUS_COLOR[r.status] ?? "#94A3B8",
  }));

  const requestsByStatusChart = requestsByStatus.map((r) => ({
    status: r.status.replace("_", " "),
    count: r.count,
    color: STATUS_COLOR[r.status] ?? "#94A3B8",
  }));

  const topFarmerChart = topFarmers.map((f) => ({
    name: f.name.length > 14 ? f.name.slice(0, 14) + "…" : f.name,
    count: f.requestCount,
    amount: f.totalAmount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
            <option value="all">All time</option>
          </select>

          <button
            onClick={() => exportCSV("full")}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {exporting === "full" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export report
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {(user.isSuperAdmin || user.isAdmin) && (
          <StatCard
            label="Total Farmers"
            value={stats.totalFarmers.toLocaleString()}
            icon={Users}
            color="success"
            href="/dashboard/farmers"
          />
        )}
        <StatCard
          label="Total Farms"
          value={stats.totalFarms.toLocaleString()}
          icon={Sprout}
          color="primary"
          href="/dashboard/farms"
        />
        <StatCard
          label="Fields"
          value={stats.totalFields.toLocaleString()}
          icon={Layers}
          color="info"
        />
        <StatCard
          label="Crop Cycles"
          value={stats.totalCropCycles.toLocaleString()}
          icon={Activity}
          color="warning"
        />
        <StatCard
          label="Harvests"
          value={stats.totalHarvests.toLocaleString()}
          icon={Sprout}
          color="success"
          hint={`${stats.totalHarvestQuantity.toLocaleString()} kg total`}
        />
        <StatCard
          label="Input Requests"
          value={stats.totalInputRequests.toLocaleString()}
          icon={Package}
          color="warning"
          href="/dashboard/input-requests"
        />
        <StatCard
          label="Input Orders"
          value={stats.totalInputOrders.toLocaleString()}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label="IoT Devices"
          value={stats.totalDevices.toLocaleString()}
          icon={Cpu}
          color="info"
        />

        {(user.isSuperAdmin || user.isAdmin) && (
          <StatCard
            label="Farm Groups"
            value={stats.totalFarmGroups.toLocaleString()}
            icon={Network}
            color="info"
            href="/dashboard/farm-groups"
          />
        )}

        {(user.isSuperAdmin || user.isAdmin) && (
          <StatCard
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="primary"
          />
        )}

        <StatCard
          label="Wallet Balance"
          value={`₦${stats.walletBalance.toLocaleString()}`}
          icon={Banknote}
          color="success"
          hint={`Available: ₦${stats.walletAvailable.toLocaleString()}`}
          href="/dashboard/wallet"
        />
        <StatCard
          label="Available"
          value={`₦${stats.walletAvailable.toLocaleString()}`}
          icon={TrendingUp}
          color="success"
          href="/dashboard/wallet"
        />
      </div>

      {/* Charts row 1: Monthly trends */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Input requests per month
              </h2>
              <p className="text-xs text-slate-500">Last 12 months</p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={requestsByMonth}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  tick={{ fontSize: 10 }}
                />
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
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                New farmers per month
              </h2>
              <p className="text-xs text-slate-500">Last 12 months</p>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={farmersByMonth}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  tick={{ fontSize: 10 }}
                />
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
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2: Status breakdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Farmers by status
          </h2>
          <p className="text-xs text-slate-500">
            Current distribution
          </p>
          <div className="mt-4 h-64">
            {farmersByStatusChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={farmersByStatusChart}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={(entry: any) =>
                      `${entry.status}: ${entry.count}`
                    }
                  >
                    {farmersByStatusChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      borderColor: "#374151",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Input requests by status
          </h2>
          <p className="text-xs text-slate-500">
            Current distribution
          </p>
          <div className="mt-4 h-64">
            {requestsByStatusChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestsByStatusChart}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={(entry: any) =>
                      `${entry.status}: ${entry.count}`
                    }
                  >
                    {requestsByStatusChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      borderColor: "#374151",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts row 3: Top farmers */}
      {(user.isSuperAdmin || user.isAdmin) && topFarmers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Top farmers by input requests
            </h2>
            <p className="text-xs text-slate-500">
              Highest activity in the selected period
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFarmerChart}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#6B7280" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      borderColor: "#374151",
                      color: "#F9FAFB",
                    }}
                    formatter={(v: any, n: any) =>
                      n === "amount"
                        ? [`₦${Number(v).toLocaleString()}`, "Amount"]
                        : [v, "Requests"]
                    }
                  />
                  <Bar
                    dataKey="count"
                    name="Requests"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  >
                    {topFarmerChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {topFarmers.map((f, i) => (
                <div
                  key={f.farmerId}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                >
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {f.name}
                    </div>
                    <div className="truncate text-[10px] text-slate-500">
                      {f.email}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {f.requestCount}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ₦{f.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick exports */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Quick exports
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Download targeted CSV reports. Data is scoped to your role.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExportTile
            label="Farmers report"
            description="All farmers with contact + profile"
            busy={exporting === "farmers"}
            onClick={() => exportCSV("farmers")}
          />
          <ExportTile
            label="Farms report"
            description="Farms, fields, cycles, crops"
            busy={exporting === "farms"}
            onClick={() => exportCSV("farms")}
          />
          <ExportTile
            label="Input requests"
            description="Requests with amounts + statuses"
            busy={exporting === "input-requests"}
            onClick={() => exportCSV("input-requests")}
          />
          <ExportTile
            label="Wallet ledger"
            description="All wallet transactions"
            busy={exporting === "wallets"}
            onClick={() => exportCSV("wallets")}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-slate-400">
      No data available
    </div>
  );
}

function ExportTile({
  label,
  description,
  busy,
  onClick,
}: {
  label: string;
  description: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-300 hover:bg-emerald-50/40 disabled:opacity-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </span>
      <div>
        <div className="text-sm font-medium text-slate-900 group-hover:text-emerald-700">
          {label}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
    </button>
  );
}