// src/app/dashboard/wallet/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Download,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  CreditCard,
  Snowflake,
  ShieldCheck,
  X,
  Send,
  RefreshCw,
  ExternalLink,
  Plus,
  Filter,
  User as UserIcon,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface WalletRow {
  id: string;
  userId: string;
  type: string;
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
  kycLevel: number;
  dailyLimit: number;
  monthlyLimit: number;
  singleTxnLimit: number;
  palmPayAccountNumber: string | null;
  palmPayAccountName: string | null;
  palmPayBankName: string | null;
  palmPayStatus: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
  } | null;
}

interface TransactionRow {
  id: string;
  walletId: string;
  walletType: string | null;
  walletAccount: string | null;
  walletOwnerId: string | null;
  type: string;
  category: string | null;
  amount: number;
  fee: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  owner: { id: string; name: string; email: string } | null;
}

interface BankAccountRow {
  id: string;
  bankName: string;
  bankCode: string | null;
  accountName: string;
  accountNumber: string;
  currency: string;
  isVerified: boolean;
  isPrimary: boolean;
}

interface FarmerOption {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
  };
  wallets: WalletRow[];
  transactions: TransactionRow[];
  bankAccounts: BankAccountRow[];
  farmers: FarmerOption[];
  pendingRequests: number;
  approvedRequests: number;
}

type Tab = "overview" | "transactions";

// ============================================================
// STYLES
// ============================================================

const WALLET_TYPE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Organization",
  FARMER_CLOSED: "Input",
  FARMER_OPEN: "Payout",
  SUPPLIER: "Supplier",
};

const WALLET_TYPE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700 border-purple-100",
  ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-100",
  FARMER_CLOSED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  FARMER_OPEN: "bg-sky-50 text-sky-700 border-sky-100",
  SUPPLIER: "bg-amber-50 text-amber-700 border-amber-100",
};

const TX_TYPE_STYLE: Record<string, string> = {
  CREDIT: "bg-emerald-50 text-emerald-700",
  DEBIT: "bg-red-50 text-red-700",
  TRANSFER: "bg-sky-50 text-sky-700",
  FEE: "bg-slate-100 text-slate-600",
  REFUND: "bg-amber-50 text-amber-700",
  RESERVE: "bg-slate-100 text-slate-600",
  RELEASE: "bg-slate-100 text-slate-600",
  ADMIN_ADJUSTMENT: "bg-purple-50 text-purple-700",
  SYSTEM: "bg-slate-100 text-slate-600",
};

const TX_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  REVERSED: "bg-slate-100 text-slate-600",
};

// ============================================================
// MAIN
// ============================================================

