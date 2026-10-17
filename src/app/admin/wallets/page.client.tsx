// src/app/admin/wallets/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Wallet,
  Download,
  Filter,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Snowflake,
  CheckCircle2,
  Ban,
  Building2,
  Calendar,
  ArrowDownUp,
  Banknote,
  TrendingUp,
} from "lucide-react";

type WalletType =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FARMER_CLOSED"
  | "FARMER_OPEN"
  | "SUPPLIER";

interface WalletRow {
  id: string;
  type: WalletType;
  accountNumber: string;
  accountName: string;
  bankName: string;
  balance: number;
  availableBalance: number;
  ledgerBalance: number;
  currency: string;
  status: string;
  isFrozen: boolean;
  frozenReason: string | null;
  palmPayAccountNumber: string | null;
  palmPayAccountName: string | null;
  palmPayBankName: string | null;
  palmPayStatus: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: { id: string; name: string } | null;
  };
  counts: {
    transactions: number;
    funding: number;
    withdrawals: number;
  };
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
  };
  wallets: WalletRow[];
  stats: {
    total: number;
    totalBalance: number;
    totalAvailable: number;
    totalLedger: number;
    palmPayActive: number;
    palmPayFailed: number;
    frozen: number;
  };
}

const TYPE_STYLE: Record<WalletType, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700 border-purple-100",
  ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-100",
  FARMER_CLOSED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  FARMER_OPEN: "bg-sky-50 text-sky-700 border-sky-100",
  SUPPLIER: "bg-amber-50 text-amber-700 border-amber-100",
};

const TYPE_LABEL: Record<WalletType, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FARMER_CLOSED: "Farmer Closed",
  FARMER_OPEN: "Farmer Open",
  SUPPLIER: "Supplier",
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  hint,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: "primary" | "success" | "warning" | "danger" | "info";
  hint?: string;
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
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
};

