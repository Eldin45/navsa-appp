"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  ChevronRight,
  Truck,
  Package,
  Clock,
  Ban,
  MapPin,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  History,
  Info,
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

interface OrderItem {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  totalPrice: number | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderedDate: string;
  expectedDelivery: string | null;
  deliveredAt: string | null;
  totalAmount: number;
  currency: string;
  deliveryAddress: string | null;
  trackingNumber: string | null;
  notes: string | null;
  farmer: { id: string; full_name: string; email: string; phone: string | null };
  request: {
    id: string;
    requestNumber: string;
    items: OrderItem[];
  };
}

interface OrdersResponse {
  items: Order[];
  summary: {
    pending: number;
    accepted: number;
    processing: number;
    dispatched: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
    total: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

type StatusKey =
  | "ALL"
  | "PENDING"
  | "ACCEPTED"
  | "PROCESSING"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-100",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-100",
  DISPATCHED: "bg-sky-50 text-sky-700 border-sky-100",
  IN_TRANSIT: "bg-purple-50 text-purple-700 border-purple-100",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-red-50 text-red-700 border-red-100",
};

const STATUS_ICON: Record<string, any> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle2,
  PROCESSING: Package,
  DISPATCHED: Truck,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: Ban,
};

// ============================================================
// MAIN
// ============================================================

