// src/app/dashboard/farms/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Sprout,
  Plus,
  Download,
  MapPin,
  Users,
  Building2,
  User as UserIcon,
  X,
  Loader2,
  AlertCircle,
  Send,
  Calendar,
  CheckCircle2,
  Ban,
  Layers,
  Cpu,
  CloudSun,
  ChevronRight,
  Pencil,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Farm {
  id: string;
  name: string;
  farmType: string;
  latitude: number | null;
  longitude: number | null;
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

interface FarmerOption {
  id: string;
  full_name: string;
  email: string;
  organizationId: string | null;
}

interface GroupOption {
  id: string;
  name: string;
  groupType: string;
  organizationId: string | null;
  memberCount: number;
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
  farms: Farm[];
  farmers: FarmerOption[];
  groups: GroupOption[];
  stats: {
    total: number;
    active: number;
    totalAreaHa: number;
    totalFields: number;
    deviceCount: number;
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
  value: number | string;
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

export default function FarmsClient({
  user,
  farms,
  farmers,
  groups,
  stats,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState<
    "ALL" | "INDIVIDUAL" | "GROUP" | "MINE"
  >("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return farms.filter((f) => {
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;

      if (ownershipFilter === "INDIVIDUAL" && !f.owner) return false;
      if (ownershipFilter === "GROUP" && !f.group) return false;
      if (ownershipFilter === "MINE" && f.owner?.id !== user.id) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.owner?.name ?? "").toLowerCase().includes(q) ||
        (f.group?.name ?? "").toLowerCase().includes(q) ||
        (f.currentCrop ?? "").toLowerCase().includes(q) ||
        (f.soilType ?? "").toLowerCase().includes(q)
      );
    });
  }, [farms, query, statusFilter, ownershipFilter, user.id]);

  const selectedFarm = selectedFarmId
    ? farms.find((f) => f.id === selectedFarmId) ?? null
    : null;

  const downloadCSV = () => {
    const header = [
      "Name",
      "Type",
      "Owner",
      "Group",
      "Area (ha)",
      "Crop",
      "Status",
      "Fields",
      "Devices",
      "Created",
    ].join(",");
    const rows = filtered.map((f) =>
      [
        f.name,
        f.farmType,
        f.owner?.name ?? "",
        f.group?.name ?? "",
        f.totalAreaHa,
        f.currentCrop ?? "",
        f.status,
        f.counts.fields,
        f.counts.devices,
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
    a.download = `farms-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canCreate =
    user.isSuperAdmin || user.isAdmin || user.isFarmer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farms</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.isSuperAdmin
              ? "All farms on the platform."
              : user.isAdmin
                ? "Farms owned by farmers or groups in your organization."
                : "Your farms and the farms of the groups you belong to."}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Farm
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total Farms" value={stats.total} color="primary" icon={Sprout} />
        <StatCard label="Active" value={stats.active} color="success" icon={CheckCircle2} />
        <StatCard
          label="Total Area"
          value={`${stats.totalAreaHa.toFixed(1)} ha`}
          color="warning"
          icon={MapPin}
        />
        <StatCard label="Fields" value={stats.totalFields} color="info" icon={Layers} />
        <StatCard label="Devices" value={stats.deviceCount} color="info" icon={Cpu} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, owner, group, crop…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="ALL">All ownership</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="GROUP">Group</option>
          {user.isFarmer && <option value="MINE">Mine only</option>}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
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
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Farm</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Area (ha)</th>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3 text-right">Fields</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <Sprout className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No farms found</p>
                    <p className="mt-1 text-xs">
                      Click &quot;Add Farm&quot; to create one.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedFarmId(f.id)}
                        className="group flex items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                          {f.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {f.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {f.counts.devices > 0
                              ? `${f.counts.devices} device${
                                  f.counts.devices === 1 ? "" : "s"
                                }`
                              : "No devices yet"}
                          </span>
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {f.group ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                          <Users className="h-3 w-3" />
                          Group · {f.group.name}
                        </span>
                      ) : f.owner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                          <UserIcon className="h-3 w-3" />
                          {f.owner.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      {f.farmType.replace("_", " ")}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {f.totalAreaHa}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      {f.currentCrop ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {f.counts.fields}
                    </td>

                    <td className="px-4 py-3">
                      {f.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Ban className="h-3 w-3" />
                          {f.status}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/farms/${f.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Link>
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
              {farms.length} farms
            </span>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <CreateFarmModal
          user={user}
          farmers={farmers}
          groups={groups}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Detail modal */}
      {selectedFarm && (
        <FarmDetailModal
          farm={selectedFarm}
          user={user}
          onClose={() => setSelectedFarmId(null)}
          onChanged={() => {
            setSelectedFarmId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// CREATE FARM MODAL
// ============================================================

function CreateFarmModal({
  user,
  farmers,
  groups,
  onClose,
  onSuccess,
}: {
  user: Props["user"];
  farmers: FarmerOption[];
  groups: GroupOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    farm_type: "INDIVIDUAL",
    latitude: "",
    longitude: "",
    total_area_ha: "",
    cultivable_ha: "",
    soil_type: "",
    soil_ph: "",
    irrigation_type: "",
    irrigation_source: "",
    current_crop: "",
    crop_variety: "",
    planting_date: "",
    expected_harvest: "",
  });

  // Assignment: FARMER creates for themselves only. ADMIN/SA pick either.
  const [assignmentType, setAssignmentType] = useState<"INDIVIDUAL" | "GROUP">(
    user.isFarmer ? "INDIVIDUAL" : "INDIVIDUAL"
  );
  const [ownerUserId, setOwnerUserId] = useState<string>(
    user.isFarmer ? user.id : ""
  );
  const [groupId, setGroupId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!form.name.trim()) {
      setError("Farm name is required");
      setLoading(false);
      return;
    }
    if (!form.total_area_ha || Number(form.total_area_ha) <= 0) {
      setError("Total area is required and must be greater than 0");
      setLoading(false);
      return;
    }
    if (!user.isFarmer && assignmentType === "INDIVIDUAL" && !ownerUserId) {
      setError("Please pick the farmer who will own this farm");
      setLoading(false);
      return;
    }
    if (!user.isFarmer && assignmentType === "GROUP" && !groupId) {
      setError("Please pick the group this farm belongs to");
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        name: form.name.trim(),
        farm_type: form.farm_type,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        total_area_ha: Number(form.total_area_ha),
        cultivable_ha: form.cultivable_ha ? Number(form.cultivable_ha) : null,
        soil_type: form.soil_type || null,
        soil_ph: form.soil_ph ? Number(form.soil_ph) : null,
        irrigation_type: form.irrigation_type || null,
        irrigation_source: form.irrigation_source || null,
        current_crop: form.current_crop || null,
        crop_variety: form.crop_variety || null,
        planting_date: form.planting_date || null,
        expected_harvest: form.expected_harvest || null,
      };

      if (user.isFarmer) {
        payload.ownerUserId = user.id;
      } else if (assignmentType === "INDIVIDUAL") {
        payload.ownerUserId = ownerUserId;
      } else {
        payload.groupId = groupId;
      }

      const res = await fetch("/api/dashboard/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create farm");
      }
      setDone({ id: data.data.id, name: data.data.name });
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {done ? "Farm created" : "Add Farm"}
              </h2>
              <p className="text-xs text-slate-500">
                {done
                  ? "The farm is ready to use."
                  : "Assign the farm to a farmer or a group."}
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
                    <strong>{done.name}</strong> has been created.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    You can now add fields, devices, and crop cycles from the
                    farm page.
                  </p>
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

            {/* ---- Assignment section ---- */}
            {!user.isFarmer && (
              <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assign farm to
                </h3>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentType("INDIVIDUAL")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                      assignmentType === "INDIVIDUAL"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <UserIcon className="mr-2 inline h-3 w-3" />
                    Individual Farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentType("GROUP")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                      assignmentType === "GROUP"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="mr-2 inline h-3 w-3" />
                    Farm Group
                  </button>
                </div>

                {assignmentType === "INDIVIDUAL" ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Farmer *
                    </label>
                    <select
                      value={ownerUserId}
                      onChange={(e) => setOwnerUserId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">Select a farmer…</option>
                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.full_name} · {f.email}
                        </option>
                      ))}
                    </select>
                    {farmers.length === 0 && (
                      <p className="mt-1 text-[11px] text-amber-600">
                        No farmers in your organization yet. Add farmers first.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Farm Group *
                    </label>
                    <select
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">Select a group…</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} · {g.memberCount} member
                          {g.memberCount === 1 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                    {groups.length === 0 && (
                      <p className="mt-1 text-[11px] text-amber-600">
                        No groups yet. Create a group first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---- Farm details ---- */}
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Farm details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Farm Name *"
                value={form.name}
                onChange={(v) => update("name", v)}
                required
                className="sm:col-span-2"
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Farm Type *
                </label>
                <select
                  value={form.farm_type}
                  onChange={(e) => update("farm_type", e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="GROUP">Group</option>
                  <option value="COMMUNAL">Communal</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>
              <Field
                label="Total Area (ha) *"
                type="number"
                value={form.total_area_ha}
                onChange={(v) => update("total_area_ha", v)}
                required
              />
              <Field
                label="Cultivable Area (ha)"
                type="number"
                value={form.cultivable_ha}
                onChange={(v) => update("cultivable_ha", v)}
              />
              <Field
                label="Latitude"
                value={form.latitude}
                onChange={(v) => update("latitude", v)}
                placeholder="e.g. 10.5222"
              />
              <Field
                label="Longitude"
                value={form.longitude}
                onChange={(v) => update("longitude", v)}
                placeholder="e.g. 7.4383"
              />
              <Field
                label="Soil Type"
                value={form.soil_type}
                onChange={(v) => update("soil_type", v)}
                placeholder="e.g. Loamy"
              />
              <Field
                label="Soil pH"
                type="number"
                value={form.soil_ph}
                onChange={(v) => update("soil_ph", v)}
                placeholder="e.g. 6.5"
              />
              <Field
                label="Irrigation Type"
                value={form.irrigation_type}
                onChange={(v) => update("irrigation_type", v)}
                placeholder="e.g. Drip, Sprinkler"
              />
              <Field
                label="Irrigation Source"
                value={form.irrigation_source}
                onChange={(v) => update("irrigation_source", v)}
                placeholder="e.g. Borehole"
              />
              <Field
                label="Current Crop"
                value={form.current_crop}
                onChange={(v) => update("current_crop", v)}
                placeholder="e.g. Maize"
              />
              <Field
                label="Crop Variety"
                value={form.crop_variety}
                onChange={(v) => update("crop_variety", v)}
                placeholder="e.g. SC 651"
              />
              <Field
                label="Planting Date"
                type="date"
                value={form.planting_date}
                onChange={(v) => update("planting_date", v)}
              />
              <Field
                label="Expected Harvest"
                type="date"
                value={form.expected_harvest}
                onChange={(v) => update("expected_harvest", v)}
              />
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
                    Create Farm
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
// FARM DETAIL MODAL
// ============================================================

function FarmDetailModal({
  farm,
  user,
  onClose,
  onChanged,
}: {
  farm: Farm;
  user: Props["user"];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const next = farm.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/dashboard/farms/${farm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      onChanged();
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
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-lg font-semibold text-emerald-700">
              {farm.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{farm.name}</h2>
              <p className="text-xs text-slate-500">
                {farm.farmType.replace("_", " ")} · {farm.totalAreaHa} ha
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

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <DetailRow
            icon={farm.group ? Users : UserIcon}
            label="Assigned to"
            value={
              farm.group
                ? `Group · ${farm.group.name}`
                : farm.owner
                  ? `${farm.owner.name} · ${farm.owner.email}`
                  : "Unassigned"
            }
          />
          {farm.group && (
            <DetailRow
              icon={Users}
              label="Group type"
              value={farm.group.groupType}
            />
          )}
          {farm.owner?.organizationId && (
            <DetailRow
              icon={Building2}
              label="Organization"
              value={farm.owner.organizationId}
            />
          )}
          <DetailRow
            icon={MapPin}
            label="Location"
            value={
              farm.latitude && farm.longitude
                ? `${farm.latitude}, ${farm.longitude}`
                : "No coordinates"
            }
          />
          <DetailRow
            icon={Sprout}
            label="Total area"
            value={`${farm.totalAreaHa} ha${
              farm.cultivableHa
                ? ` · cultivable ${farm.cultivableHa} ha`
                : ""
            }`}
          />
          {farm.soilType && (
            <DetailRow
              icon={Sprout}
              label="Soil"
              value={`${farm.soilType}${
                farm.soilPh ? ` · pH ${farm.soilPh}` : ""
              }`}
            />
          )}
          {farm.irrigationType && (
            <DetailRow
              icon={CloudSun}
              label="Irrigation"
              value={`${farm.irrigationType}${
                farm.irrigationSource ? ` · ${farm.irrigationSource}` : ""
              }`}
            />
          )}
          {farm.currentCrop && (
            <DetailRow
              icon={Sprout}
              label="Current crop"
              value={`${farm.currentCrop}${
                farm.cropVariety ? ` · ${farm.cropVariety}` : ""
              }`}
            />
          )}
          {farm.plantingDate && (
            <DetailRow
              icon={Calendar}
              label="Planting date"
              value={new Date(farm.plantingDate).toLocaleDateString()}
            />
          )}
          {farm.expectedHarvest && (
            <DetailRow
              icon={Calendar}
              label="Expected harvest"
              value={new Date(farm.expectedHarvest).toLocaleDateString()}
            />
          )}

          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              icon={Layers}
              label="Fields"
              value={farm.counts.fields}
            />
            <MiniStat icon={Cpu} label="Devices" value={farm.counts.devices} />
            <MiniStat
              icon={CloudSun}
              label="Stations"
              value={farm.counts.weatherStations}
            />
          </div>

          {(user.isSuperAdmin || user.isAdmin) && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={toggleStatus}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                    farm.status === "ACTIVE"
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : farm.status === "ACTIVE" ? (
                    <Ban className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {farm.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
                <Link
                  href={`/dashboard/farms/${farm.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3 w-3" />
                  Open full page
                </Link>
              </div>
            </div>
          )}
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
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-slate-400" />
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
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