"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sprout,
  Layers,
  Activity,
  Cpu,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Droplets,
  Thermometer,
  Cpu as CpuIcon,
  User,
  ChevronRight,
  Wheat,
  Package,
  Cloud,
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
  farmId: string;
}

interface FarmDetailData {
  farm: {
    id: string;
    name: string;
    farmType: string;
    latitude: number | null;
    longitude: number | null;
    gpsBoundary: string | null;
    totalAreaHa: number;
    cultivableHa: number | null;
    soilType: string | null;
    soilPh: number | null;
    irrigationType: string | null;
    irrigationSource: string | null;
    status: string;
    currentCrop: string | null;
    cropVariety: string | null;
    plantingDate: string | null;
    expectedHarvest: string | null;
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    group: { id: string; name: string } | null;
  };
  summary: {
    totalFields: number;
    totalCropCycles: number;
    totalHarvests: number;
    totalDevices: number;
    totalWeatherStations: number;
    activeCycles: number;
    totalHarvestQuantity: number;
  };
  cycleByStatus: Array<{ status: string; count: number }>;
  deviceByStatus: Array<{ status: string; count: number }>;
}

interface FieldRow {
  id: string;
  name: string | null;
  fieldNumber: string;
  areaHa: number;
  soilType: string | null;
  soilDepth: number | null;
  irrigationMethod: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  cropCyclesCount: number;
  devicesCount: number;
}

interface DeviceRow {
  id: string;
  deviceType: string;
  deviceModel: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  installedDate: string;
  status: string;
  batteryLevel: number | null;
  signalStrength: number | null;
  lastReadingAt: string | null;
  latitude: number | null;
  longitude: number | null;
  field: { id: string; name: string | null; fieldNumber: string } | null;
  readingsCount: number;
  alertsCount: number;
}

interface CycleRow {
  id: string;
  cycleNumber: number;
  cycleName: string | null;
  cropType: string;
  variety: string | null;
  plantingDate: string;
  expectedHarvest: string | null;
  actualHarvest: string | null;
  status: string;
  totalYieldKg: number | null;
  yieldPerHa: number | null;
  totalCost: number | null;
  revenue: number | null;
  profit: number | null;
  field: { id: string; name: string | null; fieldNumber: string };
  harvestsCount: number;
  activitiesCount: number;
}

interface HarvestRow {
  id: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  qualityGrade: string | null;
  moisturePct: number | null;
  status: string;
  verifiedAt: string | null;
  cycle: { id: string; cropType: string; cycleNumber: number };
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

type TabKey = "fields" | "devices" | "cycles" | "harvests";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  MAINTENANCE: "bg-amber-50 text-amber-700",
  OFFLINE: "bg-red-50 text-red-700",
  PLANNED: "bg-sky-50 text-sky-700",
  PLANTED: "bg-blue-50 text-blue-700",
  GROWING: "bg-emerald-50 text-emerald-700",
  HARVESTING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  FAILED: "bg-red-50 text-red-700",
  RECORDED: "bg-sky-50 text-sky-700",
};