export default function WalletsClient({ user, wallets, stats }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<WalletType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "FROZEN" | "CLOSED">("ALL");
  const [vpaFilter, setVpaFilter] = useState<"ALL" | "ACTIVE" | "FAILED" | "PENDING">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return wallets.filter((w) => {
      if (typeFilter !== "ALL" && w.type !== typeFilter) return false;
      if (statusFilter === "FROZEN" && !w.isFrozen) return false;
      if (statusFilter === "ACTIVE" && (w.isFrozen || w.status !== "ACTIVE")) return false;
      if (statusFilter === "CLOSED" && w.status !== "CLOSED") return false;
      if (vpaFilter !== "ALL" && (w.palmPayStatus ?? "PENDING") !== vpaFilter) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        w.user.name.toLowerCase().includes(q) ||
        w.user.email.toLowerCase().includes(q) ||
        w.accountNumber.toLowerCase().includes(q) ||
        (w.palmPayAccountNumber ?? "").includes(q) ||
        (w.user.organization?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [wallets, query, typeFilter, statusFilter, vpaFilter]);

  const selected = selectedId
    ? wallets.find((w) => w.id === selectedId) ?? null
    : null;

  const downloadCSV = () => {
    const header = [
      "User",
      "Email",
      "Role",
      "Organization",
      "Wallet Type",
      "Account #",
      "PalmPay VA",
      "PalmPay Status",
      "Balance",
      "Available",
      "Status",
      "Created",
    ].join(",");
    const rows = filtered.map((w) =>
      [
        w.user.name,
        w.user.email,
        w.user.role,
        w.user.organization?.name ?? "",
        w.type,
        w.accountNumber,
        w.palmPayAccountNumber ?? "",
        w.palmPayStatus ?? "",
        w.balance,
        w.availableBalance,
        w.status,
        w.createdAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {user.isSuperAdmin ? "Platform Wallets" : "Organization Wallets"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {user.isSuperAdmin
            ? "All wallets across the platform."
            : "Wallets belonging to your organization's members."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Wallets" value={stats.total} icon={Wallet} color="primary" />
        <StatCard
          label="Total Balance"
          value={`₦${stats.totalBalance.toLocaleString()}`}
          icon={Banknote}
          color="success"
          hint={`Available: ₦${stats.totalAvailable.toLocaleString()}`}
        />
        <StatCard
          label="PalmPay Active"
          value={stats.palmPayActive}
          icon={TrendingUp}
          color="info"
          hint={`${stats.palmPayFailed} failed`}
        />
        <StatCard
          label="Frozen"
          value={stats.frozen}
          icon={Snowflake}
          color={stats.frozen > 0 ? "danger" : "success"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, email, account number, organization…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All types</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="FARMER_CLOSED">Farmer Closed</option>
            <option value="FARMER_OPEN">Farmer Open</option>
            <option value="SUPPLIER">Supplier</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FROZEN">Frozen</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={vpaFilter}
            onChange={(e) => setVpaFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            <option value="ALL">All PalmPay</option>
            <option value="ACTIVE">VA Active</option>
            <option value="PENDING">VA Pending</option>
            <option value="FAILED">VA Failed</option>
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
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">PalmPay VA</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <Wallet className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No wallets found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedId(w.id)}
                        className="group flex items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white">
                          {w.user.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {w.user.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {w.user.organization?.name ?? w.user.email}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[w.type]}`}
                      >
                        {TYPE_LABEL[w.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {w.accountNumber}
                    </td>
                    <td className="px-4 py-3">
                      {w.palmPayAccountNumber ? (
                        <div>
                          <div className="font-mono text-xs text-slate-700">
                            {w.palmPayAccountNumber}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                w.palmPayStatus === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : w.palmPayStatus === "FAILED"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {w.palmPayStatus ?? "PENDING"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not provisioned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₦{w.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {w.isFrozen ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          <Snowflake className="h-3 w-3" />
                          Frozen
                        </span>
                      ) : w.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Ban className="h-3 w-3" />
                          {w.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedId(w.id)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        View
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
        <WalletDetailModal
          wallet={selected}
          onClose={() => setSelectedId(null)}
          onAction={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// WALLET DETAIL MODAL
// ============================================================

function WalletDetailModal({
  wallet,
  onClose,
  onAction,
}: {
  wallet: WalletRow;
  onClose: () => void;
  onAction: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"freeze" | "unfreeze" | null>(null);
  const [error, setError] = useState("");

  const doAction = async (action: "freeze" | "unfreeze") => {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/wallets/${wallet.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Action failed");
      onAction();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{wallet.accountName}</h2>
              <p className="text-xs text-slate-500 font-mono">{wallet.accountNumber}</p>
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

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Balance"
              value={`₦${wallet.balance.toLocaleString()}`}
              color="emerald"
            />
            <Stat
              label="Available"
              value={`₦${wallet.availableBalance.toLocaleString()}`}
              color="sky"
            />
          </div>

          <DetailRow label="Owner" value={wallet.user.name} />
          <DetailRow label="Email" value={wallet.user.email} />
          <DetailRow label="Role" value={wallet.user.role} />
          <DetailRow label="Wallet Type" value={TYPE_LABEL[wallet.type]} />
          <DetailRow
            label="Status"
            value={wallet.isFrozen ? `Frozen${wallet.frozenReason ? ` — ${wallet.frozenReason}` : ""}` : wallet.status}
          />
          {wallet.user.organization && (
            <DetailRow label="Organization" value={wallet.user.organization.name} />
          )}

          {wallet.palmPayAccountNumber ? (
            <>
              <DetailRow label="PalmPay VA" value={wallet.palmPayAccountNumber} />
              <DetailRow label="PalmPay Bank" value={wallet.palmPayBankName ?? "—"} />
              <DetailRow label="PalmPay Status" value={wallet.palmPayStatus ?? "PENDING"} />
            </>
          ) : (
            <DetailRow label="PalmPay VA" value="Not provisioned" />
          )}

          <div className="grid grid-cols-3 gap-2">
            <SmallStat label="Transactions" value={wallet.counts.transactions} />
            <SmallStat label="Fundings" value={wallet.counts.funding} />
            <SmallStat label="Withdrawals" value={wallet.counts.withdrawals} />
          </div>

          {/* Freeze / Unfreeze */}
          {!wallet.isFrozen ? (
            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                Freeze Wallet
              </h3>
              <p className="mt-1 text-xs text-sky-600">
                Frozen wallets cannot send or receive funds.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Reason for freezing…"
                className="mt-3 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none"
              />
              <button
                onClick={() => doAction("freeze")}
                disabled={loading !== null || !notes.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {loading === "freeze" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Snowflake className="h-3 w-3" />
                )}
                Freeze Wallet
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Wallet Frozen
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                This wallet is currently frozen. Unfreezing will restore full access.
              </p>
              <button
                onClick={() => doAction("unfreeze")}
                disabled={loading !== null}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading === "unfreeze" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Unfreeze Wallet
              </button>
            </div>
          )}

          {/* Link to transactions */}
          <Link
            href={`/admin/wallets/${wallet.id}/transactions`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowDownUp className="h-3 w-3" />
            View Transactions
          </Link>
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

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "sky";
}) {
  const styles =
    color === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-sky-50 text-sky-700";
  return (
    <div className={`rounded-lg p-3 ${styles}`}>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-center">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm">
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-right text-slate-900 break-words">{value}</span>
    </div>
  );
}