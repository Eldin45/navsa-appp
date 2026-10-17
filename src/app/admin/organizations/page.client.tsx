// src/app/admin/organizations/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Building2,
  Users,
  Package,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Send,
  Pencil,
  ShieldCheck,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type OrganizationType =
  | "COOPERATIVE"
  | "NGO"
  | "GOVERNMENT"
  | "AGGREGATOR"
  | "INPUT_SUPPLIER"
  | "FARM_MANAGEMENT";

interface Organization {
  id: string;
  name: string;
  legalName: string | null;
  slug: string;
  type: OrganizationType;
  country: string;
  region: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  verified: boolean;
  status: string;
  createdAt: string;
  counts: {
    users: number;
    farmers: number;
    suppliers: number;
    farmGroups: number;
  };
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
  };
  organizations: Organization[];
  stats: {
    totalOrganizations: number;
    totalFarmers: number;
    totalSuppliers: number;
    totalUsers: number;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const TYPE_LABEL: Record<OrganizationType, string> = {
  COOPERATIVE: "Cooperative",
  NGO: "NGO",
  GOVERNMENT: "Government",
  AGGREGATOR: "Aggregator",
  INPUT_SUPPLIER: "Input Supplier",
  FARM_MANAGEMENT: "Farm Management",
};

const TYPE_STYLE: Record<OrganizationType, string> = {
  COOPERATIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  NGO: "bg-sky-50 text-sky-700 border-sky-100",
  GOVERNMENT: "bg-indigo-50 text-indigo-700 border-indigo-100",
  AGGREGATOR: "bg-amber-50 text-amber-700 border-amber-100",
  INPUT_SUPPLIER: "bg-purple-50 text-purple-700 border-purple-100",
  FARM_MANAGEMENT: "bg-rose-50 text-rose-700 border-rose-100",
};

const TYPES: { value: OrganizationType; label: string }[] = [
  { value: "AGGREGATOR", label: "Aggregator" },
  { value: "COOPERATIVE", label: "Cooperative" },
  { value: "NGO", label: "NGO" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "INPUT_SUPPLIER", label: "Input Supplier" },
  { value: "FARM_MANAGEMENT", label: "Farm Management" },
];

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: "primary" | "success" | "warning" | "info";
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OrganizationsListClient({
  user,
  organizations,
  stats,
}: Props) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<OrganizationType | "ALL">("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState<
    "ALL" | "VERIFIED" | "UNVERIFIED"
  >("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Organization | null>(null);

  const filtered = useMemo(() => {
    return organizations.filter((o) => {
      if (typeFilter !== "ALL" && o.type !== typeFilter) return false;
      if (verifiedFilter === "VERIFIED" && !o.verified) return false;
      if (verifiedFilter === "UNVERIFIED" && o.verified) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        (o.legalName ?? "").toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q) ||
        (o.email ?? "").toLowerCase().includes(q) ||
        (o.city ?? "").toLowerCase().includes(q) ||
        (o.region ?? "").toLowerCase().includes(q)
      );
    });
  }, [organizations, query, typeFilter, verifiedFilter]);

  const downloadCSV = () => {
    const header = [
      "Name",
      "Slug",
      "Type",
      "Country",
      "Region",
      "City",
      "Email",
      "Phone",
      "Verified",
      "Farmers",
      "Suppliers",
      "Users",
      "Farm Groups",
      "Created At",
    ].join(",");
    const rows = filtered.map((o) =>
      [
        o.name,
        o.slug,
        o.type,
        o.country,
        o.region ?? "",
        o.city ?? "",
        o.email ?? "",
        o.phone ?? "",
        o.verified ? "yes" : "no",
        o.counts.farmers,
        o.counts.suppliers,
        o.counts.users,
        o.counts.farmGroups,
        o.createdAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organizations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user.isSuperAdmin ? "Organizations" : "My Organization"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.isSuperAdmin
              ? "All organizations registered on the platform."
              : "Details of your organization."}
          </p>
        </div>

        {user.isSuperAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Organization
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Organizations"
          value={stats.totalOrganizations}
          icon={Building2}
          color="primary"
        />
        <StatCard
          label="Farmers"
          value={stats.totalFarmers}
          icon={Users}
          color="success"
        />
        <StatCard
          label="Suppliers"
          value={stats.totalSuppliers}
          icon={Package}
          color="warning"
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="info"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug, email, region…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All types</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>

          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Farmers</th>
                <th className="px-4 py-3 text-right">Suppliers</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">
                      No organizations found
                    </p>
                    <p className="mt-1 text-xs">
                      Try adjusting the search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/organizations/${o.id}`}
                        className="group flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                          {o.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {o.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {o.slug}
                          </span>
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          TYPE_STYLE[o.type]
                        }`}
                      >
                        {TYPE_LABEL[o.type]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {[o.city, o.region, o.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        {o.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {o.email}
                          </span>
                        )}
                        {o.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {o.phone}
                          </span>
                        )}
                        {!o.email && !o.phone && <span>—</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {o.counts.farmers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {o.counts.suppliers.toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      {o.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.isSuperAdmin && (
                          <button
                            onClick={() => setEditTarget(o)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        <Link
                          href={`/admin/organizations/${o.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          View
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-900">{filtered.length}</strong> of{" "}
              {organizations.length} organizations
            </span>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <NewOrganizationModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditOrganizationModal
          organization={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// CREATE MODAL
// ============================================================

function NewOrganizationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    type: "AGGREGATOR" as OrganizationType,
    country: "NIGERIA",
    region: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    // Representative (required)
    representative_full_name: "",
    representative_email: "",
    representative_phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{
    name: string;
    repEmail: string;
    repPhone: string;
    orgEmail: string | null;
  } | null>(null);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!/^\d+$/.test(form.representative_phone.trim())) {
      setError("Representative phone must contain only digits.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          legal_name: form.legal_name || undefined,
          type: form.type,
          country: form.country,
          region: form.region || undefined,
          city: form.city || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          website: form.website || undefined,
          representative_full_name: form.representative_full_name,
          representative_email: form.representative_email,
          representative_phone: form.representative_phone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create organization");
      }

      setDone({
        name: data.data.name ?? form.name,
        repEmail: form.representative_email,
        repPhone: form.representative_phone,
        orgEmail: form.email || null,
      });

      setTimeout(onSuccess, 2200);
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {done ? "Organization created" : "New Organization"}
              </h2>
              <p className="text-xs text-slate-500">
                {done
                  ? "The organization has been created successfully."
                  : "Create a new organization and register its representative."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="px-6 py-6">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900">
                    <strong>{done.name}</strong> has been created.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Credentials have been emailed to{" "}
                    <strong>{done.repEmail}</strong>.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Default password:{" "}
                    <strong className="font-mono">{done.repPhone}</strong>{" "}
                    (their phone number). They will be prompted to change it on
                    first sign-in.
                  </p>
                  {done.orgEmail && (
                    <p className="mt-1 text-xs text-emerald-700">
                      A confirmation email was also sent to{" "}
                      <strong>{done.orgEmail}</strong>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="max-h-[75vh] overflow-y-auto px-6 py-5"
          >
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Organization details */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Organization details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Name *"
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  required
                />
                <Field
                  label="Legal Name"
                  value={form.legal_name}
                  onChange={(v) => update("legal_name", v)}
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(v) => update("country", v)}
                />
                <Field
                  label="Region / State"
                  value={form.region}
                  onChange={(v) => update("region", v)}
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                />
                <Field
                  label="Website"
                  value={form.website}
                  onChange={(v) => update("website", v)}
                  placeholder="https://"
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Representative */}
            <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Organization representative
              </h3>
              <p className="mt-1 mb-3 text-xs text-slate-500">
                The representative is the first admin for this organization
                and manages its members from the dashboard. Their{" "}
                <strong>phone number becomes their default password</strong>.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="Full Name *"
                  value={form.representative_full_name}
                  onChange={(v) => update("representative_full_name", v)}
                  required
                />
                <Field
                  label="Email *"
                  type="email"
                  value={form.representative_email}
                  onChange={(v) => update("representative_email", v)}
                  required
                />
                <Field
                  label="Phone *"
                  value={form.representative_phone}
                  onChange={(v) => update("representative_phone", v)}
                  placeholder="08012345678"
                  required
                />
              </div>
              {form.representative_email && (
                <p className="mt-3 flex items-center gap-1 text-[11px] text-emerald-700">
                  <Mail className="h-3 w-3" />
                  Credentials will be emailed to{" "}
                  <strong>{form.representative_email}</strong>.
                </p>
              )}
            </div>

            {/* Footer */}
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
                    Create Organization
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
// EDIT MODAL
// ============================================================

function EditOrganizationModal({
  organization,
  onClose,
  onSuccess,
}: {
  organization: Organization;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: organization.name,
    legal_name: organization.legalName ?? "",
    type: organization.type,
    country: organization.country,
    region: organization.region ?? "",
    city: organization.city ?? "",
    phone: organization.phone ?? "",
    email: organization.email ?? "",
    website: organization.website ?? "",
    address: "",
  });
  const [verified, setVerified] = useState(organization.verified);
  const [loading, setLoading] = useState<"save" | "verify" | null>(null);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("save");
    setError("");
    try {
      const res = await fetch(
        `/api/admin/organizations/${organization.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            legal_name: form.legal_name || undefined,
            type: form.type,
            country: form.country,
            region: form.region || undefined,
            city: form.city || undefined,
            phone: form.phone || undefined,
            email: form.email || undefined,
            website: form.website || undefined,
            address: form.address || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const toggleVerify = async () => {
    setLoading("verify");
    setError("");
    try {
      const res = await fetch(
        `/api/admin/organizations/${organization.id}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified: !verified }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update verification");
      setVerified(!verified);
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Pencil className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Edit Organization
              </h2>
              <p className="text-xs text-slate-500">
                Update details for <strong>{organization.name}</strong>
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

        <form
          onSubmit={save}
          className="max-h-[75vh] overflow-y-auto px-6 py-5"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Name *"
              value={form.name}
              onChange={(v) => update("name", v)}
              required
            />
            <Field
              label="Legal Name"
              value={form.legal_name}
              onChange={(v) => update("legal_name", v)}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Country"
              value={form.country}
              onChange={(v) => update("country", v)}
            />
            <Field
              label="Region / State"
              value={form.region}
              onChange={(v) => update("region", v)}
            />
            <Field
              label="City"
              value={form.city}
              onChange={(v) => update("city", v)}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => update("phone", v)}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Field
              label="Website"
              value={form.website}
              onChange={(v) => update("website", v)}
              placeholder="https://"
              className="sm:col-span-2"
            />
          </div>

          {/* Verification */}
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Verification
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {verified
                    ? "This organization is marked as verified."
                    : "This organization is not yet verified."}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleVerify}
                disabled={loading !== null}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  verified
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                } disabled:opacity-50`}
              >
                {loading === "verify" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                {verified ? "Unverify" : "Verify"}
              </button>
            </div>
          </div>

          {/* Footer */}
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
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading === "save" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SHARED FIELD
// ============================================================

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