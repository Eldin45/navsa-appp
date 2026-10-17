// src/app/admin/farmers/page.client.tsx
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
  MapPin,
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
} from "lucide-react";

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  lastLogin: string | null;
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
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    info: "bg-sky-50 text-sky-600 border-sky-100",
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-full bg-white/60 p-2">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
};

export default function FarmersClient({ user, farmers, stats }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "INACTIVE">("ALL");
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
        (f.profile?.farmerCode ?? "").toLowerCase().includes(q) ||
        (f.organization?.name ?? "").toLowerCase().includes(q)
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
      "Organization",
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
        f.organization?.name ?? "",
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farmers</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.isSuperAdmin
              ? "All farmers registered on the platform."
              : "Farmers belonging to your organization."}
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Farmer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Farmers" value={stats.total} color="primary" icon={Users} />
        <StatCard label="Active" value={stats.active} color="success" icon={CheckCircle2} />
        <StatCard label="With PalmPay VA" value={stats.withPalmPayVA} color="info" icon={Wallet} />
        <StatCard label="Total Farms" value={stats.totalFarms} color="warning" icon={Sprout} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, code, organization…"
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
                <th className="px-4 py-3">Organization</th>
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
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No farmers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const closed = f.wallets.find((w) => w.type === "FARMER_CLOSED");
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
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {f.organization ? (
                          <Link
                            href={`/admin/organizations/${f.organization.id}`}
                            className="flex items-center gap-1 hover:text-emerald-700"
                          >
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {f.organization.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
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
                              {closed.palmPayAccountNumber ?? closed.accountNumber}
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
    email: "",
    full_name: "",
    phone: "",
    farmer_code: "",
    primary_crops: "",
    years_farming: "",
    total_land_ha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ userId: string; email: string } | null>(null);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
          farmer_code: form.farmer_code || undefined,
          primary_crops: form.primary_crops || undefined,
          years_farming: form.years_farming ? Number(form.years_farming) : undefined,
          total_land_ha: form.total_land_ha ? Number(form.total_land_ha) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create");
      setCreated({ userId: data.data.userId, email: data.data.email });
      setTimeout(onSuccess, 1500);
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
              <h2 className="text-lg font-bold text-slate-900">Add Farmer</h2>
              <p className="text-xs text-slate-500">
                A temporary password will be generated. The farmer can reset it on first login.
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

        {created ? (
          <div className="px-6 py-5">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    Farmer created
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {created.email} can now sign in with their temporary password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name *" value={form.full_name} onChange={(v) => update("full_name", v)} required />
              <Field label="Email *" type="email" value={form.email} onChange={(v) => update("email", v)} required />
              <Field label="Phone *" value={form.phone} onChange={(v) => update("phone", v)} required />
              <Field label="Farmer Code" value={form.farmer_code} onChange={(v) => update("farmer_code", v)} />
              <Field
                label="Years Farming"
                type="number"
                value={form.years_farming}
                onChange={(v) => update("years_farming", v)}
              />
              <Field
                label="Total Land (ha)"
                type="number"
                value={form.total_land_ha}
                onChange={(v) => update("total_land_ha", v)}
              />
              <Field
                label="Primary Crops"
                value={form.primary_crops}
                onChange={(v) => update("primary_crops", v)}
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
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
}: {
  farmer: Farmer;
  onClose: () => void;
}) {
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
              <h2 className="text-lg font-bold text-slate-900">{farmer.name}</h2>
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
          {farmer.phone && <DetailRow icon={Phone} label="Phone" value={farmer.phone} />}
          {farmer.organization && (
            <DetailRow icon={Building2} label="Organization" value={farmer.organization.name} />
          )}
          {farmer.profile?.farmerCode && (
            <DetailRow icon={Sprout} label="Farmer Code" value={farmer.profile.farmerCode} />
          )}
          {farmer.profile?.primaryCrops && (
            <DetailRow icon={Sprout} label="Primary Crops" value={farmer.profile.primaryCrops} />
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
          <DetailRow icon={Sprout} label="Farms" value={String(farmer.farmCount)} />

          {farmer.wallets.map((w) => (
            <div key={w.id} className="rounded-lg border border-slate-100 bg-white p-3">
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

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
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
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}