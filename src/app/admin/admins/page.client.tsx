// src/app/admin/admins/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserCog,
  Mail,
  Phone,
  Wallet,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Send,
  Calendar,
  Ban,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  mustChangePassword: boolean;
  wallet: {
    id: string;
    type: string;
    accountNumber: string;
    balance: number;
    availableBalance: number;
    palmPayAccountNumber: string | null;
    palmPayBankName: string | null;
    palmPayStatus: string | null;
  } | null;
  createdBy: { id: string; name: string; email: string } | null;
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
  };
  admins: AdminUser[];
  stats: {
    total: number;
    active: number;
    suspended: number;
    mustChangePassword: number;
  };
}

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
  value: number;
  color: "primary" | "success" | "warning" | "danger";
  icon: any;
}) => {
  const styles = {
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    danger: "bg-red-50 text-red-600 border-red-100",
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

// ============================================================
// MAIN
// ============================================================

export default function AdminsClient({ user, admins, stats }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "SUSPENDED" | "INACTIVE"
  >("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone ?? "").includes(q)
      );
    });
  }, [admins, query, statusFilter]);

  const selectedAdmin = selectedAdminId
    ? admins.find((a) => a.id === selectedAdminId) ?? null
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Admins
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Admins who are part of the platform ownership. Organizations manage
            their own users from the dashboard.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} color="primary" icon={UserCog} />
        <StatCard label="Active" value={stats.active} color="success" icon={CheckCircle2} />
        <StatCard label="Suspended" value={stats.suspended} color="danger" icon={Ban} />
        <StatCard
          label="Must Change Pwd"
          value={stats.mustChangePassword}
          color="warning"
          icon={KeyRound}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                    <UserCog className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No admins found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedAdminId(a.id)}
                        className="group flex items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white">
                          {a.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {a.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {a.email}
                          </span>
                        </span>
                        {a.mustChangePassword && (
                          <span
                            title="Must change password"
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                          >
                            <KeyRound className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                      {a.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {a.wallet ? (
                        <div>
                          <div className="font-mono text-slate-700">
                            {a.wallet.palmPayAccountNumber ?? a.wallet.accountNumber}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ₦{a.wallet.balance.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : a.status === "SUSPENDED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          <XCircle className="h-3 w-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {a.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAdminId(a.id)}
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

      {/* Create modal */}
      {createModalOpen && (
        <CreateAdminModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Detail modal */}
      {selectedAdmin && (
        <AdminDetailModal
          admin={selectedAdmin}
          onClose={() => setSelectedAdminId(null)}
          onChanged={() => {
            setSelectedAdminId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// CREATE ADMIN MODAL
// ============================================================

function CreateAdminModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ email: string; phone: string } | null>(null);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create admin");
      }
      setDone({ email: data.data.email, phone: data.data.phone ?? form.phone });
      setTimeout(onSuccess, 1800);
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
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {done ? "Admin created" : "Create Platform Admin"}
              </h2>
              <p className="text-xs text-slate-500">
                {done
                  ? "The admin has been created successfully."
                  : "The phone number becomes the admin's default password."}
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
                    Credentials emailed
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Sign-in credentials have been sent to{" "}
                    <strong>{done.email}</strong>.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Default password: <strong>{done.phone}</strong> (their phone
                    number). They will be prompted to change it on first
                    sign-in.
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

            <div className="grid grid-cols-1 gap-4">
              <Field
                label="Full Name *"
                value={form.full_name}
                onChange={(v) => update("full_name", v)}
                required
              />
              <Field
                label="Email *"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
                required
              />
              <Field
                label="Phone *"
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder="08012345678"
                required
              />
            </div>

            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <strong>Note:</strong> The phone number above will be used as the
              admin&apos;s default password. The admin must change it on first
              sign-in.
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
                    Create Admin
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
// ADMIN DETAIL MODAL
// ============================================================

function AdminDetailModal({
  admin,
  onClose,
  onChanged,
}: {
  admin: AdminUser;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState<"suspend" | "activate" | "resend" | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const doStatusChange = async (status: "ACTIVE" | "SUSPENDED") => {
    setLoading(status === "ACTIVE" ? "activate" : "suspend");
    setError("");
    setInfo("");
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const doResend = async () => {
    setLoading("resend");
    setError("");
    setInfo("");
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/resend-credentials`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setInfo(`Credentials resent to ${data.data.email}`);
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
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-semibold text-white">
              {admin.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{admin.name}</h2>
              <p className="text-xs text-slate-500">{admin.email}</p>
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
          {info && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {info}
            </div>
          )}

          <DetailRow icon={Mail} label="Email" value={admin.email} />
          {admin.phone && (
            <DetailRow icon={Phone} label="Phone" value={admin.phone} />
          )}
          <DetailRow icon={ShieldCheck} label="Role" value="Platform Admin" />
          <DetailRow icon={ShieldCheck} label="Status" value={admin.status} />
          {admin.mustChangePassword && (
            <DetailRow
              icon={KeyRound}
              label="Password"
              value="Must change on next sign-in"
            />
          )}
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(admin.createdAt).toLocaleString()}
          />
          {admin.lastLogin && (
            <DetailRow
              icon={Calendar}
              label="Last login"
              value={new Date(admin.lastLogin).toLocaleString()}
            />
          )}
          {admin.createdBy && (
            <DetailRow
              icon={UserCog}
              label="Created by"
              value={`${admin.createdBy.name} (${admin.createdBy.email})`}
            />
          )}
          {admin.wallet && (
            <>
              <DetailRow icon={Wallet} label="Wallet type" value={admin.wallet.type} />
              <DetailRow
                icon={Wallet}
                label="Account number"
                value={admin.wallet.accountNumber}
              />
              {admin.wallet.palmPayAccountNumber && (
                <DetailRow
                  icon={Wallet}
                  label="PalmPay VA"
                  value={`${admin.wallet.palmPayAccountNumber} · ${
                    admin.wallet.palmPayBankName ?? "PalmPay"
                  }`}
                />
              )}
              <DetailRow
                icon={Wallet}
                label="Balance"
                value={`₦${admin.wallet.balance.toLocaleString()}`}
              />
            </>
          )}

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {admin.status === "ACTIVE" ? (
                <button
                  onClick={() => doStatusChange("SUSPENDED")}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {loading === "suspend" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Ban className="h-3 w-3" />
                  )}
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => doStatusChange("ACTIVE")}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {loading === "activate" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Activate
                </button>
              )}
              <button
                onClick={doResend}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loading === "resend" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Resend Credentials
              </button>
            </div>
          </div>
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