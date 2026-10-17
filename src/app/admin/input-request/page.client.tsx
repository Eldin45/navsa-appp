// src/app/admin/input-requests/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
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
  User,
  Package,
} from "lucide-react";

type RequestStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FUNDED"
  | "ORDERED"
  | "DELIVERED"
  | "CANCELLED";

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
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    organization: { id: string; name: string } | null;
  };
  items: Array<{
    id: string;
    itemName: string;
    itemType: string;
    quantity: number;
    unit: string;
    unitPrice: number | null;
    totalPrice: number | null;
  }>;
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
  };
  requests: RequestRow[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    funded: number;
    rejected: number;
    totalAmount: number;
  };
}

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
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    danger: "bg-red-50 text-red-600 border-red-100",
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
};

export default function InputRequestsClient({ user, requests, stats }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.requestNumber.toLowerCase().includes(q) ||
        r.farmer.name.toLowerCase().includes(q) ||
        r.farmer.email.toLowerCase().includes(q) ||
        (r.farmer.organization?.name ?? "").toLowerCase().includes(q)
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
      "Organization",
      "Status",
      "Amount",
      "Requested",
      "Needed By",
    ].join(",");
    const rows = filtered.map((r) =>
      [
        r.requestNumber,
        r.farmer.name,
        r.farmer.organization?.name ?? "",
        r.status,
        r.totalAmount,
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Input Requests</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approve and fund input requests submitted by farmers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} color="primary" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="info" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="warning" />
        <StatCard label="Funded" value={stats.funded} icon={Banknote} color="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="danger" />
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
            placeholder="Search by request #, farmer, email, organization…"
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
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No requests found</p>
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
                        {r.farmer.organization && (
                          <span className="block text-xs text-slate-500">
                            {r.farmer.organization.name}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-slate-900">{r.farmer.name}</div>
                      <div className="text-xs text-slate-500">{r.farmer.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-slate-400" />
                        {r.items.length} item{r.items.length === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₦{r.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.requestedDate).toLocaleDateString()}
                      </div>
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
      </div>

      {selected && (
        <RequestDetailModal
          request={selected}
          user={user}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// REQUEST DETAIL MODAL
// ============================================================

function RequestDetailModal({
  request,
  user,
  onClose,
  onUpdated,
}: {
  request: RequestRow;
  user: { isSuperAdmin: boolean };
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDecide = user.isSuperAdmin;

  const submit = async () => {
    if (!action) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/input-requests/${request.id}/${action === "APPROVE" ? "approve" : "reject"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      onUpdated();
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
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[request.status]}`}
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
              <div className="font-medium text-slate-900">{request.farmer.name}</div>
              <div className="text-xs text-slate-500">{request.farmer.email}</div>
              {request.farmer.phone && (
                <div className="text-xs text-slate-500">{request.farmer.phone}</div>
              )}
              {request.farmer.organization && (
                <div className="mt-1 text-xs text-slate-500">
                  Org: {request.farmer.organization.name}
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
                        <div className="font-medium text-slate-900">{i.itemName}</div>
                        <div className="text-xs text-slate-500">{i.itemType}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {i.quantity} {i.unit}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {i.unitPrice != null ? `₦${i.unitPrice.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">
                        {i.totalPrice != null ? `₦${i.totalPrice.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-sm">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium text-slate-600">
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

          {/* Metadata */}
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
                <div className="mt-0.5 text-slate-900">{request.approvedBy.name}</div>
              </div>
            )}
            {request.fundedBy && (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Funded by
                </div>
                <div className="mt-0.5 text-slate-900">{request.fundedBy.name}</div>
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
                Farmer Notes
              </div>
              <p className="mt-1 whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <div className="text-[10px] uppercase tracking-wider">Reason</div>
              <p className="mt-1 whitespace-pre-wrap">{request.rejectionReason}</p>
            </div>
          )}

          {/* Decision */}
          {canDecide && (request.status === "PENDING" || request.status === "APPROVED") && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Decision
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <DecisionBtn
                  active={action === "APPROVE"}
                  onClick={() => setAction("APPROVE")}
                  icon={Check}
                  label={request.status === "APPROVED" ? "Fund" : "Approve"}
                  variant="success"
                />
                <DecisionBtn
                  active={action === "REJECT"}
                  onClick={() => setAction("REJECT")}
                  icon={Ban}
                  label="Reject"
                  variant="danger"
                />
              </div>

              {action && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={action === "REJECT" ? "Reason for rejection…" : "Optional notes…"}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                />
              )}
            </div>
          )}

          {!canDecide && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
              Only Super Admins can approve or reject input requests.
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
  const base = "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition";
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