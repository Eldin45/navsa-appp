// src/app/dashboard/input-requests/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ClipboardList,
  Plus,
  Download,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Check,
  Ban,
  Send,
  Calendar,
  Package,
  Trash2,
  PlusCircle,
  User as UserIcon,
  Building2,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type RequestStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FUNDED"
  | "ORDERED"
  | "DELIVERED"
  | "CANCELLED";

interface RequestItem {
  id: string;
  inventoryId: string | null;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  totalPrice: number | null;
  notes: string | null;
}

interface RequestRow {
  id: string;
  requestNumber: string;
  farmerId: string;
  farmId: string | null;
  cycleId: string | null;
  status: RequestStatus;
  requestedDate: string;
  neededByDate: string | null;
  totalAmount: number;
  currency: string;
  notes: string | null;
  approvedAt: string | null;
  approvedBy: { id: string; name: string } | null;
  rejectionReason: string | null;
  fundedAt: string | null;
  fundedBy: { id: string; name: string } | null;
  fundedAmount: number | null;
  fundedFromWallet: {
    id: string;
    accountNumber: string;
    type: string;
  } | null;
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    organizationId: string | null;
  };
  items: RequestItem[];
}

interface FarmerOption {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organizationId: string | null;
}

interface FarmOption {
  id: string;
  name: string;
  userId: string;
  groupId: string | null;
}

interface InventoryOption {
  id: string;
  itemName: string;
  itemType: string;
  unitType: string;
  unitCost: number | null;
  currency: string;
  supplierId: string;
  supplier: {
    id: string;
    businessName: string;
    userId: string;
  } | null;
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
  requests: RequestRow[];
  farmers: FarmerOption[];
  farms: FarmOption[];
  inventory: InventoryOption[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    funded: number;
    rejected: number;
    totalAmount: number;
  };
}

// ============================================================
// STYLES
// ============================================================

const STATUS_STYLE: Record<RequestStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING: "bg-blue-50 text-blue-700",
  APPROVED: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
  FUNDED: "bg-emerald-50 text-emerald-700",
  ORDERED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FUNDED: "Funded",
  ORDERED: "Ordered",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// ============================================================
