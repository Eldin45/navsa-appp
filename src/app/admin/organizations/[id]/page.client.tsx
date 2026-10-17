"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Sprout,
  Layers,
  Activity,
  Package,
  ShoppingCart,
  Banknote,
  Cpu,
  Network,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Truck,
  ShieldCheck,
  Hash,
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
    isSuperAdmin: boolean;
  };
  organizationId: string;
}

interface OrgDetail {
  organization: {
    id: string;
    name: string;
    legalName: string | null;
    slug: string;
    type: string;
    country: string;
    region: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
    verified: boolean;
    verifiedAt: string | null;
    status: string;
    createdAt: string;
    counts: {
      users: number;
      farmers: number;
      suppliers: number;
      farmGroups: number;
    };
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    wallet: {
      id: string;
      type: string;
      accountNumber: string;
      balance: number;
      palmPayAccountNumber: string | null;
      palmPayBankName: string | null;
      palmPayStatus: string | null;
    } | null;
  }>;
  walletTotals: { balance: number; available: number };
}

interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface FarmerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  farmerCode: string | null;
  primaryCrops: string | null;
  totalLandHa: number | null;
  farmsCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface FarmRow {
  id: string;
  name: string;
  farmType: string;
  totalAreaHa: number;
  cultivableHa: number | null;
  currentCrop: string | null;
  status: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  group: { id: string; name: string } | null;
  fieldsCount: number;
  devicesCount: number;
}

interface FarmGroupRow {
  id: string;
  name: string;
  description: string | null;
  groupType: string;
  region: string | null;
  localGovernment: string | null;
  village: string | null;
  totalAreaHa: number | null;
  memberCount: number;
  status: string;
  createdAt: string;
  farmsCount: number;
  membersCount: number;
}

interface SupplierRow {
  id: string;
  supplierCode: string | null;
  businessName: string;
  businessType: string | null;
  productCategories: string | null;
  deliveryRegions: string | null;
  verified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
  };
  inventoryCount: number;
  ordersCount: number;
}

type TabKey = "farmers" | "farms" | "farm-groups" | "suppliers";

// ============================================================
// CONSTANTS
// ============================================================

const TYPE_LABEL: Record<string, string> = {
  COOPERATIVE: "Cooperative",
  NGO: "NGO",
  GOVERNMENT: "Government",
  AGGREGATOR: "Aggregator",
  INPUT_SUPPLIER: "Input Supplier",
  FARM_MANAGEMENT: "Farm Management",
};

const TYPE_STYLE: Record<string, string> = {
  COOPERATIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  NGO: "bg-sky-50 text-sky-700 border-sky-100",
  GOVERNMENT: "bg-indigo-50 text-indigo-700 border-indigo-100",
  AGGREGATOR: "bg-amber-50 text-amber-700 border-amber-100",
  INPUT_SUPPLIER: "bg-purple-50 text-purple-700 border-purple-100",
  FARM_MANAGEMENT: "bg-rose-50 text-rose-700 border-rose-100",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-50 text-red-700",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700",
};

// ============================================================
// MAIN
// ============================================================

