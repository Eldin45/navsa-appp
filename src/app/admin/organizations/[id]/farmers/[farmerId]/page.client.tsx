"use client";

import { useEffect, useState } from "react";
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
  Mail,
  Phone,
  Calendar,
  Loader2,
  AlertCircle,
  Smartphone,
  Building2,
  Wallet,
  ChevronRight,
} from "lucide-react";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
  };
  organizationId: string;
  farmerId: string;
}

interface FarmerDetailData {
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    status: string;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
    organization: { id: string; name: string; slug: string } | null;
    profile: {
      farmerCode: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      idType: string | null;
      idNumber: string | null;
      primaryCrops: string | null;
      yearsFarming: number | null;
      totalLandHa: number | null;
      hasSmartphone: boolean;
      primaryLanguage: string | null;
      bankVerified: boolean;
    } | null;
    wallets: Array<{
      id: string;
      type: string;
      accountNumber: string;
      balance: number;
      availableBalance: number;
      status: string;
      palmPayAccountNumber: string | null;
      palmPayBankName: string | null;
      palmPayStatus: string | null;
    }>;
  };
  summary: {
    totalFarms: number;
    totalFields: number;
    totalCropCycles: number;
    totalHarvests: number;
    totalInputRequests: number;
    totalInputOrders: number;
    totalDevices: number;
    totalHarvestQuantity: number;
    walletBalance: number;
    walletAvailable: number;
  };
}

interface FarmRow {
  id: string;
  name: string;
  farmType: string;
  totalAreaHa: number;
  cultivableHa: number | null;
  currentCrop: string | null;
  cropVariety: string | null;
  irrigationType: string | null;
  status: string;
  createdAt: string;
  group: { id: string; name: string } | null;
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

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-50 text-red-700",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700",
};

export default function FarmerDetailClient({
  organizationId,
  farmerId,
}: Props) {
  const [data, setData] = useState<FarmerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/admin/organizations/${organizationId}/farmers/${farmerId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error ?? "Failed to load farmer");
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
  }, [organizationId, farmerId]);

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
        <span className="flex-1">{error || "Farmer not found"}</span>
        <Link
          href={`/admin/organizations/${organizationId}`}
          className="rounded bg-red-600 px-3 py-1 text-xs text-white"
        >
          Back
        </Link>
      </div>
    );
  }

  const { farmer, summary } = data;
  const profile = farmer.profile;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/organizations/${organizationId}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to {farmer.organization?.name ?? "organization"}
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700">
          {farmer.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={farmer.image}
              alt={farmer.name}
              className="h-full w-full object-cover"
            />
          ) : (
            farmer.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {farmer.name}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLE[farmer.status] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {farmer.status.replace(/_/g, " ")}
            </span>
            {profile?.farmerCode && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {profile.farmerCode}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {farmer.email}
            </span>
            {farmer.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {farmer.phone}
              </span>
            )}
            {farmer.organization && (
              <Link
                href={`/admin/organizations/${farmer.organization.id}`}
                className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
              >
                <Building2 className="h-3 w-3" /> {farmer.organization.name}
              </Link>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined{" "}
              {new Date(farmer.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Farms" value={summary.totalFarms} icon={Sprout} color="primary" />
        <Kpi label="Fields" value={summary.totalFields} icon={Layers} color="info" />
        <Kpi label="Crop Cycles" value={summary.totalCropCycles} icon={Activity} color="warning" />
        <Kpi
          label="Harvests"
          value={summary.totalHarvests}
          hint={`${summary.totalHarvestQuantity.toLocaleString()} kg`}
          icon={Sprout}
          color="success"
        />
        <Kpi label="IoT Devices" value={summary.totalDevices} icon={Cpu} color="info" />
        <Kpi label="Input Requests" value={summary.totalInputRequests} icon={Package} color="warning" />
        <Kpi label="Input Orders" value={summary.totalInputOrders} icon={ShoppingCart} color="primary" />
        <Kpi
          label="Wallet Balance"
          value={`₦${summary.walletBalance.toLocaleString()}`}
          hint={`Available: ₦${summary.walletAvailable.toLocaleString()}`}
          icon={Banknote}
          color="success"
        />
        <Kpi label="Wallets" value={farmer.wallets.length} icon={Wallet} color="primary" />
        <Kpi
          label="Smartphone"
          value={profile?.hasSmartphone ? "Yes" : "No"}
          icon={Smartphone}
          color={profile?.hasSmartphone ? "success" : "info"}
        />
      </div>

      {/* Profile cards */}
      {profile && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Profile">
            <Row label="Gender" value={profile.gender ?? "—"} />
            <Row
              label="Date of Birth"
              value={
                profile.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString()
                  : "—"
              }
            />
            <Row label="Primary Crops" value={profile.primaryCrops ?? "—"} />
            <Row
              label="Years Farming"
              value={profile.yearsFarming?.toString() ?? "—"}
            />
            <Row
              label="Total Land"
              value={profile.totalLandHa ? `${profile.totalLandHa} ha` : "—"}
            />
            <Row
              label="Primary Language"
              value={profile.primaryLanguage ?? "—"}
            />
          </Card>

          <Card title="Identity & Banking">
            <Row label="ID Type" value={profile.idType ?? "—"} />
            <Row label="ID Number" value={profile.idNumber ?? "—"} />
            <Row
              label="Bank Verified"
              value={profile.bankVerified ? "Yes" : "No"}
            />
            {farmer.wallets.map((w) => (
              <Row
                key={w.id}
                label={`${w.type} Wallet`}
                value={`${w.accountNumber} · ₦${w.balance.toLocaleString()}`}
              />
            ))}
          </Card>
        </div>
      )}

      {/* Farms tab */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Farms owned by this farmer
          </h2>
          <p className="text-xs text-slate-500">
            Click a farm to see its fields, crop cycles, devices and harvests.
          </p>
        </div>
        <div className="p-4">
          <FarmerFarmsTab
            organizationId={organizationId}
            farmerId={farmerId}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- shared ----------

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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

function FarmerFarmsTab({
  organizationId,
  farmerId,
}: {
  organizationId: string;
  farmerId: string;
}) {
  const [data, setData] = useState<Paginated<FarmRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(
      `/api/admin/organizations/${organizationId}/farmers/${farmerId}/farms?page=${page}&pageSize=20`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error ?? "Failed to load");
        if (!cancelled) setData(json.data);
      })
      .catch((err) => !cancelled && setError(err?.message ?? "Failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [organizationId, farmerId, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }
  if (!data || data.items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        This farmer has no farms yet.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Farm</th>
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
                <td className="px-3 py-2 text-xs text-slate-600">{f.farmType}</td>
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
      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPage={setPage} />
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