export default function OrdersClient({ user }: Props) {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("ALL");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updateTarget, setUpdateTarget] = useState<Order | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/dashboard/orders?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Failed to load orders");
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
  }, [debounced, statusFilter, page]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approved input requests waiting for you to fulfil.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Pending"
          value={summary?.pending ?? 0}
          icon={Clock}
          color="warning"
          active={statusFilter === "PENDING"}
          onClick={() => {
            setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING");
            setPage(1);
          }}
        />
        <StatCard
          label="In Progress"
          value={
            (summary?.accepted ?? 0) +
            (summary?.processing ?? 0) +
            (summary?.dispatched ?? 0) +
            (summary?.inTransit ?? 0)
          }
          icon={Truck}
          color="info"
        />
        <StatCard
          label="Delivered"
          value={summary?.delivered ?? 0}
          icon={CheckCircle2}
          color="success"
          active={statusFilter === "DELIVERED"}
          onClick={() => {
            setStatusFilter(statusFilter === "DELIVERED" ? "ALL" : "DELIVERED");
            setPage(1);
          }}
        />
        <StatCard
          label="Cancelled"
          value={summary?.cancelled ?? 0}
          icon={Ban}
          color="danger"
          active={statusFilter === "CANCELLED"}
          onClick={() => {
            setStatusFilter(statusFilter === "CANCELLED" ? "ALL" : "CANCELLED");
            setPage(1);
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order #, request #, farmer, tracking…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusKey);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PROCESSING">Processing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="IN_TRANSIT">In transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center">
          <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No orders found</p>
          <p className="mt-1 text-xs text-slate-500">
            {statusFilter === "ALL"
              ? "Orders appear when farmers' input requests are approved and routed to you."
              : "Try clearing the filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expandedId === o.id}
              onToggle={() =>
                setExpandedId(expandedId === o.id ? null : o.id)
              }
              onUpdate={() => setUpdateTarget(o)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <span>
            Page{" "}
            <strong className="text-slate-900">{data.pagination.page}</strong>{" "}
            of {data.pagination.totalPages} ·{" "}
            {data.pagination.total.toLocaleString()} total
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

      {/* Update modal */}
      {updateTarget && (
        <UpdateOrderModal
          order={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSuccess={() => {
            setUpdateTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// ORDER CARD
// ============================================================

function OrderCard({
  order,
  expanded,
  onToggle,
  onUpdate,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}) {
  const Icon = STATUS_ICON[order.status] ?? Package;
  const totalQty = order.request.items.reduce(
    (s, it) => s + it.quantity,
    0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-900">
                {order.orderNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  STATUS_STYLE[order.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-3 w-3" />
                {order.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-2">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Request: {order.request.requestNumber}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(order.orderedDate).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1">
                Farmer: {order.farmer.full_name}
              </span>
              {order.trackingNumber && (
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Tracking: {order.trackingNumber}
                </span>
              )}
              {order.deliveryAddress && (
                <span className="inline-flex items-start gap-1 sm:col-span-2">
                  <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  {order.deliveryAddress}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">
                {order.currency} {order.totalAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                {order.request.items.length} item
                {order.request.items.length === 1 ? "" : "s"} ·{" "}
                {totalQty.toLocaleString()} total units
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {expanded ? (
                  <>
                    Hide <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Details <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>

              {!["DELIVERED", "CANCELLED"].includes(order.status) && (
                <button
                  onClick={onUpdate}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Update
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Items
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.request.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {it.itemName}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {it.itemType.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {it.unitPrice != null
                        ? `${order.currency} ${it.unitPrice.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900">
                      {it.totalPrice != null
                        ? `${order.currency} ${it.totalPrice.toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.notes && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <div>
                <div className="font-medium text-slate-800">Notes</div>
                <div className="mt-0.5">{order.notes}</div>
              </div>
            </div>
          )}

          <OrderTimeline orderId={order.id} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ORDER TIMELINE
// ============================================================

function OrderTimeline({ orderId }: { orderId: string }) {
  const [history, setHistory] = useState<
    | Array<{
        id: string;
        fromStatus: string | null;
        toStatus: string;
        reason: string | null;
        changedAt: string;
      }>
    | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/dashboard/orders/${orderId}/history`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.success) setHistory(j.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) return null;
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <History className="h-3 w-3" />
        Status history
      </div>
      <ul className="space-y-2">
        {history.map((h) => (
          <li
            key={h.id}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          >
            <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-2.5 w-2.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-slate-800">
                {h.fromStatus ? `${h.fromStatus.replace(/_/g, " ")} → ` : ""}
                <strong>{h.toStatus.replace(/_/g, " ")}</strong>
              </div>
              {h.reason && (
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {h.reason}
                </div>
              )}
              <div className="mt-0.5 text-[10px] text-slate-400">
                {new Date(h.changedAt).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// UPDATE MODAL
// ============================================================

function UpdateOrderModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const nextStatuses = getAllowedNextStatuses(order.status);

  const [form, setForm] = useState({
    status: nextStatuses[0] ?? order.status,
    expected_delivery: order.expectedDelivery
      ? order.expectedDelivery.slice(0, 16)
      : "",
    tracking_number: order.trackingNumber ?? "",
    notes: order.notes ?? "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = {};
      if (form.status !== order.status) payload.status = form.status;
      if (form.expected_delivery)
        payload.expected_delivery = new Date(
          form.expected_delivery
        ).toISOString();
      if (form.tracking_number !== (order.trackingNumber ?? ""))
        payload.tracking_number = form.tracking_number || null;
      if (form.notes !== (order.notes ?? ""))
        payload.notes = form.notes || null;
      if (form.reason) payload.reason = form.reason;

      const res = await fetch(`/api/dashboard/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to update");
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
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Update order</h2>
            <p className="text-xs text-slate-500 font-mono">
              {order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {nextStatuses.length > 0 ? (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Next status *
              </label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Current status:{" "}
                <strong>{order.status.replace(/_/g, " ")}</strong>
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              This order is {order.status.toLowerCase()} and cannot be changed.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Expected delivery
              </label>
              <input
                type="datetime-local"
                value={form.expected_delivery}
                onChange={(e) => update("expected_delivery", e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tracking number
              </label>
              <input
                value={form.tracking_number}
                onChange={(e) => update("tracking_number", e.target.value)}
                placeholder="e.g. ABC123456"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            {form.status !== order.status && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Reason (optional)
                </label>
                <input
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  placeholder="Reason for status change"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </div>
            )}
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
                  Saving…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Save
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
// HELPERS
// ============================================================

function getAllowedNextStatuses(current: string): string[] {
  switch (current) {
    case "PENDING":
      return ["ACCEPTED", "CANCELLED"];
    case "ACCEPTED":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return ["DISPATCHED", "CANCELLED"];
    case "DISPATCHED":
      return ["IN_TRANSIT"];
    case "IN_TRANSIT":
      return ["DELIVERED"];
    default:
      return [];
  }
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
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  color: "primary" | "success" | "warning" | "info" | "danger";
  active?: boolean;
  onClick?: () => void;
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
    danger: {
      ring: "ring-red-100",
      chip: "bg-red-50 text-red-600",
      bar: "bg-red-500",
    },
  } as const;

  const s = styles[color];

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition ${
        onClick ? "hover:shadow-md" : ""
      } ${active ? "ring-2 ring-emerald-300 ring-offset-1" : ""}`}
    >
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
    </Comp>
  );
}