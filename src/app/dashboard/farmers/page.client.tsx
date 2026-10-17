// src/app/dashboard/farmers/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  Plus,
  Mail,
  Phone,
  Wallet,
  Building2,
  X,
  Loader2,
  AlertCircle,
  Send,
  Calendar,
  Download,
  CheckCircle2,
  Ban,
  Sprout,
  KeyRound,
  Upload,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  mustChangePassword: boolean;
  organizationId: string | null;
  organization: { id: string; name: string } | null;
  profile: {
    farmerCode: string | null;
    primaryCrops: string | null;
    yearsFarming: number | null;
    totalLandHa: number | null;
  } | null;
  wallets: Array<{
    id: string;
    type: string;
    accountNumber: string;
    balance: number;
    availableBalance: number;
    palmPayAccountNumber: string | null;
    palmPayBankName: string | null;
    palmPayStatus: string | null;
  }>;
  farmCount: number;
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    organizationId: string | null;
  };
  farmers: Farmer[];
  stats: {
    total: number;
    active: number;
    withPalmPayVA: number;
    totalFarms: number;
  };
}

// ============================================================
// STAT CARD
// ============================================================

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: "primary" | "success" | "warning" | "info";
  icon: any;
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
    </div>
  );
};
// ============================================================
// MAIN
// ============================================================

