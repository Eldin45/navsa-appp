"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  TrendingDown,
  Layers,
  Boxes,
  Hash,
  Tag,
  Warehouse,
  DollarSign,
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
  };
}

interface InventoryItem {
  id: string;
  itemType: string;
  itemName: string;
  itemCode: string | null;
  description: string | null;
  manufacturer: string | null;
  unitType: string;
  unitCost: number | null;
  currency: string;
  currentStock: number;
  minStock: number | null;
  reorderPoint: number | null;
  storageRequirements: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isLowStock: boolean;
}

interface InventoryResponse {
  items: InventoryItem[];
  categories: string[];
  types: string[];
  summary: {
    totalItems: number;
    totalStock: number;
    lowStockCount: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// COMMON INPUT TYPES
// ============================================================

const ITEM_TYPES = [
  "SEED",
  "FERTILIZER",
  "PESTICIDE",
  "HERBICIDE",
  "FUNGICIDE",
  "TOOL",
  "EQUIPMENT",
  "FEED",
  "OTHER",
];

const UNIT_TYPES = [
  "KG",
  "G",
  "L",
  "ML",
  "BAG",
  "SACK",
  "PIECE",
  "PACK",
  "BOTTLE",
  "CARTON",
];

// ============================================================
// MAIN
// ============================================================

export default function InventoryClient({ user }: Props) {
  const router = useRouter();

  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch list
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (activeFilter !== "ALL") params.set("active", activeFilter === "ACTIVE" ? "true" : "false");
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/dashboard/inventory?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Failed to load inventory");
      setData(json.data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, categoryFilter, typeFilter, activeFilter, page]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage the items you supply — pricing, stock, and reorder points.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Items"
          value={summary?.totalItems ?? 0}
          icon={Boxes}
          color="primary"
        />
        <StatCard
          label="Total Stock"
          value={(summary?.totalStock ?? 0).toLocaleString()}
          icon={Warehouse}
          color="info"
        />
        <StatCard
          label="Low Stock"
          value={summary?.lowStockCount ?? 0}
          icon={TrendingDown}
          color={summary?.lowStockCount ? "warning" : "success"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, manufacturer…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All types</option>
            {(data?.types ?? ITEM_TYPES).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All categories</option>
            {(data?.categories ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Reorder</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      No inventory items yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add your first item so farmers can request it.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-slate-900">
                            {item.itemName}
                          </span>
                          {item.isLowStock && (
                            <span
                              title="Low stock"
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                            >
                              <TrendingDown className="h-3 w-3" />
                              Low
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                          {item.itemCode && (
                            <span className="inline-flex items-center gap-0.5">
                              <Hash className="h-3 w-3" />
                              {item.itemCode}
                            </span>
                          )}
                          {item.manufacturer && (
                            <span>· {item.manufacturer}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.itemType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.unitCost != null ? (
                        <span className="font-medium text-slate-900">
                          {item.currency} {item.unitCost.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      <div className="text-[10px] text-slate-500">
                        per {item.unitType}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={`font-medium ${
                          item.isLowStock ? "text-amber-700" : "text-slate-900"
                        }`}
                      >
                        {item.currentStock.toLocaleString()}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {item.unitType}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600">
                      {item.reorderPoint ?? item.minStock ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <PowerOff className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActions
                        item={item}
                        onEdit={() => setEditTarget(item)}
                        onChanged={load}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Page <strong className="text-slate-900">{data.pagination.page}</strong>{" "}
              of {data.pagination.totalPages} · {data.pagination.total.toLocaleString()} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    data.pagination.totalPages
                      ? Math.min(data.pagination.totalPages, p + 1)
                      : p
                  )
                }
                disabled={page >= data.pagination.totalPages}
                className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <InventoryItemModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editTarget && (
        <InventoryItemModal
          mode="edit"
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// ROW ACTIONS
// ============================================================

function RowActions({
  item,
  onEdit,
  onChanged,
}: {
  item: InventoryItem;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const toggleActive = async () => {
    setBusy("toggle");
    setError("");
    try {
      const res = await fetch(`/api/dashboard/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to update");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${item.itemName}"? This cannot be undone.`)) return;
    setBusy("delete");
    setError("");
    try {
      const res = await fetch(`/api/dashboard/inventory/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to delete");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {error && (
        <span className="text-[10px] text-red-600" title={error}>
          Error
        </span>
      )}
      <button
        onClick={onEdit}
        disabled={busy !== null}
        title="Edit"
        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={toggleActive}
        disabled={busy !== null}
        title={item.isActive ? "Deactivate" : "Activate"}
        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {busy === "toggle" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : item.isActive ? (
          <PowerOff className="h-3.5 w-3.5" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        onClick={remove}
        disabled={busy !== null}
        title="Delete"
        className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {busy === "delete" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: "primary" | "success" | "warning" | "info";
}) {
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
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 ${s.chip} ${s.ring}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

// ============================================================
// CREATE / EDIT MODAL
// ============================================================

function InventoryItemModal({
  mode,
  item,
  onClose,
  onSuccess,
}: {
  mode: "create" | "edit";
  item?: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    item_name: item?.itemName ?? "",
    item_type: item?.itemType ?? "SEED",
    item_code: item?.itemCode ?? "",
    description: item?.description ?? "",
    manufacturer: item?.manufacturer ?? "",
    unit_type: item?.unitType ?? "KG",
    unit_cost: item?.unitCost != null ? String(item.unitCost) : "",
    currency: item?.currency ?? "NGN",
    current_stock: item?.currentStock != null ? String(item.currentStock) : "0",
    min_stock: item?.minStock != null ? String(item.minStock) : "",
    reorder_point:
      item?.reorderPoint != null ? String(item.reorderPoint) : "",
    storage_requirements: item?.storageRequirements ?? "",
    category: item?.category ?? "",
    is_active: item?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        item_name: form.item_name.trim(),
        item_type: form.item_type.trim(),
        item_code: form.item_code.trim() || undefined,
        description: form.description.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined,
        unit_type: form.unit_type,
        unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
        currency: form.currency,
        current_stock: form.current_stock ? Number(form.current_stock) : 0,
        min_stock: form.min_stock ? Number(form.min_stock) : undefined,
        reorder_point: form.reorder_point
          ? Number(form.reorder_point)
          : undefined,
        storage_requirements: form.storage_requirements.trim() || undefined,
        category: form.category.trim() || undefined,
        is_active: form.is_active,
      };

      const url =
        mode === "create"
          ? "/api/dashboard/inventory"
          : `/api/dashboard/inventory/${item!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to save");
      onSuccess();
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
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === "create" ? "Add inventory item" : "Edit item"}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "create"
                  ? "List a new item with its price and stock."
                  : "Update price, stock, and details."}
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
          onSubmit={submit}
          className="max-h-[75vh] overflow-y-auto px-6 py-5"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Section: Identification */}
          <Section title="Identification" icon={Tag}>
            <Field
              label="Item Name *"
              value={form.item_name}
              onChange={(v) => update("item_name", v)}
              required
              placeholder="e.g. NPK 20-10-10 Fertilizer"
            />
            <SelectField
              label="Item Type *"
              value={form.item_type}
              onChange={(v) => update("item_type", v)}
              options={ITEM_TYPES.map((t) => ({
                value: t,
                label: t.replace(/_/g, " "),
              }))}
            />
            <Field
              label="Item Code"
              value={form.item_code}
              onChange={(v) => update("item_code", v)}
              placeholder="e.g. FERT-NPK-20"
            />
            <Field
              label="Manufacturer"
              value={form.manufacturer}
              onChange={(v) => update("manufacturer", v)}
              placeholder="e.g. Dangote"
            />
            <Field
              label="Category"
              value={form.category}
              onChange={(v) => update("category", v)}
              placeholder="e.g. Fertilizers"
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </Section>

          {/* Section: Pricing & Stock */}
          <Section title="Pricing & Stock" icon={DollarSign}>
            <Field
              label="Unit Cost *"
              type="number"
              value={form.unit_cost}
              onChange={(v) => update("unit_cost", v)}
              placeholder="e.g. 25000"
            />
            <Field
              label="Currency"
              value={form.currency}
              onChange={(v) => update("currency", v)}
            />
            <SelectField
              label="Unit Type *"
              value={form.unit_type}
              onChange={(v) => update("unit_type", v)}
              options={UNIT_TYPES.map((u) => ({ value: u, label: u }))}
            />
            <Field
              label="Current Stock *"
              type="number"
              value={form.current_stock}
              onChange={(v) => update("current_stock", v)}
            />
            <Field
              label="Minimum Stock"
              type="number"
              value={form.min_stock}
              onChange={(v) => update("min_stock", v)}
              placeholder="Alert threshold"
            />
            <Field
              label="Reorder Point"
              type="number"
              value={form.reorder_point}
              onChange={(v) => update("reorder_point", v)}
              placeholder="When to reorder"
            />
          </Section>

          {/* Section: Storage & Status */}
          <Section title="Storage & Status" icon={Warehouse}>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Storage Requirements
              </label>
              <textarea
                value={form.storage_requirements}
                onChange={(e) =>
                  update("storage_requirements", e.target.value)
                }
                rows={2}
                placeholder="e.g. Keep dry, away from direct sunlight"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                />
                Active (visible for farmer requests)
              </label>
            </div>
          </Section>

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
                  Saving…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {mode === "create" ? "Add item" : "Save changes"}
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
// SMALL PARTS
// ============================================================

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}