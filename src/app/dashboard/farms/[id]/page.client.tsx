"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sprout,
  MapPin,
  Users,
  User as UserIcon,
  Building2,
  Calendar,
  Layers,
  Cpu,
  CloudSun,
  Edit3,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Ban,
  X,
  Send,
  Battery,
  Signal,
  Wifi,
  Radio,
  Sparkles,
  RefreshCw,
  Wand2,
  ListChecks,
  Lightbulb,
  Zap,
  Power,
  PowerOff,
  ChevronRight,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface FarmData {
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
    role: string;
    organizationId: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    groupType: string;
    organizationId: string | null;
  } | null;
  counts: {
    fields: number;
    devices: number;
    weatherStations: number;
  };
}

interface FieldRow {
  id: string;
  name: string | null;
  fieldNumber: string;
  areaHa: number;
  latitude: number | null;
  longitude: number | null;
  soilType: string | null;
  soilDepth: number | null;
  status: string;
  irrigationMethod: string | null;
  createdAt: string;
  counts: { devices: number; cropCycles: number };
}

interface DeviceRow {
  id: string;
  deviceType: string;
  deviceModel: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  installedDate: string;
  locationLat: number | null;
  locationLng: number | null;
  connectionType: string | null;
  simCardNumber: string | null;
  signalStrength: number | null;
  powerSource: string | null;
  batteryLevel: number | null;
  status: string;
  readingFrequency: number | null;
  lastReading: string | null;
  field: { id: string; name: string | null; fieldNumber: string } | null;
  counts: { readings: number; alerts: number; commands?: number };
  actuator?: {
    mode: "MANUAL" | "AUTO" | "SCHEDULE";
    state: "ON" | "OFF";
    totalRuntimeMinutes: number;
  } | null;
  isActuator?: boolean;
}

interface StationRow {
  id: string;
  stationCode: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  elevation: number | null;
  provider: string | null;
  status: string;
  createdAt: string;
  readingCount: number;
}

interface AdviceRow {
  id: string;
  adviceType: string;
  adviceText: string;
  confidenceScore: number | null;
  modelUsed: string | null;
  actionItems: string[];
  isActioned: boolean;
  actionedAt: string | null;
  createdAt: string;
  fieldId: string | null;
  cycleId: string | null;
  requestedBy: { id: string; name: string; email: string } | null;
}

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
  geminiEnabled: boolean;
  farm: FarmData;
  fields: FieldRow[];
  devices: DeviceRow[];
  weatherStations: StationRow[];
  initialAdvice: AdviceRow[];
}

type Tab = "overview" | "fields" | "devices" | "weather" | "ai";

const ACTUATOR_TYPES = [
  "WATER_PUMP",
  "VALVE",
  "FAN",
  "LIGHT",
  "MOTOR",
  "HEATER",
];

function isActuatorType(t: string) {
  return ACTUATOR_TYPES.includes(t);
}

// ============================================================
// MAIN
// ============================================================