export default function OrganizationDetailClient({
  user,
  organizationId,
}: Props) {
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("farmers");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/admin/organizations/${organizationId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load organization");
        }
        if (!cancelled) setDetail(json.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Loading organization…</p>
        </div>
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="m-6 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        <span className="flex-1">{error || "Organization not found"}</span>
        <Link
          href="/admin/organizations"
          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
        >
          Back
        </Link>
      </div>
    );
  }

  const { organization: org, walletTotals } = detail;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to organizations
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-700">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-full w-full object-cover"
              />
            ) : (
              org.name.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {org.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  TYPE_STYLE[org.type] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {TYPE_LABEL[org.type] ?? org.type}
              </span>
              {org.verified ? (
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
            </div>
            {org.legalName && (
              <p className="mt-0.5 text-sm text-slate-500">
                {org.legalName}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {org.slug}
              </span>
              {(org.city || org.region || org.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[org.city, org.region, org.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined{" "}
                {new Date(org.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 text-xs">
          {org.email && (
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Mail className="h-3 w-3 text-slate-400" />
              {org.email}
            </span>
          )}
          {org.phone && (
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Phone className="h-3 w-3 text-slate-400" />
              {org.phone}
            </span>
          )}
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 hover:underline"
            >
              <Globe className="h-3 w-3" />
              {org.website}
            </a>
          )}
          {!org.email && !org.phone && !org.website && (
            <span className="text-slate-400">No contact info</span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Kpi
          label="Farmers"
          value={org.counts.farmers.toLocaleString()}
          icon={Users}
          color="success"
        />
        <Kpi
          label="Farm Groups"
          value={org.counts.farmGroups.toLocaleString()}
          icon={Network}
          color="info"
        />
        <Kpi
          label="Suppliers"
          value={org.counts.suppliers.toLocaleString()}
          icon={Truck}
          color="warning"
        />
        <Kpi
          label="Total Users"
          value={org.counts.users.toLocaleString()}
          icon={Users}
          color="primary"
        />
        <Kpi
          label="Wallet Balance"
          value={`₦${walletTotals.balance.toLocaleString()}`}
          icon={Banknote}
          color="success"
          hint={`Available: ₦${walletTotals.available.toLocaleString()}`}
        />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2">
          <TabButton
            active={tab === "farmers"}
            onClick={() => setTab("farmers")}
            icon={Users}
            label="Farmers"
          />
          <TabButton
            active={tab === "farms"}
            onClick={() => setTab("farms")}
            icon={Sprout}
            label="Farms"
          />
          <TabButton
            active={tab === "farm-groups"}
            onClick={() => setTab("farm-groups")}
            icon={Network}
            label="Farm Groups"
          />
          <TabButton
            active={tab === "suppliers"}
            onClick={() => setTab("suppliers")}
            icon={Truck}
            label="Suppliers"
          />
        </div>

        <div className="p-4">
          {tab === "farmers" && (
            <FarmersTab organizationId={organizationId} />
          )}
          {tab === "farms" && <FarmsTab organizationId={organizationId} />}
          {tab === "farm-groups" && (
            <FarmGroupsTab organizationId={organizationId} />
          )}
          {tab === "suppliers" && (
            <SuppliersTab organizationId={organizationId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function Kpi({
  label,
  value,
  icon: Icon,
  color,
  hint,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: "primary" | "success" | "warning" | "info";
  hint?: string;
}) {
  const styles = {
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    info: "bg-sky-50 text-sky-600 border-sky-100",
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="rounded-full bg-white/60 p-1.5">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

// ============================================================
// TAB BUTTON
// ============================================================

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-emerald-500 text-emerald-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================
// SHARED: paginated fetch hook
// ============================================================

function usePagedResource<T>(url: string, query: string, page: number) {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    params.set("page", String(page));
    params.set("pageSize", "20");

    fetch(`${url}?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error ?? "Failed to load");
        if (!cancelled) setData(json.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, query, page]);

  return { data, loading, error };
}

// ============================================================
// SHARED: toolbar + pagination
// ============================================================

function Toolbar({
  query,
  onQuery,
  placeholder,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
        />
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
      <span>
        Page <strong className="text-slate-900">{page}</strong> of{" "}
        {totalPages} · {total.toLocaleString()} total
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" />
          Prev
        </button>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-10 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-sm text-slate-500">
      <Package className="mx-auto mb-2 h-7 w-7 text-slate-300" />
      {label}
    </div>
  );
}

// ============================================================
// FARMERS TAB
// ============================================================

function FarmersTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, loading, error } = usePagedResource<FarmerRow>(
    `/api/admin/organizations/${organizationId}/farmers`,
    debounced,
    page
  );

  return (
    <div>
      <Toolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search farmers by name, email, phone…"
      />

      {loading ? (
        <LoadingRow />
      ) : error ? (
        <ErrorRow message={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyRow label="No farmers in this organization yet." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Farmer</th>
                  <th className="px-3 py-2">Farmer Code</th>
                  <th className="px-3 py-2">Primary Crops</th>
                  <th className="px-3 py-2 text-right">Land (ha)</th>
                  <th className="px-3 py-2 text-right">Farms</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/farmers/${f.id}`}
                        className="group flex items-center gap-2"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                          {f.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {f.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {f.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {f.farmerCode ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {f.primaryCrops ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {f.totalLandHa ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {f.farmsCount}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={f.status} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/organizations/${organizationId}/farmers/${f.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        View
                        <ChevronRightIcon className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// FARMS TAB
// ============================================================

function FarmsTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, loading, error } = usePagedResource<FarmRow>(
    `/api/admin/organizations/${organizationId}/farms`,
    debounced,
    page
  );

  return (
    <div>
      <Toolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search farms by name, crop, owner…"
      />

      {loading ? (
        <LoadingRow />
      ) : error ? (
        <ErrorRow message={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyRow label="No farms in this organization yet." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Farm</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Current Crop</th>
                  <th className="px-3 py-2 text-right">Area (ha)</th>
                  <th className="px-3 py-2 text-right">Fields</th>
                  <th className="px-3 py-2 text-right">Devices</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/farms/${f.id}`}
                        className="group"
                      >
                        <span className="block font-medium text-slate-900 group-hover:text-emerald-700">
                          {f.name}
                        </span>
                        {f.group && (
                          <span className="block text-[11px] text-slate-500">
                            Group: {f.group.name}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/farmers/${f.owner.id}`}
                        className="text-xs text-slate-600 hover:text-emerald-700"
                      >
                        <span className="block font-medium text-slate-800">
                          {f.owner.name}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {f.owner.email}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {f.farmType}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {f.currentCrop ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {f.totalAreaHa}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {f.fieldsCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {f.devicesCount}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/organizations/${organizationId}/farms/${f.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        View
                        <ChevronRightIcon className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// FARM GROUPS TAB
// ============================================================

function FarmGroupsTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, loading, error } = usePagedResource<FarmGroupRow>(
    `/api/admin/organizations/${organizationId}/farm-groups`,
    debounced,
    page
  );

  return (
    <div>
      <Toolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search farm groups by name, region, village…"
      />

      {loading ? (
        <LoadingRow />
      ) : error ? (
        <ErrorRow message={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyRow label="No farm groups in this organization yet." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2 text-right">Members</th>
                  <th className="px-3 py-2 text-right">Farms</th>
                  <th className="px-3 py-2 text-right">Area (ha)</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/farm-groups/${g.id}`}
                        className="group"
                      >
                        <span className="block font-medium text-slate-900 group-hover:text-emerald-700">
                          {g.name}
                        </span>
                        {g.description && (
                          <span className="block truncate text-[11px] text-slate-500 max-w-xs">
                            {g.description}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {g.groupType}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {[g.village, g.localGovernment, g.region]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {g.membersCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {g.farmsCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {g.totalAreaHa ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/organizations/${organizationId}/farm-groups/${g.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        View
                        <ChevronRightIcon className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// SUPPLIERS TAB
// ============================================================

function SuppliersTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, loading, error } = usePagedResource<SupplierRow>(
    `/api/admin/organizations/${organizationId}/suppliers`,
    debounced,
    page
  );

  return (
    <div>
      <Toolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search suppliers by business, contact, email…"
      />

      {loading ? (
        <LoadingRow />
      ) : error ? (
        <ErrorRow message={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyRow label="No suppliers in this organization yet." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Business</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Items</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2">Verified</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/suppliers/${s.id}`}
                        className="group"
                      >
                        <span className="block font-medium text-slate-900 group-hover:text-emerald-700">
                          {s.businessName}
                        </span>
                        {s.supplierCode && (
                          <span className="block text-[11px] text-slate-500">
                            {s.supplierCode}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="block text-xs font-medium text-slate-800">
                        {s.user.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {s.user.email}
                      </span>
                      {s.user.phone && (
                        <span className="block text-[11px] text-slate-500">
                          {s.user.phone}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {s.businessType ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {s.inventoryCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {s.ordersCount}
                    </td>
                    <td className="px-3 py-2">
                      {s.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/organizations/${organizationId}/suppliers/${s.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        View
                        <ChevronRightIcon className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}