export default function FarmersClient({ user, farmers, stats }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "SUSPENDED" | "INACTIVE"
  >("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return farmers.filter((f) => {
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.phone ?? "").includes(q) ||
        (f.profile?.farmerCode ?? "").toLowerCase().includes(q)
      );
    });
  }, [farmers, query, statusFilter]);

  const selectedFarmer = selectedFarmerId
    ? farmers.find((f) => f.id === selectedFarmerId) ?? null
    : null;

  const downloadCSV = () => {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Farmer Code",
      "Farms",
      "Status",
      "Created",
    ].join(",");
    const rows = filtered.map((f) =>
      [
        f.name,
        f.email,
        f.phone ?? "",
        f.profile?.farmerCode ?? "",
        f.farmCount,
        f.status,
        f.createdAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farmers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farmers</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.isSuperAdmin
              ? "All farmers registered on the platform."
              : "Farmers registered under your organization."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/farmers/import"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Link>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Farmer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Farmers" value={stats.total} color="primary" icon={Users} />
        <StatCard label="Active" value={stats.active} color="success" icon={CheckCircle2} />
        <StatCard
          label="With PalmPay VA"
          value={stats.withPalmPayVA}
          color="info"
          icon={Wallet}
        />
        <StatCard label="Total Farms" value={stats.totalFarms} color="warning" icon={Sprout} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, farmer code…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button
          onClick={downloadCSV}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Farmer</th>
                {user.isSuperAdmin && <th className="px-4 py-3">Organization</th>}
                <th className="px-4 py-3">Farmer Code</th>
                <th className="px-4 py-3 text-right">Farms</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={user.isSuperAdmin ? 7 : 6}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No farmers found</p>
                    <p className="mt-1 text-xs">
                      Click &quot;Add Farmer&quot; or use Bulk Import to
                      register one.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const closed = f.wallets.find(
                    (w) => w.type === "FARMER_CLOSED"
                  );
                  return (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedFarmerId(f.id)}
                          className="group flex items-center gap-3 text-left"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white">
                            {f.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                              {f.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {f.email}
                            </span>
                          </span>
                          {f.mustChangePassword && (
                            <span
                              title="Must change password"
                              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                            >
                              <KeyRound className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      </td>

                      {user.isSuperAdmin && (
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {f.organization ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {f.organization.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>
                      )}

                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {f.profile?.farmerCode ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {f.farmCount}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {closed ? (
                          <div>
                            <div className="font-mono text-slate-700">
                              {closed.palmPayAccountNumber ??
                                closed.accountNumber}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ₦{closed.balance.toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : f.status === "SUSPENDED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {f.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedFarmerId(f.id)}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-900">{filtered.length}</strong> of{" "}
              {farmers.length} farmers
            </span>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <CreateFarmerModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Detail modal */}
      {selectedFarmer && (
        <FarmerDetailModal
          farmer={selectedFarmer}
          onClose={() => setSelectedFarmerId(null)}
          onChanged={() => {
            setSelectedFarmerId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// CREATE FARMER MODAL
// ============================================================

function CreateFarmerModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    farmer_code: "",
    primary_crops: "",
    years_farming: "",
    total_land_ha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ email: string; phone: string } | null>(
    null
  );

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!/^\d+$/.test(form.phone.trim())) {
      setError("Phone must contain only digits.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          farmer_code: form.farmer_code || undefined,
          primary_crops: form.primary_crops || undefined,
          years_farming: form.years_farming
            ? Number(form.years_farming)
            : undefined,
          total_land_ha: form.total_land_ha
            ? Number(form.total_land_ha)
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create farmer");
      }
      setDone({
        email: data.data.email ?? form.email,
        phone: data.data.phone ?? form.phone,
      });
      setTimeout(onSuccess, 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {done ? "Farmer created" : "Add Farmer"}
              </h2>
              <p className="text-xs text-slate-500">
                {done
                  ? "The farmer can now sign in."
                  : "The phone number becomes the farmer's default password."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-6">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    Farmer created
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Credentials have been emailed to{" "}
                    <strong>{done.email}</strong>.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Default password:{" "}
                    <strong className="font-mono">{done.phone}</strong> (their
                    phone number). They will be prompted to change it on first
                    sign-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="max-h-[70vh] overflow-y-auto px-6 py-5"
          >
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Full Name *"
                value={form.full_name}
                onChange={(v) => update("full_name", v)}
                required
              />
              <Field
                label="Email *"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
                required
              />
              <Field
                label="Phone *"
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder="08012345678"
                required
              />
              <Field
                label="Farmer Code"
                value={form.farmer_code}
                onChange={(v) => update("farmer_code", v)}
                placeholder="Optional"
              />
              <Field
                label="Years Farming"
                type="number"
                value={form.years_farming}
                onChange={(v) => update("years_farming", v)}
                placeholder="Optional"
              />
              <Field
                label="Total Land (ha)"
                type="number"
                value={form.total_land_ha}
                onChange={(v) => update("total_land_ha", v)}
                placeholder="Optional"
              />
              <Field
                label="Primary Crops"
                value={form.primary_crops}
                onChange={(v) => update("primary_crops", v)}
                className="sm:col-span-2"
                placeholder="e.g. Maize, Rice, Cassava"
              />
            </div>

            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <strong>Note:</strong> The phone number above will be used as the
              farmer&apos;s default password. They must change it on first
              sign-in.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Create Farmer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FARMER DETAIL MODAL
// ============================================================

function FarmerDetailModal({
  farmer,
  onClose,
  onChanged,
}: {
  farmer: Farmer;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState<
    "suspend" | "activate" | "resend" | null
  >(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const doStatusChange = async (status: "ACTIVE" | "SUSPENDED") => {
    setLoading(status === "ACTIVE" ? "activate" : "suspend");
    setError("");
    setInfo("");
    try {
      const res = await fetch(
        `/api/dashboard/farmers/${farmer.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const doResend = async () => {
    setLoading("resend");
    setError("");
    setInfo("");
    try {
      const res = await fetch(
        `/api/dashboard/farmers/${farmer.id}/resend-credentials`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setInfo(`Credentials resent to ${data.data.email}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-semibold text-white">
              {farmer.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {farmer.name}
              </h2>
              <p className="text-xs text-slate-500">{farmer.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {info && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {info}
            </div>
          )}

          <DetailRow icon={Mail} label="Email" value={farmer.email} />
          {farmer.phone && (
            <DetailRow icon={Phone} label="Phone" value={farmer.phone} />
          )}
          {farmer.profile?.farmerCode && (
            <DetailRow
              icon={Sprout}
              label="Farmer Code"
              value={farmer.profile.farmerCode}
            />
          )}
          {farmer.profile?.primaryCrops && (
            <DetailRow
              icon={Sprout}
              label="Primary Crops"
              value={farmer.profile.primaryCrops}
            />
          )}
          {farmer.profile?.yearsFarming != null && (
            <DetailRow
              icon={Sprout}
              label="Years Farming"
              value={String(farmer.profile.yearsFarming)}
            />
          )}
          {farmer.profile?.totalLandHa != null && (
            <DetailRow
              icon={Sprout}
              label="Total Land (ha)"
              value={String(farmer.profile.totalLandHa)}
            />
          )}
          <DetailRow
            icon={Sprout}
            label="Farms"
            value={String(farmer.farmCount)}
          />
          <DetailRow
            icon={CheckCircle2}
            label="Status"
            value={farmer.status}
          />
          {farmer.mustChangePassword && (
            <DetailRow
              icon={KeyRound}
              label="Password"
              value="Must change on next sign-in"
            />
          )}
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(farmer.createdAt).toLocaleString()}
          />
          {farmer.lastLogin && (
            <DetailRow
              icon={Calendar}
              label="Last login"
              value={new Date(farmer.lastLogin).toLocaleString()}
            />
          )}
          {farmer.organization && (
            <DetailRow
              icon={Building2}
              label="Organization"
              value={farmer.organization.name}
            />
          )}

          {farmer.wallets.map((w) => (
            <div
              key={w.id}
              className="rounded-lg border border-slate-100 bg-white p-3"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {w.type.replace("_", " ")} Wallet
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-xs">{w.accountNumber}</span>
                </div>
                {w.palmPayAccountNumber && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono text-xs">
                      PalmPay: {w.palmPayAccountNumber}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        w.palmPayStatus === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {w.palmPayStatus}
                    </span>
                  </div>
                )}
                <div className="text-xs text-slate-600">
                  Balance: <strong>₦{w.balance.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {farmer.status === "ACTIVE" ? (
                <button
                  onClick={() => doStatusChange("SUSPENDED")}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {loading === "suspend" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Ban className="h-3 w-3" />
                  )}
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => doStatusChange("ACTIVE")}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {loading === "activate" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Activate
                </button>
              )}
              <button
                onClick={doResend}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loading === "resend" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Resend Credentials
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-sm text-slate-900 break-words">{value}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}