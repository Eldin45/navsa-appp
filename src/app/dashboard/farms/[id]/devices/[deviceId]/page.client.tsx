"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  Radio,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Ban,
  Battery,
  Signal,
  Wifi,
  Power,
  PowerOff,
  Save,
  Trash2,
  Zap,
  Clock,
  Gauge,
  Settings as SettingsIcon,
  ListChecks,
  Play,
  Square,
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
    isAdmin: boolean;
    isFarmer: boolean;
  };
  farm: { id: string; name: string };
  isActuator: boolean;
  device: {
    id: string;
    deviceType: string;
    deviceModel: string | null;
    manufacturer: string | null;
    serialNumber: string | null;
    installedDate: string;
    status: string;
    connectionType: string | null;
    signalStrength: number | null;
    powerSource: string | null;
    batteryLevel: number | null;
    readingFrequency: number | null;
    lastReading: string | null;
    locationLat: number | null;
    locationLng: number | null;
    simCardNumber: string | null;
    field: { id: string; name: string | null; fieldNumber: string } | null;
    counts: { readings: number; alerts: number; commands: number };
  };
  actuator: {
    mode: "MANUAL" | "AUTO" | "SCHEDULE";
    state: "ON" | "OFF";
    lastStateChange: string | null;
    lastChangedBy: string | null;
    triggerType: string | null;
    triggerUnit: string | null;
    onBelow: number | null;
    offAbove: number | null;
    maxRunMinutes: number | null;
    cooldownMinutes: number | null;
    totalRuntimeMinutes: number;
    lastRunStartedAt: string | null;
  } | null;
  latestReading: {
    value: number;
    type: string;
    unit: string;
    at: string;
  } | null;
}

interface CommandRow {
  id: string;
  action: string;
  source: string;
  reason: string | null;
  readingValue: number | null;
  readingType: string | null;
  success: boolean;
  createdAt: string;
}

type Tab = "settings" | "control" | "history";

// ============================================================
// MAIN
// ============================================================