// STAT CARD
// ============================================================

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
  color: "primary" | "success" | "warning" | "danger" | "info";
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
    danger: {
      ring: "ring-red-100",
      chip: "bg-red-50 text-red-600",
      bar: "bg-red-500",
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

export default function InputRequestsClient({
  user,
  requests,
  farmers,
  farms,
  inventory,
  stats,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">(
    "ALL"
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.requestNumber.toLowerCase().includes(q) ||
        r.farmer.name.toLowerCase().includes(q) ||
        r.farmer.email.toLowerCase().includes(q)
      );
    });
  }, [requests, query, statusFilter]);

  const selected = selectedId
    ? requests.find((r) => r.id === selectedId) ?? null
    : null;

  const downloadCSV = () => {
    const header = [
      "Request #",
      "Farmer",
      "Email",
      "Items",
      "Amount",
      "Status",
      "Requested",
      "Needed By",
    ].join(",");
    const rows = filtered.map((r) =>
      [
        r.requestNumber,
        r.farmer.name,
        r.farmer.email,
        r.items.length,
        r.totalAmount,
        r.status,
        r.requestedDate,
        r.neededByDate ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `input-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Input Requests
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.isSuperAdmin
              ? "All input requests on the platform."
              : user.isAdmin
                ? "Requests from farmers in your organization."
                : "Your input requests."}
          </p>
        </div>

        {(user.isFarmer || user.isAdmin) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} color="primary" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="info" />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle2}
          color="warning"
        />
        <StatCard label="Funded" value={stats.funded} icon={Banknote} color="success" />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="danger"
        />
        <StatCard
          label="Total Value"
          value={`₦${stats.totalAmount.toLocaleString()}`}
          icon={Banknote}
          color="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by request #, farmer, email…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="FUNDED">Funded</option>
            <option value="REJECTED">Rejected</option>
            <option value="ORDERED">Ordered</option>
            <option value="DELIVERED">Delivered</option>
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
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Needed By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No requests found</p>
                    <p className="mt-1 text-xs">
                      Click &quot;New Request&quot; to create one.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className="group text-left"
                      >
                        <span className="block font-mono text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {r.requestNumber}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {new Date(r.requestedDate).toLocaleDateString()}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-slate-900">
                        {r.farmer.name}
                      </div>
                      <div className="text-slate-500">{r.farmer.email}</div>
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {r.items.length}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₦{r.totalAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLE[r.status]
                        }`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {r.neededByDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.neededByDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Review
                      </button>
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
              {requests.length} requests
            </span>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <CreateRequestModal
          user={user}
          farmers={farmers}
          farms={farms}
          inventory={inventory}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Detail / review modal */}
      {selected && (
        <RequestDetailModal
          request={selected}
          user={user}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// CREATE REQUEST MODAL
// ============================================================

interface LineItem {
  inventoryId: string;
  itemName: string;
  itemType: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

function CreateRequestModal({
  user,
  farmers,
  farms,
  inventory,
  onClose,
  onSuccess,
}: {
  user: Props["user"];
  farmers: FarmerOption[];
  farms: FarmOption[];
  inventory: InventoryOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [farmerId, setFarmerId] = useState(
    user.isFarmer ? user.id : farmers[0]?.id ?? ""
  );
  const [farmId, setFarmId] = useState("");
  const [neededByDate, setNeededByDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { inventoryId: "", itemName: "", itemType: "", quantity: "1", unit: "", unitPrice: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Farms belonging to the selected farmer
  const farmerFarms = useMemo(
    () => farms.filter((f) => f.userId === farmerId),
    [farms, farmerId]
  );

  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const updateItem = (i: number, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        inventoryId: "",
        itemName: "",
        itemType: "",
        quantity: "1",
        unit: "",
        unitPrice: "",
      },
    ]);
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const pickInventory = (i: number, invId: string) => {
    const inv = inventory.find((x) => x.id === invId);
    if (!inv) {
      updateItem(i, { inventoryId: "" });
      return;
    }
    updateItem(i, {
      inventoryId: inv.id,
      itemName: inv.itemName,
      itemType: inv.itemType,
      unit: inv.unitType,
      unitPrice: inv.unitCost != null ? String(inv.unitCost) : "",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!farmerId) {
      setError("Please select a farmer.");
      setLoading(false);
      return;
    }

    const cleaned = items
      .filter((it) => it.itemName.trim() && Number(it.quantity) > 0)
      .map((it) => ({
        inventoryId: it.inventoryId || null,
        item_name: it.itemName.trim(),
        item_type: it.itemType.trim() || "OTHER",
        quantity: Number(it.quantity),
        unit: it.unit.trim() || "unit",
        unit_price: it.unitPrice ? Number(it.unitPrice) : null,
      }));

    if (cleaned.length === 0) {
      setError("Add at least one line item.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/input-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId,
          farmId: farmId || null,
          neededByDate: neededByDate || null,
          notes: notes || null,
          items: cleaned,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create request");
      }
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
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                New Input Request
              </h2>
              <p className="text-xs text-slate-500">
                Specify the farmer, farm and line items.
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
                Farmer *
              </label>
              <select
                value={farmerId}
                onChange={(e) => {
                  setFarmerId(e.target.value);
                  setFarmId("");
                }}
                disabled={user.isFarmer}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none disabled:bg-slate-100"
              >
                <option value="">Select a farmer…</option>
                {user.isFarmer ? (
                  <option value={user.id}>{user.name} (you)</option>
                ) : (
                  farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name} · {f.email}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Farm (optional)
              </label>
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              >
                <option value="">Any farm</option>
                {farmerFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Needed by (optional)
              </label>
              <input
                type="date"
                value={neededByDate}
                onChange={(e) => setNeededByDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                placeholder="Anything the approver should know…"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Line items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <PlusCircle className="h-3 w-3" />
                Add item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Inventory item
                    </label>
                    <select
                      value={it.inventoryId}
                      onChange={(e) => pickInventory(i, e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">Custom item…</option>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.itemName} ({inv.itemType})
                          {inv.supplier ? ` · ${inv.supplier.businessName}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Name
                    </label>
                    <input
                      value={it.itemName}
                      onChange={(e) => updateItem(i, { itemName: e.target.value })}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Qty
                    </label>
                    <input                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(i, { quantity: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Unit
                    </label>
                    <input
                      value={it.unit}
                      onChange={(e) => updateItem(i, { unit: e.target.value })}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Unit price
                    </label>
                    <input
                      type="number"
                      value={it.unitPrice}
                      onChange={(e) =>
                        updateItem(i, { unitPrice: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      className="h-9 w-full rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40"
                      title="Remove"
                    >
                      <Trash2 className="mx-auto h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end rounded-lg bg-slate-50 px-4 py-3">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Total
                </div>
                <div className="text-lg font-bold text-slate-900">
                  ₦{total.toLocaleString()}
                </div>
              </div>
            </div>
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
                  Submit Request
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
// DETAIL / REVIEW MODAL
// ============================================================

function RequestDetailModal({
  request,
  user,
  onClose,
  onChanged,
}: {
  request: RequestRow;
  user: Props["user"];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [action, setAction] = useState<"APPROVE" | "REJECT" | "FUND" | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDecide =
    (user.isAdmin || user.isSuperAdmin) &&
    (request.status === "PENDING" || request.status === "APPROVED");

  const submit = async () => {
    if (!action) return;
    setLoading(true);
    setError("");
    try {
      const path =
        action === "APPROVE"
          ? "approve"
          : action === "REJECT"
            ? "reject"
            : "fund";

      const res = await fetch(
        `/api/dashboard/input-requests/${request.id}/${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes,
            reason: notes,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process");
      }
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {request.requestNumber}
              </h2>
              <p className="text-xs text-slate-500">
                Submitted {new Date(request.requestedDate).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLE[request.status]
              }`}
            >
              {STATUS_LABEL[request.status]}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Farmer */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Farmer
            </h3>
            <div className="rounded-lg border border-slate-100 bg-white p-3 text-sm">
              <div className="font-medium text-slate-900">
                {request.farmer.name}
              </div>
              <div className="text-xs text-slate-500">
                {request.farmer.email}
              </div>
              {request.farmer.phone && (
                <div className="text-xs text-slate-500">
                  {request.farmer.phone}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Items
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {request.items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">
                          {i.itemName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {i.itemType}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {i.quantity} {i.unit}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {i.unitPrice != null
                          ? `₦${i.unitPrice.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">
                        {i.totalPrice != null
                          ? `₦${i.totalPrice.toLocaleString()}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-sm">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-2 text-right font-medium text-slate-600"
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900">
                      ₦{request.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Timeline info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {request.neededByDate && (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Needed by
                </div>
                <div className="mt-0.5 text-slate-900">
                  {new Date(request.neededByDate).toLocaleDateString()}
                </div>
              </div>
            )}
            {request.approvedBy && (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Approved by
                </div>
                <div className="mt-0.5 text-slate-900">
                  {request.approvedBy.name}
                </div>
              </div>
            )}
            {request.fundedBy && (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Funded by
                </div>
                <div className="mt-0.5 text-slate-900">
                  {request.fundedBy.name}
                </div>
              </div>
            )}
            {request.fundedAmount != null && (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Funded amount
                </div>
                <div className="mt-0.5 text-slate-900">
                  ₦{request.fundedAmount.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {request.notes && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Farmer notes
              </div>
              <p className="mt-1 whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <div className="text-[10px] uppercase tracking-wider">
                Reason
              </div>
              <p className="mt-1 whitespace-pre-wrap">
                {request.rejectionReason}
              </p>
            </div>
          )}

          {/* Decision */}
          {canDecide && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Decision
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {request.status === "PENDING" && (
                  <>
                    <DecisionBtn
                      active={action === "APPROVE"}
                      onClick={() => setAction("APPROVE")}
                      icon={Check}
                      label="Approve"
                      variant="success"
                    />
                    <DecisionBtn
                      active={action === "REJECT"}
                      onClick={() => setAction("REJECT")}
                      icon={Ban}
                      label="Reject"
                      variant="danger"
                    />
                  </>
                )}
                {request.status === "APPROVED" && (
                  <DecisionBtn
                    active={action === "FUND"}
                    onClick={() => setAction("FUND")}
                    icon={Banknote}
                    label="Fund request"
                    variant="success"
                  />
                )}
              </div>

              {action && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Notes{" "}
                    {action === "REJECT" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder={
                      action === "APPROVE"
                        ? "Optional internal notes"
                        : action === "REJECT"
                          ? "Explain why this request is rejected"
                          : "Optional funding notes"
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {!canDecide && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
              No actions available for this request.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          {canDecide && action && (
            <button
              onClick={submit}
              disabled={loading || (action === "REJECT" && !notes.trim())}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Confirm
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionBtn({
  active,
  onClick,
  icon: Icon,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  variant: "success" | "danger";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition";
  const style =
    variant === "success"
      ? active
        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      : active
        ? "border-red-500 bg-red-50 text-red-700"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button type="button" onClick={onClick} className={`${base} ${style}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}