export default function FarmDetailClient({
  organizationId,
  farmId,
}: Props) {
  const [data, setData] = useState<FarmDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("fields");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/admin/organizations/${organizationId}/farms/${farmId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error ?? "Failed to load farm");
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
  }, [organizationId, farmId]);

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
        <span className="flex-1">{error || "Farm not found"}</span>
        <Link
          href={`/admin/organizations/${organizationId}`}
          className="rounded bg-red-600 px-3 py-1 text-xs text-white"
        >
          Back
        </Link>
      </div>
    );
  }

  const { farm, summary } = data;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/organizations/${organizationId}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to organization
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sprout className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {farm.name}
              </h1>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {farm.farmType}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLE[farm.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {farm.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <Link
                href={`/admin/organizations/${organizationId}/farmers/${farm.owner.id}`}
                className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
              >
                <User className="h-3 w-3" />
                {farm.owner.name}
              </Link>
              {farm.group && (
                <span className="inline-flex items-center gap-1">
                  Group: {farm.group.name}
                </span>
              )}
              {farm.latitude != null && farm.longitude != null && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created{" "}
                {new Date(farm.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Kpi label="Fields" value={summary.totalFields} icon={Layers} color="info" />
        <Kpi label="Crop Cycles" value={summary.totalCropCycles} hint={`${summary.activeCycles} active`} icon={Activity} color="warning" />
        <Kpi label="Harvests" value={summary.totalHarvests} hint={`${summary.totalHarvestQuantity.toLocaleString()} kg`} icon={Wheat} color="success" />
        <Kpi label="IoT Devices" value={summary.totalDevices} icon={Cpu} color="primary" />
      </div>

      {/* Farm info cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Land & Soil">
          <Row label="Total Area" value={`${farm.totalAreaHa} ha`} />
          <Row
            label="Cultivable"
            value={farm.cultivableHa ? `${farm.cultivableHa} ha` : "—"}
          />
          <Row label="Soil Type" value={farm.soilType ?? "—"} />
          <Row label="Soil pH" value={farm.soilPh?.toString() ?? "—"} />
        </Card>
        <Card title="Irrigation">
          <Row label="Type" value={farm.irrigationType ?? "—"} />
          <Row label="Source" value={farm.irrigationSource ?? "—"} />
        </Card>
        <Card title="Current Crop">
          <Row label="Crop" value={farm.currentCrop ?? "—"} />
          <Row label="Variety" value={farm.cropVariety ?? "—"} />
          <Row
            label="Planted"
            value={
              farm.plantingDate
                ? new Date(farm.plantingDate).toLocaleDateString()
                : "—"
            }
          />
          <Row
            label="Expected Harvest"
            value={
              farm.expectedHarvest
                ? new Date(farm.expectedHarvest).toLocaleDateString()
                : "—"
            }
          />
        </Card>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2">
          <TabButton active={tab === "fields"} onClick={() => setTab("fields")} icon={Layers} label="Fields" />
          <TabButton active={tab === "devices"} onClick={() => setTab("devices")} icon={CpuIcon} label="Devices" />
          <TabButton active={tab === "cycles"} onClick={() => setTab("cycles")} icon={Activity} label="Crop Cycles" />
          <TabButton active={tab === "harvests"} onClick={() => setTab("harvests")} icon={Wheat} label="Harvests" />
        </div>

        <div className="p-4">
          {tab === "fields" && (
            <FieldsTab organizationId={organizationId} farmId={farmId} />
          )}
          {tab === "devices" && (
            <DevicesTab organizationId={organizationId} farmId={farmId} />
          )}
          {tab === "cycles" && (
            <CyclesTab organizationId={organizationId} farmId={farmId} />
          )}
          {tab === "harvests" && (
            <HarvestsTab organizationId={organizationId} farmId={farmId} />
          )}
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

function usePaged<T>(url: string, page: number) {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${url}?page=${page}&pageSize=20`, { cache: "no-store" })
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
  }, [url, page]);
  return { data, loading, error };
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
function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-sm text-slate-500">
      <Package className="mx-auto mb-2 h-7 w-7 text-slate-300" />
      {label}
    </div>
  );
}

// ---------- tabs ----------

function FieldsTab({
  organizationId,
  farmId,
}: {
  organizationId: string;
  farmId: string;
}) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = usePaged<FieldRow>(
    `/api/admin/organizations/${organizationId}/farms/${farmId}/fields`,
    page
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;
  if (!data || data.items.length === 0)
    return <EmptyState label="This farm has no fields yet." />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Field</th>
              <th className="px-3 py-2 text-right">Area (ha)</th>
              <th className="px-3 py-2">Soil</th>
              <th className="px-3 py-2">Irrigation</th>
              <th className="px-3 py-2 text-right">Cycles</th>
              <th className="px-3 py-2 text-right">Devices</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <span className="block font-medium text-slate-900">
                    {f.name ?? `Field ${f.fieldNumber}`}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    #{f.fieldNumber}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {f.areaHa}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {f.soilType ?? "—"}
                  {f.soilDepth ? ` · ${f.soilDepth}m` : ""}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {f.irrigationMethod ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {f.cropCyclesCount}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {f.devicesCount}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={f.status} />
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
    </div>
  );
}

function DevicesTab({
  organizationId,
  farmId,
}: {
  organizationId: string;
  farmId: string;
}) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = usePaged<DeviceRow>(
    `/api/admin/organizations/${organizationId}/farms/${farmId}/devices`,
    page
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;
  if (!data || data.items.length === 0)
    return <EmptyState label="No IoT devices on this farm yet." />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Device</th>
              <th className="px-3 py-2">Serial</th>
              <th className="px-3 py-2">Field</th>
              <th className="px-3 py-2 text-right">Battery</th>
              <th className="px-3 py-2 text-right">Signal</th>
              <th className="px-3 py-2">Last Reading</th>
              <th className="px-3 py-2 text-right">Readings</th>
              <th className="px-3 py-2 text-right">Alerts</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <span className="block font-medium text-slate-900">
                    {d.deviceModel ?? d.deviceType}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {d.deviceType}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {d.serialNumber ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {d.field
                    ? d.field.name ?? `Field ${d.field.fieldNumber}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {d.batteryLevel != null ? `${d.batteryLevel}%` : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {d.signalStrength ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {d.lastReadingAt
                    ? new Date(d.lastReadingAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {d.readingsCount}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {d.alertsCount > 0 ? (
                    <span className="text-red-600">{d.alertsCount}</span>
                  ) : (
                    d.alertsCount
                  )}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={d.status} />
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
    </div>
  );
}

function CyclesTab({
  organizationId,
  farmId,
}: {
  organizationId: string;
  farmId: string;
}) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = usePaged<CycleRow>(
    `/api/admin/organizations/${organizationId}/farms/${farmId}/cycles`,
    page
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;
  if (!data || data.items.length === 0)
    return <EmptyState label="No crop cycles recorded on this farm yet." />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Cycle</th>
              <th className="px-3 py-2">Field</th>
              <th className="px-3 py-2">Crop</th>
              <th className="px-3 py-2">Planted</th>
              <th className="px-3 py-2 text-right">Yield (kg)</th>
              <th className="px-3 py-2 text-right">Harvests</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <span className="block font-medium text-slate-900">
                    {c.cycleName ?? `Cycle #${c.cycleNumber}`}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    #{c.cycleNumber}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {c.field.name ?? `Field ${c.field.fieldNumber}`}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {c.cropType}
                  {c.variety ? ` (${c.variety})` : ""}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {new Date(c.plantingDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {c.totalYieldKg ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {c.harvestsCount}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={c.status} />
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
    </div>
  );
}

function HarvestsTab({
  organizationId,
  farmId,
}: {
  organizationId: string;
  farmId: string;
}) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = usePaged<HarvestRow>(
    `/api/admin/organizations/${organizationId}/farms/${farmId}/harvests`,
    page
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;
  if (!data || data.items.length === 0)
    return <EmptyState label="No harvests recorded for this farm yet." />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Cycle</th>
              <th className="px-3 py-2 text-right">Quantity</th>
              <th className="px-3 py-2">Grade</th>
              <th className="px-3 py-2 text-right">Moisture</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-xs text-slate-700">
                  {new Date(h.harvestDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {h.cycle.cropType} #{h.cycle.cycleNumber}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {h.quantity.toLocaleString()} {h.unit}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {h.qualityGrade ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {h.moisturePct != null ? `${h.moisturePct}%` : "—"}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={h.status} />
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
    </div>
  );
}