export default function DeviceDetailClient({
  user,
  farm,
  isActuator,
  device,
  actuator,
  latestReading,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(isActuator ? "control" : "settings");

  const canManage = user.isSuperAdmin || user.isAdmin || user.isFarmer;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/farms/${farm.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {farm.name}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Radio className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {device.deviceType.replace(/_/g, " ")}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
                {device.manufacturer ?? "Unknown manufacturer"}
              </span>
              {device.serialNumber && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
                  {device.serialNumber}
                </span>
              )}
              {device.field && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                  {device.field.name ?? `Field ${device.field.fieldNumber}`}
                </span>
              )}
              {device.status === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  <Ban className="h-3 w-3" />
                  {device.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          icon={Radio}
          label="Readings"
          value={device.counts.readings}
          color="info"
        />
        <Kpi
          icon={AlertCircle}
          label="Alerts"
          value={device.counts.alerts}
          color={device.counts.alerts > 0 ? "warning" : "info"}
        />
        {isActuator ? (
          <Kpi
            icon={ListChecks}
            label="Commands"
            value={device.counts.commands}
            color="primary"
          />
        ) : (
          <Kpi
            icon={Battery}
            label="Battery"
            value={
              device.batteryLevel != null ? `${device.batteryLevel}%` : "—"
            }
            color={
              device.batteryLevel != null && device.batteryLevel < 20
                ? "warning"
                : "success"
            }
          />
        )}
        {isActuator && (
          <Kpi
            icon={Clock}
            label="Total Runtime"
            value={`${actuator?.totalRuntimeMinutes ?? 0}m`}
            color="success"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        <TabButton
          active={tab === "settings"}
          onClick={() => setTab("settings")}
          icon={SettingsIcon}
          label="Settings"
        />
        {isActuator && (
          <TabButton
            active={tab === "control"}
            onClick={() => setTab("control")}
            icon={Zap}
            label="Control"
          />
        )}
        {isActuator && (
          <TabButton
            active={tab === "history"}
            onClick={() => setTab("history")}
            icon={ListChecks}
            label="Command history"
          />
        )}
      </div>

      {/* SETTINGS */}
      {tab === "settings" && (
        <SettingsTab
          device={device}
          canManage={canManage}
          onChanged={() => router.refresh()}
        />
      )}

      {/* CONTROL */}
      {tab === "control" && isActuator && actuator && (
        <ControlTab
          device={device}
          actuator={actuator}
          latestReading={latestReading}
          canManage={canManage}
          onChanged={() => router.refresh()}
        />
      )}

      {/* HISTORY */}
      {tab === "history" && isActuator && (
        <HistoryTab deviceId={device.id} />
      )}
    </div>
  );
}

// ============================================================
// KPI
// ============================================================

function Kpi({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
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
        <span className="text-xs font-medium">{label}</span>
        <span className="rounded-full bg-white/60 p-1.5">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
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
      className={`flex flex-shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
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

// ============================================================
// SETTINGS TAB
// ============================================================

function SettingsTab({
  device,
  canManage,
  onChanged,
}: {
  device: Props["device"];
  canManage: boolean;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    status: device.status,
    device_model: device.deviceModel ?? "",
    manufacturer: device.manufacturer ?? "",
    serial_number: device.serialNumber ?? "",
    connection_type: device.connectionType ?? "",
    power_source: device.powerSource ?? "",
    reading_frequency:
      device.readingFrequency != null ? String(device.readingFrequency) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `/api/dashboard/farms/${device.id.split("-")[0]}/devices/${device.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: form.status,
            device_model: form.device_model || null,
            manufacturer: form.manufacturer || null,
            serial_number: form.serial_number || null,
            connection_type: form.connection_type || null,
            power_source: form.power_source || null,
            reading_frequency: form.reading_frequency
              ? Number(form.reading_frequency)
              : null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update");
      setSuccess("Device updated.");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Device settings</h2>
      <p className="text-xs text-slate-500">
        Basic metadata and connectivity configuration.
      </p>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <form
        onSubmit={save}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field
          label="Device Model"
          value={form.device_model}
          onChange={(v) => update("device_model", v)}
          disabled={!canManage}
        />
        <Field
          label="Manufacturer"
          value={form.manufacturer}
          onChange={(v) => update("manufacturer", v)}
          disabled={!canManage}
        />
        <Field
          label="Serial Number"
          value={form.serial_number}
          onChange={(v) => update("serial_number", v)}
          disabled={!canManage}
        />
        <Field
          label="Reading Frequency (min)"
          type="number"
          value={form.reading_frequency}
          onChange={(v) => update("reading_frequency", v)}
          disabled={!canManage}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Connectivity
          </label>
          <select
            value={form.connection_type}
            onChange={(e) => update("connection_type", e.target.value)}
            disabled={!canManage}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">—</option>
            <option value="WIFI">WiFi</option>
            <option value="GSM">GSM</option>
            <option value="LORAWAN">LoRaWAN</option>
            <option value="NB_IOT">NB-IoT</option>
            <option value="ETHERNET">Ethernet</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Power Source
          </label>
          <select
            value={form.power_source}
            onChange={(e) => update("power_source", e.target.value)}
            disabled={!canManage}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">—</option>
            <option value="SOLAR">Solar</option>
            <option value="BATTERY">Battery</option>
            <option value="MAINS">Mains</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            disabled={!canManage}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {canManage && (
          <div className="flex justify-end sm:col-span-2">
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
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// ============================================================
// CONTROL TAB
// ============================================================

function ControlTab({
  device,
  actuator,
  latestReading,
  canManage,
  onChanged,
}: {
  device: Props["device"];
  actuator: NonNullable<Props["actuator"]>;
  latestReading: Props["latestReading"];
  canManage: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [local, setLocal] = useState({
    mode: actuator.mode,
    triggerType: actuator.triggerType ?? "SOIL_MOISTURE",
    triggerUnit: actuator.triggerUnit ?? "%",
    onBelow: actuator.onBelow != null ? String(actuator.onBelow) : "",
    offAbove: actuator.offAbove != null ? String(actuator.offAbove) : "",
    maxRunMinutes:
      actuator.maxRunMinutes != null ? String(actuator.maxRunMinutes) : "",
    cooldownMinutes:
      actuator.cooldownMinutes != null ? String(actuator.cooldownMinutes) : "",
  });

  const update = (k: string, v: string) => setLocal({ ...local, [k]: v });

  const postControl = async (payload: any, tag: string) => {
    setBusy(tag);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `/api/dashboard/farms/${device.id.split("-")[0]}/devices/${device.id}/control`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Control failed");
      setSuccess("Command sent.");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const turnOn = () => postControl({ action: "TURN_ON" }, "on");
  const turnOff = () => postControl({ action: "TURN_OFF" }, "off");
  const setManual = () =>
    postControl({ action: "SET_MODE", mode: "MANUAL" }, "manual");
  const setAuto = () =>
    postControl(
      {
        action: "SET_MODE",
        mode: "AUTO",
        triggerType: local.triggerType,
        triggerUnit: local.triggerUnit,
        onBelow: Number(local.onBelow),
        offAbove: Number(local.offAbove),
        maxRunMinutes: local.maxRunMinutes
          ? Number(local.maxRunMinutes)
          : undefined,
        cooldownMinutes: local.cooldownMinutes
          ? Number(local.cooldownMinutes)
          : undefined,
      },
      "auto"
    );

  const reading = latestReading;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Current state banner */}
      <div
        className={`rounded-xl border p-5 ${
          actuator.state === "ON"
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current state
            </div>
            <div
              className={`mt-0.5 text-2xl font-bold ${
                actuator.state === "ON"
                  ? "text-emerald-700"
                  : "text-slate-700"
              }`}
            >
              {actuator.state}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Mode: <strong>{actuator.mode}</strong>
              {actuator.lastStateChange &&
                ` · since ${new Date(
                  actuator.lastStateChange
                ).toLocaleTimeString()}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total runtime
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900">
              {actuator.totalRuntimeMinutes}m
            </div>
          </div>
        </div>

        {canManage && actuator.mode === "MANUAL" && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={turnOn}
              disabled={busy !== null || actuator.state === "ON"}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy === "on" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              Turn ON
            </button>
            <button
              onClick={turnOff}
              disabled={busy !== null || actuator.state === "OFF"}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              {busy === "off" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
              Turn OFF
            </button>
          </div>
        )}

        {actuator.mode === "AUTO" && (
          <div className="mt-4 rounded-lg border border-white bg-white/80 p-3 text-xs text-slate-700">
            <div>
              Auto rule: <strong>ON when {actuator.triggerType} &lt; {actuator.onBelow}{actuator.triggerUnit}</strong>
              {" · "}
              <strong>OFF when {actuator.triggerType} &gt; {actuator.offAbove}{actuator.triggerUnit}</strong>
            </div>
            {reading && (
              <div className="mt-2 flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-slate-400" />
                Latest {reading.type}:{" "}
                <strong>
                  {reading.value}
                  {reading.unit}
                </strong>
                <span className="text-slate-400">
                  ({new Date(reading.at).toLocaleTimeString()})
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode switch */}
      {canManage && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Control mode
          </h3>
          <p className="text-xs text-slate-500">
            Switch between manual control and automatic threshold-based control.
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={setManual}
              disabled={busy !== null || actuator.mode === "MANUAL"}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
                actuator.mode === "MANUAL"
                  ? "border-slate-500 bg-slate-100 text-slate-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              {busy === "manual" ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="mr-2 inline h-4 w-4" />
                  Manual
                </>
              )}
            </button>
            <button
              onClick={setAuto}
              disabled={busy !== null || actuator.mode === "AUTO"}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
                actuator.mode === "AUTO"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              {busy === "auto" ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="mr-2 inline h-4 w-4" />
                  Auto
                </>
              )}
            </button>
          </div>

          {/* AUTO rule editor */}
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Trigger metric
              </label>
              <select
                value={local.triggerType}
                onChange={(e) => {
                  update("triggerType", e.target.value);
                  update(
                    "triggerUnit",
                    e.target.value === "TEMPERATURE" ? "°C" : "%"
                  );
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="SOIL_MOISTURE">Soil moisture (%)</option>
                <option value="TEMPERATURE">Temperature (°C)</option>
                <option value="HUMIDITY">Humidity (%)</option>
                <option value="RAINFALL">Rainfall (mm)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Turn ON below
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={local.onBelow}
                    onChange={(e) => update("onBelow", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {local.triggerUnit}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Turn OFF above
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={local.offAbove}
                    onChange={(e) => update("offAbove", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {local.triggerUnit}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Max run (min)
                </label>
                <input
                  type="number"
                  value={local.maxRunMinutes}
                  onChange={(e) => update("maxRunMinutes", e.target.value)}
                  placeholder="Safety cap"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Cooldown (min)
                </label>
                <input
                  type="number"
                  value={local.cooldownMinutes}
                  onChange={(e) => update("cooldownMinutes", e.target.value)}
                  placeholder="Min gap between ONs"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={setAuto}
              disabled={busy !== null}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy === "auto" ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Save AUTO rule"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HISTORY TAB
// ============================================================

function HistoryTab({ deviceId }: { deviceId: string }) {
  const [items, setItems] = useState<CommandRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/dashboard/farms/${deviceId.split("-")[0]}/devices/${deviceId}/commands?pageSize=50`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.success) setItems(j.data.items);
        else if (!cancelled) throw new Error(j.error ?? "Failed");
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
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
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        No commands yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <ul className="space-y-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
          >
            <span
              className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                c.action === "ON"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {c.action === "ON" ? (
                <Power className="h-3 w-3" />
              ) : (
                <PowerOff className="h-3 w-3" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-slate-800">
                <strong>{c.action}</strong>{" "}
                <span className="text-slate-500">
                  via {c.source.toLowerCase()}
                </span>
              </div>
              {c.reason && (
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {c.reason}
                </div>
              )}
              <div className="mt-0.5 text-[10px] text-slate-400">
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  disabled,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
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
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}