export default function FarmDetailClient({
  user,
  geminiEnabled,
  farm,
  fields,
  devices,
  weatherStations,
  initialAdvice,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [stationModalOpen, setStationModalOpen] = useState(false);

  const [advice, setAdvice] = useState<AdviceRow[]>(initialAdvice);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const canManage = user.isSuperAdmin || user.isAdmin || user.isFarmer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/farms"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to farms
        </Link>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-semibold text-white shadow-md shadow-emerald-500/20">
              {farm.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{farm.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
                  {farm.farmType.replace("_", " ")}
                </span>
                {farm.group ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                    <Users className="h-3 w-3" />
                    Group · {farm.group.name}
                  </span>
                ) : farm.owner ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    <UserIcon className="h-3 w-3" />
                    {farm.owner.name}
                  </span>
                ) : null}
                {farm.status === "ACTIVE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                    <Ban className="h-3 w-3" />
                    {farm.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit farm
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickStat
          icon={Layers}
          label="Fields"
          value={farm.counts.fields}
          color="primary"
        />
        <QuickStat
          icon={Cpu}
          label="Devices"
          value={farm.counts.devices}
          color="success"
        />
        <QuickStat
          icon={CloudSun}
          label="Weather Stations"
          value={farm.counts.weatherStations}
          color="warning"
        />
        <QuickStat
          icon={MapPin}
          label="Total Area"
          value={`${farm.totalAreaHa} ha`}
          color="info"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        <TabButton
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={Sprout}
          label="Overview"
        />
        <TabButton
          active={tab === "fields"}
          onClick={() => setTab("fields")}
          icon={Layers}
          label={`Fields (${fields.length})`}
        />
        <TabButton
          active={tab === "devices"}
          onClick={() => setTab("devices")}
          icon={Cpu}
          label={`Devices (${devices.length})`}
        />
        <TabButton
          active={tab === "weather"}
          onClick={() => setTab("weather")}
          icon={CloudSun}
          label={`Weather (${weatherStations.length})`}
        />
        <TabButton
          active={tab === "ai"}
          onClick={() => setTab("ai")}
          icon={Sparkles}
          label={`AI Advice (${advice.length})`}
        />
      </div>

      {/* -------------------- OVERVIEW -------------------- */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Farm information
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow
                icon={MapPin}
                label="Location"
                value={
                  farm.latitude && farm.longitude
                    ? `${farm.latitude}, ${farm.longitude}`
                    : "Not set"
                }
              />
              <DetailRow
                icon={Sprout}
                label="Total area"
                value={`${farm.totalAreaHa} ha`}
              />
              <DetailRow
                icon={Sprout}
                label="Cultivable area"
                value={farm.cultivableHa ? `${farm.cultivableHa} ha` : "—"}
              />
              <DetailRow
                icon={Sprout}
                label="Soil"
                value={`${farm.soilType ?? "—"}${
                  farm.soilPh ? ` · pH ${farm.soilPh}` : ""
                }`}
              />
              <DetailRow
                icon={CloudSun}
                label="Irrigation"
                value={`${farm.irrigationType ?? "—"}${
                  farm.irrigationSource ? ` · ${farm.irrigationSource}` : ""
                }`}
              />
              <DetailRow
                icon={Sprout}
                label="Current crop"
                value={`${farm.currentCrop ?? "—"}${
                  farm.cropVariety ? ` · ${farm.cropVariety}` : ""
                }`}
              />
              <DetailRow
                icon={Calendar}
                label="Planting date"
                value={
                  farm.plantingDate
                    ? new Date(farm.plantingDate).toLocaleDateString()
                    : "—"
                }
              />
              <DetailRow
                icon={Calendar}
                label="Expected harvest"
                value={
                  farm.expectedHarvest
                    ? new Date(farm.expectedHarvest).toLocaleDateString()
                    : "—"
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Assignment</h2>
            <div className="mt-4 space-y-3">
              {farm.group ? (
                <>
                  <DetailRow
                    icon={Users}
                    label="Group"
                    value={farm.group.name}
                  />
                  <DetailRow
                    icon={Building2}
                    label="Group type"
                    value={farm.group.groupType}
                  />
                </>
              ) : farm.owner ? (
                <>
                  <DetailRow
                    icon={UserIcon}
                    label="Owner"
                    value={farm.owner.name}
                  />
                  <DetailRow
                    icon={UserIcon}
                    label="Email"
                    value={farm.owner.email}
                  />
                </>
              ) : (
                <p className="text-sm text-slate-500">Unassigned</p>
              )}
              <DetailRow
                icon={Calendar}
                label="Created"
                value={new Date(farm.createdAt).toLocaleDateString()}
              />
              <DetailRow
                icon={Calendar}
                label="Updated"
                value={new Date(farm.updatedAt).toLocaleDateString()}
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------- FIELDS -------------------- */}
      {tab === "fields" && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <button
                onClick={() => setFieldModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>
          )}

          {fields.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No fields yet"
              description="Divide this farm into fields to track crops and devices individually."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {f.name ?? f.fieldNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        #{f.fieldNumber} · {f.areaHa} ha
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {f.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <MiniStat
                      icon={Cpu}
                      label="Devices"
                      value={f.counts.devices}
                    />
                    <MiniStat
                      icon={Sprout}
                      label="Cycles"
                      value={f.counts.cropCycles}
                    />
                  </div>
                  {(f.soilType || f.soilDepth) && (
                    <div className="mt-3 text-xs text-slate-500">
                      Soil: {f.soilType ?? "—"}
                      {f.soilDepth ? ` · ${f.soilDepth} cm` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- DEVICES -------------------- */}
      {tab === "devices" && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <button
                onClick={() => setDeviceModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Register Device
              </button>
            </div>
          )}

          {devices.length === 0 ? (
            <EmptyState
              icon={Cpu}
              title="No devices yet"
              description="Register IoT sensors, weather stations, cameras and more to monitor this farm."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Model / Serial</th>
                      <th className="px-4 py-3">Connectivity</th>
                      <th className="px-4 py-3">Battery</th>
                      <th className="px-4 py-3">Last reading</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map((d) => {
                      const actuator =
                        d.isActuator || isActuatorType(d.deviceType);
                      const href = `/dashboard/farms/${farm.id}/devices/${d.id}`;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link
                              href={href}
                              className="group flex items-center gap-3"
                            >
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                  actuator
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-sky-50 text-sky-600"
                                }`}
                              >
                                {actuator ? (
                                  <Zap className="h-4 w-4" />
                                ) : (
                                  <Radio className="h-4 w-4" />
                                )}
                              </span>
                              <span>
                                <span className="block font-medium text-slate-900 group-hover:text-emerald-700">
                                  {d.deviceType.replace(/_/g, " ")}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  {d.manufacturer ?? "Unknown"}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {d.field
                              ? `${d.field.name ?? "Unnamed"} (#${
                                  d.field.fieldNumber
                                })`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div>{d.deviceModel ?? "—"}</div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {d.serialNumber ?? "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Wifi className="h-3 w-3 text-slate-400" />
                              {d.connectionType ?? "—"}
                            </div>
                            {d.signalStrength != null && (
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                                <Signal className="h-3 w-3" />
                                {d.signalStrength}%
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {d.batteryLevel != null ? (
                              <div className="flex items-center gap-1">
                                <Battery
                                  className={`h-3 w-3 ${
                                    d.batteryLevel < 20
                                      ? "text-red-500"
                                      : d.batteryLevel < 50
                                        ? "text-amber-500"
                                        : "text-emerald-500"
                                  }`}
                                />
                                {d.batteryLevel}%
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {d.lastReading
                              ? new Date(d.lastReading).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="px-4 py-3">
                            {actuator && d.actuator ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  d.actuator.state === "ON"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {d.actuator.state === "ON" ? (
                                  <Power className="h-3 w-3" />
                                ) : (
                                  <PowerOff className="h-3 w-3" />
                                )}
                                {d.actuator.state} · {d.actuator.mode}
                              </span>
                            ) : d.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            ) : d.status === "OFFLINE" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                <Ban className="h-3 w-3" />
                                Offline
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {d.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={href}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              Manage
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- WEATHER -------------------- */}
      {tab === "weather" && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <button
                onClick={() => setStationModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Weather Station
              </button>
            </div>
          )}

          {weatherStations.length === 0 ? (
            <EmptyState
              icon={CloudSun}
              title="No weather stations yet"
              description="Register a weather station to receive micro-climate readings for this farm."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {weatherStations.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {s.name}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {s.stationCode}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-500">
                      <div className="text-[10px] uppercase tracking-wider">
                        Provider
                      </div>
                      <div className="text-slate-900">{s.provider ?? "—"}</div>
                    </div>
                    <div className="text-slate-500">
                      <div className="text-[10px] uppercase tracking-wider">
                        Elevation
                      </div>
                      <div className="text-slate-900">
                        {s.elevation ? `${s.elevation} m` : "—"}
                      </div>
                    </div>
                    <div className="text-slate-500">
                      <div className="text-[10px] uppercase tracking-wider">
                        Readings
                      </div>
                      <div className="text-slate-900">{s.readingCount}</div>
                    </div>
                    <div className="text-slate-500">
                      <div className="text-[10px] uppercase tracking-wider">
                        Installed
                      </div>
                      <div className="text-slate-900">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- AI ADVICE -------------------- */}
      {tab === "ai" && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                {geminiEnabled
                  ? "Gemini analyses the farm, soil, crop and weather to suggest next actions."
                  : "AI advice is unavailable — GEMINI_API_KEY is not configured."}
              </p>
              <button
                onClick={() => setAiModalOpen(true)}
                disabled={!geminiEnabled}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-medium text-white hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                Get AI Advice
              </button>
            </div>
          )}

          {advice.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No AI advice yet"
              description="Generate tailored agronomy advice based on this farm's data — soil, crop, irrigation, and weather."
            />
          ) : (
            <div className="space-y-4">
              {advice.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {a.adviceType.replace(/_/g, " ")} advice
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(a.createdAt).toLocaleString()}
                          {a.modelUsed && (
                            <>
                              {" "}
                              · <span className="font-mono">{a.modelUsed}</span>
                            </>
                          )}
                          {a.confidenceScore != null && (
                            <>
                              {" "}
                              · confidence{" "}
                              {(a.confidenceScore * 100).toFixed(0)}%
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {a.isActioned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Actioned
                      </span>
                    )}
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                    {a.adviceText}
                  </p>

                  {a.actionItems.length > 0 && (
                    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        <ListChecks className="h-3 w-3" />
                        Action items
                      </div>
                      <ul className="space-y-1 text-sm text-emerald-900">
                        {a.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.requestedBy && (
                    <div className="mt-3 text-xs text-slate-500">
                      Requested by {a.requestedBy.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}

      {editModalOpen && (
        <EditFarmModal
          farm={farm}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {fieldModalOpen && (
        <AddFieldModal
          farmId={farm.id}
          onClose={() => setFieldModalOpen(false)}
          onSuccess={() => {
            setFieldModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {deviceModalOpen && (
        <RegisterDeviceModal
          farmId={farm.id}
          fields={fields}
          onClose={() => setDeviceModalOpen(false)}
          onSuccess={() => {
            setDeviceModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {stationModalOpen && (
        <AddStationModal
          farmId={farm.id}
          onClose={() => setStationModalOpen(false)}
          onSuccess={() => {
            setStationModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {aiModalOpen && (
        <GenerateAdviceModal
          farmId={farm.id}
          fields={fields}
          onClose={() => setAiModalOpen(false)}
          onSuccess={(newAdvice) => {
            setAdvice((prev) => [newAdvice, ...prev]);
            setAiModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
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
      className={`flex flex-shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: "primary" | "success" | "warning" | "info";
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
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-full bg-white/60 p-2">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

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

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="ml-auto text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
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

// ============================================================
// EDIT FARM MODAL
// ============================================================

function EditFarmModal({
  farm,
  onClose,
  onSuccess,
}: {
  farm: FarmData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: farm.name,
    farmType: farm.farmType,
    status: farm.status,
    totalAreaHa: String(farm.totalAreaHa),
    cultivableHa: farm.cultivableHa != null ? String(farm.cultivableHa) : "",
    soilType: farm.soilType ?? "",
    soilPh: farm.soilPh != null ? String(farm.soilPh) : "",
    irrigationType: farm.irrigationType ?? "",
    irrigationSource: farm.irrigationSource ?? "",
    currentCrop: farm.currentCrop ?? "",
    cropVariety: farm.cropVariety ?? "",
    plantingDate: farm.plantingDate ? farm.plantingDate.slice(0, 10) : "",
    expectedHarvest: farm.expectedHarvest
      ? farm.expectedHarvest.slice(0, 10)
      : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/farms/${farm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          farm_type: form.farmType,
          status: form.status,
          total_area_ha: Number(form.totalAreaHa),
          cultivable_ha: form.cultivableHa ? Number(form.cultivableHa) : null,
          soil_type: form.soilType || null,
          soil_ph: form.soilPh ? Number(form.soilPh) : null,
          irrigation_type: form.irrigationType || null,
          irrigation_source: form.irrigationSource || null,
          current_crop: form.currentCrop || null,
          crop_variety: form.cropVariety || null,
          planting_date: form.plantingDate || null,
          expected_harvest: form.expectedHarvest || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Edit farm"
      subtitle="Update the farm details."
      onClose={onClose}
    >
      <form onSubmit={submit} className="max-h-[75vh] overflow-y-auto px-6 py-5">
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
            className="sm:col-span-2"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Farm Type
            </label>
            <select
              value={form.farmType}
              onChange={(e) => update("farmType", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
              <option value="COMMUNAL">Communal</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <Field
            label="Total Area (ha) *"
            type="number"
            value={form.totalAreaHa}
            onChange={(v) => update("totalAreaHa", v)}
            required
          />
          <Field
            label="Cultivable Area (ha)"
            type="number"
            value={form.cultivableHa}
            onChange={(v) => update("cultivableHa", v)}
          />
          <Field
            label="Soil Type"
            value={form.soilType}
            onChange={(v) => update("soilType", v)}
          />
          <Field
            label="Soil pH"
            type="number"
            value={form.soilPh}
            onChange={(v) => update("soilPh", v)}
          />
          <Field
            label="Irrigation Type"
            value={form.irrigationType}
            onChange={(v) => update("irrigationType", v)}
          />
          <Field
            label="Irrigation Source"
            value={form.irrigationSource}
            onChange={(v) => update("irrigationSource", v)}
          />
          <Field
            label="Current Crop"
            value={form.currentCrop}
            onChange={(v) => update("currentCrop", v)}
          />
          <Field
            label="Crop Variety"
            value={form.cropVariety}
            onChange={(v) => update("cropVariety", v)}
          />
          <Field
            label="Planting Date"
            type="date"
            value={form.plantingDate}
            onChange={(v) => update("plantingDate", v)}
          />
          <Field
            label="Expected Harvest"
            type="date"
            value={form.expectedHarvest}
            onChange={(v) => update("expectedHarvest", v)}
          />
        </div>

        <ModalFooter
          onCancel={onClose}
          loading={loading}
          submitLabel="Save changes"
        />
      </form>
    </ModalShell>
  );
}

// ============================================================
// ADD FIELD MODAL
// ============================================================

function AddFieldModal({
  farmId,
  onClose,
  onSuccess,
}: {
  farmId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    field_number: "",
    area_ha: "",
    soil_type: "",
    soil_depth: "",
    irrigation_method: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/farms/${farmId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          field_number: form.field_number,
          area_ha: Number(form.area_ha),
          soil_type: form.soil_type || null,
          soil_depth: form.soil_depth ? Number(form.soil_depth) : null,
          irrigation_method: form.irrigation_method || null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to create field");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Add field"
      subtitle="Split this farm into a trackable field."
      onClose={onClose}
    >
      <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Field Name"
            value={form.name}
            onChange={(v) => update("name", v)}
            placeholder="e.g. North Field"
          />
          <Field
            label="Field Number *"
            value={form.field_number}
            onChange={(v) => update("field_number", v)}
            required
            placeholder="e.g. F-01"
          />
          <Field
            label="Area (ha) *"
            type="number"
            value={form.area_ha}
            onChange={(v) => update("area_ha", v)}
            required
          />
          <Field
            label="Soil Type"
            value={form.soil_type}
            onChange={(v) => update("soil_type", v)}
          />
          <Field
            label="Soil Depth (cm)"
            type="number"
            value={form.soil_depth}
            onChange={(v) => update("soil_depth", v)}
          />
          <Field
            label="Irrigation Method"
            value={form.irrigation_method}
            onChange={(v) => update("irrigation_method", v)}
          />
          <Field
            label="Latitude"
            value={form.latitude}
            onChange={(v) => update("latitude", v)}
          />
          <Field
            label="Longitude"
            value={form.longitude}
            onChange={(v) => update("longitude", v)}
          />
        </div>

        <ModalFooter onCancel={onClose} loading={loading} submitLabel="Add field" />
      </form>
    </ModalShell>
  );
}

// ============================================================
// REGISTER DEVICE MODAL
// ============================================================

function RegisterDeviceModal({
  farmId,
  fields,
  onClose,
  onSuccess,
}: {
  farmId: string;
  fields: FieldRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    device_type: "SOIL_SENSOR",
    device_model: "",
    manufacturer: "",
    serial_number: "",
    installed_date: new Date().toISOString().slice(0, 10),
    field_id: "",
    location_lat: "",
    location_lng: "",
    connection_type: "WIFI",
    sim_card_number: "",
    power_source: "SOLAR",
    reading_frequency: "60",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const isActuator = ACTUATOR_TYPES.includes(form.device_type);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/farms/${farmId}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_type: form.device_type,
          device_model: form.device_model || null,
          manufacturer: form.manufacturer || null,
          serial_number: form.serial_number || null,
          installed_date: form.installed_date,
          field_id: form.field_id || null,
          location_lat: form.location_lat ? Number(form.location_lat) : null,
          location_lng: form.location_lng ? Number(form.location_lng) : null,
          connection_type: form.connection_type,
          sim_card_number: form.sim_card_number || null,
          power_source: form.power_source,
          reading_frequency: form.reading_frequency
            ? Number(form.reading_frequency)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to register device");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Register IoT device"
      subtitle="Add a sensor, actuator, camera, or weather station to this farm."
      onClose={onClose}
    >
      <form onSubmit={submit} className="max-h-[75vh] overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Device Type *
            </label>
            <select
              value={form.device_type}
              onChange={(e) => update("device_type", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <optgroup label="Sensors">
                <option value="SOIL_SENSOR">Soil Sensor</option>
                <option value="WEATHER_STATION">Weather Station</option>
                <option value="MOISTURE_PROBE">Moisture Probe</option>
                <option value="CAMERA">Camera</option>
                <option value="MULTI_SENSOR">Multi Sensor</option>
              </optgroup>
              <optgroup label="Actuators">
                <option value="WATER_PUMP">Water Pump</option>
                <option value="VALVE">Valve</option>
                <option value="FAN">Fan</option>
                <option value="LIGHT">Light</option>
                <option value="MOTOR">Motor</option>
                <option value="HEATER">Heater</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Assign to Field
            </label>
            <select
              value={form.field_id}
              onChange={(e) => update("field_id", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Farm-wide</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name ?? `Field ${f.fieldNumber}`}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Manufacturer"
            value={form.manufacturer}
            onChange={(v) => update("manufacturer", v)}
            placeholder="e.g. Davis, Libelium"
          />
          <Field
            label="Model"
            value={form.device_model}
            onChange={(v) => update("device_model", v)}
            placeholder="e.g. Vantage Vue"
          />
          <Field
            label="Serial Number"
            value={form.serial_number}
            onChange={(v) => update("serial_number", v)}
          />
          <Field
            label="Installed Date *"
            type="date"
            value={form.installed_date}
            onChange={(v) => update("installed_date", v)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Connectivity
            </label>
            <select
              value={form.connection_type}
              onChange={(e) => update("connection_type", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="WIFI">WiFi</option>
              <option value="GSM">GSM</option>
              <option value="LORAWAN">LoRaWAN</option>
              <option value="NB_IOT">NB-IoT</option>
              <option value="ETHERNET">Ethernet</option>
            </select>
          </div>
          <Field
            label="SIM Card Number"
            value={form.sim_card_number}
            onChange={(v) => update("sim_card_number", v)}
            placeholder="Optional"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Power Source
            </label>
            <select
              value={form.power_source}
              onChange={(e) => update("power_source", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="SOLAR">Solar</option>
              <option value="BATTERY">Battery</option>
              <option value="MAINS">Mains</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <Field
            label="Reading Frequency (min)"
            type="number"
            value={form.reading_frequency}
            onChange={(v) => update("reading_frequency", v)}
          />
          <Field
            label="Latitude"
            value={form.location_lat}
            onChange={(v) => update("location_lat", v)}
          />
          <Field
            label="Longitude"
            value={form.location_lng}
            onChange={(v) => update("location_lng", v)}
          />
        </div>

        {isActuator && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <Zap className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <div className="font-medium">This device is an actuator.</div>
              <p className="mt-0.5">
                After registering, open the device and use the{" "}
                <strong>Control</strong> tab to switch between Manual and Auto,
                set thresholds, and turn it on or off.
              </p>
            </div>
          </div>
        )}

        <ModalFooter
          onCancel={onClose}
          loading={loading}
          submitLabel="Register device"
        />
      </form>
    </ModalShell>
  );
}

// ============================================================
// ADD WEATHER STATION MODAL
// ============================================================

function AddStationModal({
  farmId,
  onClose,
  onSuccess,
}: {
  farmId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    station_code: "",
    name: "",
    provider: "",
    elevation: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/dashboard/farms/${farmId}/weather-stations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_code: form.station_code,
            name: form.name,
            provider: form.provider || null,
            elevation: form.elevation ? Number(form.elevation) : null,
            latitude: form.latitude ? Number(form.latitude) : null,
            longitude: form.longitude ? Number(form.longitude) : null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to create weather station");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Add weather station"
      subtitle="Register a station to receive micro-climate readings."
      onClose={onClose}
    >
      <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Station Code *"
            value={form.station_code}
            onChange={(v) => update("station_code", v)}
            required
            placeholder="e.g. WS-001"
          />
          <Field
            label="Name *"
            value={form.name}
            onChange={(v) => update("name", v)}
            required
            placeholder="e.g. Main Weather Station"
          />
          <Field
            label="Provider"
            value={form.provider}
            onChange={(v) => update("provider", v)}
            placeholder="e.g. Davis"
          />
          <Field
            label="Elevation (m)"
            type="number"
            value={form.elevation}
            onChange={(v) => update("elevation", v)}
          />
          <Field
            label="Latitude"
            value={form.latitude}
            onChange={(v) => update("latitude", v)}
          />
          <Field
            label="Longitude"
            value={form.longitude}
            onChange={(v) => update("longitude", v)}
          />
        </div>

        <ModalFooter
          onCancel={onClose}
          loading={loading}
          submitLabel="Add station"
        />
      </form>
    </ModalShell>
  );
}

// ============================================================
// GENERATE ADVICE MODAL
// ============================================================

function GenerateAdviceModal({
  farmId,
  fields,
  onClose,
  onSuccess,
}: {
  farmId: string;
  fields: FieldRow[];
  onClose: () => void;
  onSuccess: (advice: AdviceRow) => void;
}) {
  const [form, setForm] = useState({
    adviceType: "GENERAL",
    fieldId: "",
    extraNotes: "",
    language: "ENGLISH",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<string>("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress("Analysing farm data…");

    try {
      const res = await fetch(`/api/dashboard/farms/${farmId}/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adviceType: form.adviceType,
          fieldId: form.fieldId || null,
          extraNotes: form.extraNotes || undefined,
          language: form.language,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate advice");
      }
      onSuccess({
        id: data.data.id,
        adviceType: data.data.adviceType,
        adviceText: data.data.adviceText,
        confidenceScore: data.data.confidenceScore,
        modelUsed: data.data.modelUsed,
        actionItems: data.data.actionItems ?? [],
        isActioned: false,
        actionedAt: null,
        createdAt: data.data.createdAt,
        fieldId: form.fieldId || null,
        cycleId: null,
        requestedBy: null,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <ModalShell
      title="Get AI advice"
      subtitle="Gemini will analyse this farm's data and suggest next actions."
      onClose={onClose}
    >
      <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading && progress && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {progress}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Advice type *
            </label>
            <select
              value={form.adviceType}
              onChange={(e) => update("adviceType", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="GENERAL">General</option>
              <option value="IRRIGATION">Irrigation</option>
              <option value="FERTILIZER">Fertilizer</option>
              <option value="PEST">Pest control</option>
              <option value="DISEASE">Disease</option>
              <option value="PLANTING">Planting</option>
              <option value="HARVEST">Harvest</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Field (optional)
            </label>
            <select
              value={form.fieldId}
              onChange={(e) => update("fieldId", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Farm-wide</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name ?? `Field ${f.fieldNumber}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Language
            </label>
            <select
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              <option value="ENGLISH">English</option>
              <option value="PIDGIN">Nigerian Pidgin</option>
              <option value="HAUSA">Hausa</option>
              <option value="YORUBA">Yoruba</option>
              <option value="IGBO">Igbo</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Extra notes (optional)
            </label>
            <textarea
              value={form.extraNotes}
              onChange={(e) => update("extraNotes", e.target.value)}
              rows={3}
              placeholder="Anything else the AI should consider — recent issues, plans, etc."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          loading={loading}
          submitLabel="Generate advice"
        />
      </form>
    </ModalShell>
  );
}

// ============================================================
// MODAL HELPERS
// ============================================================

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  loading,
  submitLabel,
}: {
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onCancel}
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
            Saving…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  );
}