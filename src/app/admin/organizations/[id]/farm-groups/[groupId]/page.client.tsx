"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Network,
  Users,
  Sprout,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronRight,
  Layers,
  Cpu,
  User,
  ShieldCheck,
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
  groupId: string;
}

interface FarmGroupDetailData {
  group: {
    id: string;
    name: string;
    description: string | null;
    groupType: string;
    region: string | null;
    localGovernment: string | null;
    village: string | null;
    gpsBoundary: string | null;
    totalAreaHa: number | null;
    memberCount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    organization: { id: string; name: string; slug: string } | null;
  };
  summary: {
    totalMembers: number;
    activeMembers: number;
    totalFarms: number;
    totalAreaHa: number;
  };
}

interface MemberRow {
  id: string;
  role: string | null;
  membershipStatus: string;
  joinedDate: string;
  exitDate: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    farmsCount: number;
  };
}

interface GroupFarmRow {
  id: string;
  name: string;
  farmType: string;
  totalAreaHa: number;
  cultivableHa: number | null;
  currentCrop: string | null;
  cropVariety: string | null;
  status: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  fieldsCount: number;
  devicesCount: number;
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

type TabKey = "members" | "farms";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-50 text-red-700",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700",
};

// ============================================================
// MAIN
// ============================================================

export default function FarmGroupDetailClient({
  organizationId,
  groupId,
}: Props) {
  const [data, setData] = useState<FarmGroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("members");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/admin/organizations/${organizationId}/farm-groups/${groupId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error ?? "Failed to load farm group");
        if (!cancelled) setData(json.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, groupId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="m-6 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        <span className="flex-1">{error || "Farm group not found"}</span>
        <Link
          href={`/admin/organizations/${organizationId}`}
          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
        >
          Back
        </Link>
      </div>
    );
  }

  const { group, summary } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/admin/organizations/${organizationId}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to {group.organization?.name ?? "organization"}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Network className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {group.name}
              </h1>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {group.groupType}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLE[group.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {group.status.replace(/_/g, " ")}
              </span>
            </div>

            {group.description && (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {group.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {(group.village || group.localGovernment || group.region) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[group.village, group.localGovernment, group.region]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created{" "}
                {new Date(group.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {group.organization && (
                <Link
                  href={`/admin/organizations/${group.organization.id}`}
                  className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  {group.organization.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Total Members"
          value={summary.totalMembers}
          hint={`${summary.activeMembers} active`}
          icon={Users}
          color="success"
        />
        <Kpi
          label="Farms"
          value={summary.totalFarms}
          icon={Sprout}
          color="primary"
        />
        <Kpi
          label="Total Area"
          value={`${summary.totalAreaHa.toLocaleString()} ha`}
          icon={Layers}
          color="info"
        />
        <Kpi
          label="Declared Area"
          value={group.totalAreaHa ? `${group.totalAreaHa} ha` : "—"}
          icon={Layers}
          color="warning"
        />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2">
          <TabButton
            active={tab === "members"}
            onClick={() => setTab("members")}
            icon={Users}
            label="Members"
          />
          <TabButton
            active={tab === "farms"}
            onClick={() => setTab("farms")}
            icon={Sprout}
            label="Farms"
          />
        </div>

        <div className="p-4">
          {tab === "members" && (
            <MembersTab
              organizationId={organizationId}
              groupId={groupId}
            />
          )}
          {tab === "farms" && (
            <GroupFarmsTab
              organizationId={organizationId}
              groupId={groupId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED
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
    <div className={`rounded-xl border p-3 ${styles[color]}`}>
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
        Page <strong className="text-slate-900">{page}</strong> of {totalPages} ·{" "}
        {total.toLocaleString()} total
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function usePaged<T>(
  url: string,
  query: string,
  page: number
) {
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

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-3 flex-1">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-10 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4" />
      {msg}
    </div>
  );
}

function EmptyState({ label, icon: Icon }: { label: string; icon: any }) {
  return (
    <div className="py-12 text-center text-sm text-slate-500">
      <Icon className="mx-auto mb-2 h-7 w-7 text-slate-300" />
      {label}
    </div>
  );
}

// ============================================================
// MEMBERS TAB
// ============================================================

function MembersTab({
  organizationId,
  groupId,
}: {
  organizationId: string;
  groupId: string;
}) {
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

  const { data, loading, error } = usePaged<MemberRow>(
    `/api/admin/organizations/${organizationId}/farm-groups/${groupId}/members`,
    debounced,
    page
  );

  return (
    <div>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search members by name, email, phone…"
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState msg={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState label="No members in this group yet." icon={Users} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2 text-right">Farms</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/farmers/${m.user.id}`}
                        className="group flex items-center gap-2"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                          {m.user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {m.user.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {m.user.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {m.role ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {m.user.farmsCount}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {new Date(m.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={m.membershipStatus} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/organizations/${organizationId}/farmers/${m.user.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
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

function GroupFarmsTab({
  organizationId,
  groupId,
}: {
  organizationId: string;
  groupId: string;
}) {
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

  const { data, loading, error } = usePaged<GroupFarmRow>(
    `/api/admin/organizations/${organizationId}/farm-groups/${groupId}/farms`,
    debounced,
    page
  );

  return (
    <div>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search farms by name, crop, owner…"
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState msg={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          label="No farms in this group yet."
          icon={Sprout}
        />
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
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/organizations/${organizationId}/farmers/${f.owner.id}`}
                        className="group"
                      >
                        <span className="block text-xs font-medium text-slate-800 group-hover:text-emerald-700">
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
                      {f.cropVariety ? ` (${f.cropVariety})` : ""}
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
                        <ChevronRight className="h-3 w-3" />
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