export default function WalletClient({
  user,
  wallets,
  transactions,
  bankAccounts,
  farmers,
  pendingRequests,
  approvedRequests,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  // Wallet filters
  const [walletQuery, setWalletQuery] = useState("");
  const [walletType, setWalletType] = useState<string>("ALL");
  const [walletOwner, setWalletOwner] = useState<string>("ALL");

  // Transaction filters
  const [txQuery, setTxQuery] = useState("");
  const [txType, setTxType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [txWalletId, setTxWalletId] = useState<string>("ALL");

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [fundTarget, setFundTarget] = useState<WalletRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdminOrAbove =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const myOpenWallet = wallets.find(
    (w) => w.type === "FARMER_OPEN" && w.userId === user.id
  );

  // ---------------------------------------------------------
  // Wallet filter
  // ---------------------------------------------------------
  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      if (walletType !== "ALL" && w.type !== walletType) return false;
      if (walletOwner !== "ALL" && w.userId !== walletOwner) return false;
      if (!walletQuery.trim()) return true;
      const q = walletQuery.toLowerCase();
      return (
        w.accountNumber.toLowerCase().includes(q) ||
        w.accountName.toLowerCase().includes(q) ||
        (w.palmPayAccountNumber ?? "").toLowerCase().includes(q) ||
        (w.owner?.name ?? "").toLowerCase().includes(q) ||
        (w.owner?.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [wallets, walletType, walletOwner, walletQuery]);

  // ---------------------------------------------------------
  // Transaction filter
  // ---------------------------------------------------------
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      if (txType !== "ALL" && t.type !== txType) return false;
      if (txWalletId !== "ALL" && t.walletId !== txWalletId) return false;
      if (walletOwner !== "ALL" && t.walletOwnerId !== walletOwner)
        return false;
      if (!txQuery.trim()) return true;
      const q = txQuery.toLowerCase();
      return (
        t.reference.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q) ||
        (t.owner?.name ?? "").toLowerCase().includes(q) ||
        (t.owner?.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, txType, txWalletId, walletOwner, txQuery]);

  // ---------------------------------------------------------
  // Totals (over filtered wallets)
  // ---------------------------------------------------------
  const totalAvailable = filteredWallets.reduce(
    (s, w) => s + w.availableBalance,
    0
  );
  const totalBalance = filteredWallets.reduce((s, w) => s + w.balance, 0);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const downloadWalletsCSV = () => {
    const header = [
      "Owner",
      "Email",
      "Wallet Type",
      "Account Number",
      "PalmPay VA",
      "Balance",
      "Available",
      "Status",
      "Created",
    ].join(",");
    const rows = filteredWallets.map((w) =>
      [
        w.owner?.name ?? "",
        w.owner?.email ?? "",
        WALLET_TYPE_LABEL[w.type] ?? w.type,
        w.accountNumber,
        w.palmPayAccountNumber ?? "",
        w.balance,
        w.availableBalance,
        w.isFrozen ? "FROZEN" : w.status,
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

  const downloadTxCSV = () => {
    const header = [
      "Date",
      "Owner",
      "Wallet",
      "Type",
      "Category",
      "Amount",
      "Balance After",
      "Reference",
      "Description",
      "Status",
    ].join(",");
    const rows = filteredTx.map((t) =>
      [
        t.createdAt,
        t.owner?.name ?? "",
        t.walletType ?? "",
        t.type,
        t.category ?? "",
        t.amount,
        t.balanceAfter,
        t.reference,
        t.description,
        t.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canWithdraw =
    !!myOpenWallet &&
    !myOpenWallet.isFrozen &&
    myOpenWallet.status === "ACTIVE" &&
    myOpenWallet.availableBalance > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdminOrAbove ? "Wallets" : "My Wallet"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.role === "FARMER"
              ? "Funded by your organization for farm inputs. Payouts and withdrawals live in your Payout Wallet."
              : user.role === "ADMIN"
                ? "Organization wallets and your farmers' wallets."
                : "All wallets across the platform."}
          </p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Banknote}
          label="Total Available"
          value={`₦${totalAvailable.toLocaleString()}`}
          color="success"
        />
        <SummaryCard
          icon={WalletIcon}
          label="Total Balance"
          value={`₦${totalBalance.toLocaleString()}`}
          color="primary"
        />
        <SummaryCard
          icon={CreditCard}
          label="Wallets"
          value={String(filteredWallets.length)}
          color="info"
        />
      </div>

      {/* Farmer pending banner */}
      {user.role === "FARMER" &&
        (pendingRequests > 0 || approvedRequests > 0) && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="flex-1 text-sm text-amber-900">
              <div className="font-medium">
                {pendingRequests > 0 && approvedRequests > 0
                  ? `${pendingRequests} request${pendingRequests === 1 ? "" : "s"} pending, ${approvedRequests} approved`
                  : pendingRequests > 0
                    ? `${pendingRequests} input request${pendingRequests === 1 ? "" : "s"} pending review`
                    : `${approvedRequests} input request${approvedRequests === 1 ? "" : "s"} approved`}
              </div>
              <div className="mt-0.5 text-xs text-amber-700">
                Once your organization approves and funds a request, the funds
                land in your Input Wallet.
              </div>
              <Link
                href="/dashboard/input-requests"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
              >
                View input requests
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <TabButton
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={WalletIcon}
          label={`Wallets (${filteredWallets.length})`}
        />
        <TabButton
          active={tab === "transactions"}
          onClick={() => setTab("transactions")}
          icon={RefreshCw}
          label={`Transactions (${filteredTx.length})`}
        />
      </div>

      {/* -------------------- WALLETS TABLE -------------------- */}
      {tab === "overview" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={walletQuery}
                onChange={(e) => setWalletQuery(e.target.value)}
                placeholder="Search by owner, account, PalmPay VA…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />

              <select
                value={walletOwner}
                onChange={(e) => setWalletOwner(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                <option value="ALL">All owners</option>
                <option value={user.id}>{user.name} (me)</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name} · {f.email}
                  </option>
                ))}
              </select>

              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                <option value="ALL">All types</option>
                <option value="FARMER_CLOSED">Farmer Input</option>
                <option value="FARMER_OPEN">Farmer Payout</option>
                <option value="ADMIN">Organization</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <button
                onClick={downloadWalletsCSV}
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
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">NAVSA Account</th>
                    <th className="px-4 py-3">PalmPay VA</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWallets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-16 text-center text-slate-500"
                      >
                        <WalletIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium">
                          No wallets found
                        </p>
                        <p className="mt-1 text-xs">
                          Try adjusting the filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredWallets.map((w) => {
                      const isOwn = w.userId === user.id;
                      const showFundBtn =
                        isAdminOrAbove &&
                        w.type === "FARMER_CLOSED" &&
                        w.status === "ACTIVE" &&
                        !w.isFrozen;
                      const isMyOpen =
                        isOwn && w.type === "FARMER_OPEN" && canWithdraw;

                      return (
                        <tr key={w.id} className="hover:bg-slate-50">
                          {/* Owner */}
                          <td className="px-4 py-3">
                            {w.owner ? (
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] font-semibold text-white">
                                  {w.owner.name
                                    .split(" ")
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-medium text-slate-900">
                                    {w.owner.name}
                                    {isOwn && (
                                      <span className="ml-1 text-[10px] font-normal text-slate-400">
                                        (me)
                                      </span>
                                    )}
                                  </div>
                                  <div className="truncate text-[10px] text-slate-500">
                                    {w.owner.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                WALLET_TYPE_STYLE[w.type] ??
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {WALLET_TYPE_LABEL[w.type] ?? w.type}
                            </span>
                            <div className="mt-1 text-[10px] text-slate-500">
                              {w.accountName}
                            </div>
                          </td>

                          {/* NAVSA account */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-slate-700">
                                {w.accountNumber}
                              </span>
                              <button
                                onClick={() =>
                                  copy(w.accountNumber, `${w.id}-navsa`)
                                }
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Copy"
                              >
                                {copiedId === `${w.id}-navsa` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* PalmPay VA */}
                          <td className="px-4 py-3">
                            {w.palmPayAccountNumber ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-xs text-slate-700">
                                    {w.palmPayAccountNumber}
                                  </span>
                                  <button
                                    onClick={() =>
                                      copy(
                                        w.palmPayAccountNumber!,
                                        `${w.id}-palmpay`
                                      )
                                    }
                                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    title="Copy"
                                  >
                                    {copiedId === `${w.id}-palmpay` ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {w.palmPayBankName ?? "PalmPay"} ·{" "}
                                  <span
                                    className={
                                      w.palmPayStatus === "ACTIVE"
                                        ? "text-emerald-600"
                                        : "text-red-500"
                                    }
                                  >
                                    {w.palmPayStatus ?? "PENDING"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Not provisioned
                              </span>
                            )}
                          </td>

                          {/* Balance */}
                          <td className="px-4 py-3 text-right text-xs text-slate-600">
                            ₦{w.balance.toLocaleString()}
                          </td>

                          {/* Available */}
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            ₦{w.availableBalance.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {w.isFrozen ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                <Snowflake className="h-3 w-3" />
                                Frozen
                              </span>
                            ) : w.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                {w.status}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isMyOpen && (
                                <button
                                  onClick={() => setWithdrawModalOpen(true)}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700"
                                >
                                  <ArrowUpFromLine className="h-3 w-3" />
                                  Withdraw
                                </button>
                              )}
                              {showFundBtn && (
                                <button
                                  onClick={() => setFundTarget(w)}
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                                >
                                  <Plus className="h-3 w-3" />
                                  Fund
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredWallets.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  <strong className="text-slate-900">
                    {filteredWallets.length}
                  </strong>{" "}
                  of {wallets.length} wallets
                </span>
              </div>
            )}
          </div>

          {/* How funding works */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              How funding works
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>
                • The <strong>Input Wallet</strong> is funded by the
                organization when it approves an input request.
              </li>
              <li>
                • Money in the Input Wallet can only be used to purchase farm
                inputs — it cannot be withdrawn.
              </li>
              <li>
                • Payouts from harvests and revenue land in the{" "}
                <strong>Payout Wallet</strong>.
              </li>
              <li>
                • Withdrawals to a linked bank account come from the Payout
                Wallet.
              </li>
            </ul>
          </div>
        </>
      )}

      {/* -------------------- TRANSACTIONS TABLE -------------------- */}
      {tab === "transactions" && (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={txQuery}
                onChange={(e) => setTxQuery(e.target.value)}
                placeholder="Search by reference, owner, description…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={walletOwner}
                onChange={(e) => setWalletOwner(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                <option value="ALL">All owners</option>
                <option value={user.id}>{user.name} (me)</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name}
                  </option>
                ))}
              </select>

              <select
                value={txWalletId}
                onChange={(e) => setTxWalletId(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                <option value="ALL">All wallets</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {WALLET_TYPE_LABEL[w.type] ?? w.type} ·{" "}
                    {w.owner?.name ?? "me"}
                  </option>
                ))}
              </select>

              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                <option value="ALL">All types</option>
                <option value="CREDIT">Credits</option>
                <option value="DEBIT">Debits</option>
              </select>

              <button
                onClick={downloadTxCSV}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    {isAdminOrAbove && (
                      <th className="px-4 py-3">Owner</th>
                    )}
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdminOrAbove ? 8 : 7}
                        className="px-4 py-16 text-center text-slate-500"
                      >
                        <RefreshCw className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium">
                          No transactions found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((t) => {
                      const isCredit = t.type === "CREDIT";
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                          {isAdminOrAbove && (
                            <td className="px-4 py-3 text-xs text-slate-700">
                              {t.owner ? (
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {t.owner.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {t.owner.email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {t.walletType
                              ? WALLET_TYPE_LABEL[t.walletType] ??
                                t.walletType
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                TX_TYPE_STYLE[t.type] ??
                                "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownToLine className="h-3 w-3" />
                              ) : (
                                <ArrowUpFromLine className="h-3 w-3" />
                              )}
                              {t.type}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              isCredit
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                          >
                            {isCredit ? "+" : "−"}₦
                            {t.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-600">
                            ₦{t.balanceAfter.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700">
                            <div className="max-w-[280px] truncate">
                              {t.description}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {t.reference}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                TX_STATUS_STYLE[t.status] ??
                                "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredTx.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  <strong className="text-slate-900">
                    {filteredTx.length}
                  </strong>{" "}
                  of {transactions.length} transactions
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Withdraw modal */}
      {withdrawModalOpen && myOpenWallet && (
        <WithdrawModal
          wallet={myOpenWallet}
          bankAccounts={bankAccounts}
          onClose={() => setWithdrawModalOpen(false)}
          onSuccess={() => {
            setWithdrawModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Fund wallet modal */}
      {fundTarget && (
        <FundWalletModal
          wallet={fundTarget}
          onClose={() => setFundTarget(null)}
          onSuccess={() => {
            setFundTarget(null);
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: "primary" | "success" | "info";
}) {
  const styles = {
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
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
// WITHDRAW MODAL
// ============================================================

function WithdrawModal({
  wallet,
  bankAccounts,
  onClose,
  onSuccess,
}: {
  wallet: WalletRow;
  bankAccounts: BankAccountRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{
    amount: number;
    reference: string;
  } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }
    if (value > wallet.availableBalance) {
      setError("Amount exceeds available balance");
      setLoading(false);
      return;
    }
    if (!bankAccountId) {
      setError("Please select a bank account");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, bankAccountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to withdraw");
      }
      setDone({ amount: value, reference: data.data.reference });
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
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpFromLine className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {done ? "Withdrawal requested" : "Withdraw to bank"}
              </h2>
              <p className="text-xs text-slate-500">
                {done
                  ? "Funds will land in your bank shortly."
                  : `Available: ₦${wallet.availableBalance.toLocaleString()}`}
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
                    ₦{done.amount.toLocaleString()} withdrawal initiated
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Reference:{" "}
                    <span className="font-mono">{done.reference}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Field
                label="Amount (₦) *"
                type="number"
                value={amount}
                onChange={setAmount}
                required
                placeholder="0.00"
              />

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Bank account *
                </label>
                {bankAccounts.length === 0 ? (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                    You don&apos;t have a linked bank account yet. Add one
                    from Settings → Bank accounts.
                  </div>
                ) : (
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Select account…</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} — {b.accountNumber} ({b.accountName})
                      </option>
                    ))}
                  </select>
                )}
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
                disabled={loading || bankAccounts.length === 0}
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
                    Withdraw
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
// FUND WALLET MODAL
// ============================================================

function FundWalletModal({
  wallet,
  onClose,
  onSuccess,
}: {
  wallet: WalletRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ amount: number } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/dashboard/farmers/${wallet.userId}/fund-wallet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: value,
            description: notes || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fund wallet");
      }
      setDone({ amount: value });
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
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {done ? "Wallet funded" : "Fund Input Wallet"}
              </h2>
              <p className="text-xs text-slate-500">
                {done
                  ? "The farmer's Input Wallet has been credited."
                  : `Owner: ${wallet.owner?.name ?? "Farmer"}`}
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
                    ₦{done.amount.toLocaleString()} added
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    The farmer&apos;s Input Wallet was credited. The amount
                    was debited from your organization wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Field
                label="Amount (₦) *"
                type="number"
                value={amount}
                onChange={setAmount}
                required
                placeholder="0.00"
              />

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason for funding…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                This will debit your organization wallet and credit the
                farmer&apos;s Input Wallet. It cannot be spent outside of
                approved inputs.
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
                    Funding…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Fund wallet
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