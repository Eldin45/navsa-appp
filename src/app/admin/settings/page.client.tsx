"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Users,
  CreditCard,
  Lock,
  Building2,
  Mail,
  Phone,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Send,
  Trash2,
  ShieldCheck,
  KeyRound,
  Ban,
  Star,
  Search,
  Bell,
  Globe,
  Palette,
  Settings as SettingsIcon,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface OrgUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  mustChangePassword: boolean;
  organization: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
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
  createdAt: string;
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    organizationId: string | null;
  };
  profile: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
    lastLogin: string | null;
    mustChangePassword: boolean;
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
    } | null;
    preferences: {
      theme: string | null;
      language: string | null;
      timezone: string | null;
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
      weatherAlerts: boolean;
      paymentAlerts: boolean;
    } | null;
  };
  users: OrgUserRow[];
  bankAccounts: BankAccountRow[];
}

type Tab = "profile" | "users" | "bank-accounts" | "notifications" | "security";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FARMER: "Farmer",
  SUPPLIER: "Supplier",
};

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700 border-purple-100",
  ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-100",
  FARMER: "bg-emerald-50 text-emerald-700 border-emerald-100",
  SUPPLIER: "bg-amber-50 text-amber-700 border-amber-100",
};

// ============================================================
// MAIN
// ============================================================

export default function SettingsClient({
  user,
  profile,
  users,
  bankAccounts,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          {user.isSuperAdmin
            ? "Manage your account, platform users, and preferences."
            : "Manage your account, organization users, and preferences."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        <TabButton
          active={tab === "profile"}
          onClick={() => setTab("profile")}
          icon={UserIcon}
          label="Profile"
        />
        <TabButton
          active={tab === "users"}
          onClick={() => setTab("users")}
          icon={Users}
          label={`Users (${users.length})`}
        />
        <TabButton
          active={tab === "bank-accounts"}
          onClick={() => setTab("bank-accounts")}
          icon={CreditCard}
          label={`Bank accounts (${bankAccounts.length})`}
        />
        <TabButton
          active={tab === "notifications"}
          onClick={() => setTab("notifications")}
          icon={Bell}
          label="Notifications"
        />
        <TabButton
          active={tab === "security"}
          onClick={() => setTab("security")}
          icon={Lock}
          label="Security"
        />
      </div>

      {tab === "profile" && (
        <ProfileTab profile={profile} onSaved={() => router.refresh()} />
      )}

      {tab === "users" && (
        <UsersTab
          users={users}
          caller={user}
          onCreate={() => setUserModalOpen(true)}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "bank-accounts" && (
        <BankAccountsTab
          accounts={bankAccounts}
          onAdd={() => setBankModalOpen(true)}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "notifications" && (
        <NotificationsTab
          profile={profile}
          onSaved={() => router.refresh()}
        />
      )}

      {tab === "security" && (
        <SecurityTab
          profile={profile}
          onChangePassword={() => setPasswordModalOpen(true)}
        />
      )}

      {userModalOpen && (
        <AddUserModal
          caller={user}
          onClose={() => setUserModalOpen(false)}
          onSuccess={() => {
            setUserModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {bankModalOpen && (
        <AddBankModal
          onClose={() => setBankModalOpen(false)}
          onSuccess={() => {
            setBankModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {passwordModalOpen && (
        <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />
      )}
    </div>
  );
}

// ============================================================
// SHARED
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-slate-500">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
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
        <div className="break-words text-sm text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 py-8"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl`}
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

// ============================================================
// PROFILE TAB
// ============================================================

function ProfileTab({
  profile,
  onSaved,
}: {
  profile: Props["profile"];
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update profile");
      setSuccess("Profile updated successfully.");
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Profile information
        </h2>
        <p className="text-xs text-slate-500">
          Update your name and contact details.
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
          onSubmit={submit}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field label="Full Name *" value={fullName} onChange={setFullName} required />
          <Field label="Email" value={profile.email} disabled />
          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="08012345678"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Role
            </label>
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                ROLE_STYLE[profile.role] ??
                "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {ROLE_LABEL[profile.role] ?? profile.role}
            </div>
          </div>

          <div className="mt-2 flex justify-end sm:col-span-2">
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
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Account</h2>
        <div className="mt-4 space-y-3">
          <DetailRow
            icon={Calendar}
            label="Member since"
            value={new Date(profile.createdAt).toLocaleDateString()}
          />
          {profile.lastLogin && (
            <DetailRow
              icon={Calendar}
              label="Last sign-in"
              value={new Date(profile.lastLogin).toLocaleString()}
            />
          )}
          <DetailRow icon={ShieldCheck} label="Status" value={profile.status} />
          {profile.organization && (
            <>
              <DetailRow
                icon={Building2}
                label="Organization"
                value={profile.organization.name}
              />
              <DetailRow
                icon={Building2}
                label="Organization type"
                value={profile.organization.type.replace(/_/g, " ")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USERS TAB
// ============================================================

function UsersTab({
  users,
  caller,
  onCreate,
  onChanged,
}: {
  users: OrgUserRow[];
  caller: Props["user"];
  onCreate: () => void;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="ALL">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="FARMER">Farmer</option>
          <option value="SUPPLIER">Supplier</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                {caller.isSuperAdmin && <th className="px-4 py-3">Organization</th>}
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={caller.isSuperAdmin ? 7 : 6}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">No users found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white">
                          {u.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-slate-900">
                              {u.name}
                            </span>
                            {u.mustChangePassword && (
                              <span
                                title="Must change password"
                                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                              >
                                <KeyRound className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          ROLE_STYLE[u.role] ??
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    {caller.isSuperAdmin && (
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {u.organization?.name ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {u.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : u.status === "SUSPENDED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          <Ban className="h-3 w-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {u.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserRowActions user={u} caller={caller} onChanged={onChanged} />
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
              {users.length} users
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRowActions({
  user,
  caller,
  onChanged,
}: {
  user: OrgUserRow;
  caller: Props["user"];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isSelf = user.id === caller.id;

  const canManage =
    caller.isSuperAdmin ||
    (caller.isAdmin && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") ||
    (caller.isAdmin && user.organization?.id === caller.organizationId);

  const updateStatus = async (status: string) => {
    setBusy("status");
    setError("");
    try {
      const res = await fetch(`/api/admin/settings/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setBusy("delete");
    setError("");
    try {
      const res = await fetch(`/api/admin/settings/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to delete");
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

      {!isSelf && canManage && user.status === "ACTIVE" && (
        <button
          onClick={() => updateStatus("SUSPENDED")}
          disabled={busy !== null}
          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {busy === "status" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Suspend"
          )}
        </button>
      )}

      {!isSelf && canManage && user.status !== "ACTIVE" && (
        <button
          onClick={() => updateStatus("ACTIVE")}
          disabled={busy !== null}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "status" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Activate"
          )}
        </button>
      )}

      {!isSelf && canManage && (
        <button
          onClick={remove}
          disabled={busy !== null}
          className="rounded-md border border-red-200 bg-white px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          title="Delete user"
        >
          {busy === "delete" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </button>
      )}

      {isSelf && <span className="text-[10px] text-slate-400">You</span>}
    </div>
  );
}

// ============================================================
// BANK ACCOUNTS TAB
// ============================================================

function BankAccountsTab({
  accounts,
  onAdd,
  onChanged,
}: {
  accounts: BankAccountRow[];
  onAdd: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const setPrimary = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/settings/bank-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      onChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string, label: string) => {
    if (!confirm(`Remove bank account ${label}?`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/settings/bank-accounts/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      onChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Linked bank accounts
          </h2>
          <p className="text-xs text-slate-500">
            Withdraw from your Payout Wallet to any of these accounts.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">
            No bank accounts yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add a bank account to enable withdrawals.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Account Number</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {a.bankName}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {a.accountNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {a.accountName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {a.currency}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.isPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <Star className="h-3 w-3" />
                            Primary
                          </span>
                        )}
                        {a.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!a.isPrimary && (
                          <button
                            onClick={() => setPrimary(a.id)}
                            disabled={busy === a.id}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {busy === a.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Make primary"
                            )}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            remove(a.id, `${a.bankName} • ${a.accountNumber}`)
                          }
                          disabled={busy === a.id}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {busy === a.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// NOTIFICATIONS TAB
// ============================================================

function NotificationsTab({
  profile,
  onSaved,
}: {
  profile: Props["profile"];
  onSaved: () => void;
}) {
  const prefs = profile.preferences;
  const [emailEnabled, setEmailEnabled] = useState(prefs?.emailEnabled ?? true);
  const [smsEnabled, setSmsEnabled] = useState(prefs?.smsEnabled ?? false);
  const [pushEnabled, setPushEnabled] = useState(prefs?.pushEnabled ?? true);
  const [weatherAlerts, setWeatherAlerts] = useState(
    prefs?.weatherAlerts ?? true
  );
  const [paymentAlerts, setPaymentAlerts] = useState(
    prefs?.paymentAlerts ?? true
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled,
          smsEnabled,
          pushEnabled,
          weatherAlerts,
          paymentAlerts,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update notifications");
      setSuccess("Notification preferences updated.");
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Notification channels
        </h2>
        <p className="text-xs text-slate-500">
          Choose how we reach you about activity on your account.
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

        <form onSubmit={submit} className="mt-5 space-y-3">
          <Toggle
            checked={emailEnabled}
            onChange={setEmailEnabled}
            label="Email notifications"
            description="Receive account activity alerts by email."
          />
          <Toggle
            checked={smsEnabled}
            onChange={setSmsEnabled}
            label="SMS notifications"
            description="Receive time-sensitive alerts by text message."
          />
          <Toggle
            checked={pushEnabled}
            onChange={setPushEnabled}
            label="Push notifications"
            description="Receive browser push notifications."
          />
          <Toggle
            checked={weatherAlerts}
            onChange={setWeatherAlerts}
            label="Weather alerts"
            description="Get alerts about upcoming weather affecting your region."
          />
          <Toggle
            checked={paymentAlerts}
            onChange={setPaymentAlerts}
            label="Payment alerts"
            description="Get notified about wallet activity and transactions."
          />

          <div className="flex justify-end pt-2">
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
                  Save preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Regional settings
        </h2>
        <div className="mt-4 space-y-3">
          <DetailRow
            icon={Globe}
            label="Language"
            value={prefs?.language ?? "en"}
          />
          <DetailRow
            icon={Globe}
            label="Timezone"
            value={prefs?.timezone ?? "Africa/Lagos"}
          />
          <DetailRow
            icon={Palette}
            label="Theme"
            value={prefs?.theme ?? "light"}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECURITY TAB
// ============================================================

function SecurityTab({
  profile,
  onChangePassword,
}: {
  profile: Props["profile"];
  onChangePassword: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-900">Security</h2>
        <p className="text-xs text-slate-500">Keep your account safe.</p>

        <div className="mt-5 space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Password
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Change your sign-in password regularly.
              </div>
            </div>
            <button
              onClick={onChangePassword}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Lock className="h-3.5 w-3.5" />
              Change password
            </button>
          </div>

          {profile.mustChangePassword && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Password change required
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    You are still using the default password. Change it now.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Two-factor authentication
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Add an extra layer of security to your account.
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Coming soon
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Active sessions
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Sign out of devices you no longer use.
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Managed automatically
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Account state</h2>
        <div className="mt-4 space-y-3">
          <DetailRow icon={Mail} label="Email" value={profile.email} />
          <DetailRow icon={ShieldCheck} label="Status" value={profile.status} />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(profile.createdAt).toLocaleDateString()}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADD USER MODAL
// ============================================================

function AddUserModal({
  caller,
  onClose,
  onSuccess,
}: {
  caller: Props["user"];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "FARMER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{
    email: string;
    phone: string;
    role: string;
  } | null>(null);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to create user");
      setDone({
        email: data.data.email ?? form.email,
        phone: data.data.phone ?? form.phone,
        role: data.data.role ?? form.role,
      });
      setTimeout(onSuccess, 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = caller.isSuperAdmin
    ? ["ADMIN", "FARMER", "SUPPLIER"]
    : ["FARMER", "SUPPLIER"];

  return (
    <ModalShell
      title={done ? "User created" : "Add user"}
      subtitle={
        done
          ? "The user can now sign in with their default password."
          : "The phone number becomes the user's default password."
      }
      onClose={onClose}
    >
      {done ? (
        <div className="px-6 py-6">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  {ROLE_LABEL[done.role] ?? done.role} created
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Credentials emailed to <strong>{done.email}</strong>.
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Default password:{" "}
                  <strong className="font-mono">{done.phone}</strong>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name *"
              value={form.full_name}
              onChange={(v) => update("full_name", v)}
              required
              placeholder="Jane Doe"
            />
            <Field
              label="Email *"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
              required
              placeholder="jane@example.com"
            />
            <Field
              label="Phone *"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              required
              placeholder="08012345678"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r] ?? r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            The phone number above becomes the default password. The user must
            change it on first sign-in.
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
                  Create user
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

// ============================================================
// ADD BANK MODAL
// ============================================================

function AddBankModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    bankName: "",
    bankCode: "",
    accountName: "",
    accountNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to add account");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Add bank account"
      subtitle="Withdraw from your Payout Wallet to this account."
      onClose={onClose}
    >
      <form onSubmit={submit} className="px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Bank Name *"
            value={form.bankName}
            onChange={(v) => update("bankName", v)}
            required
            placeholder="e.g. GTBank"
          />
          <Field
            label="Bank Code"
            value={form.bankCode}
            onChange={(v) => update("bankCode", v)}
            placeholder="e.g. 058"
          />
          <Field
            label="Account Name *"
            value={form.accountName}
            onChange={(v) => update("accountName", v)}
            required
            placeholder="As it appears on the account"
          />
          <Field
            label="Account Number *"
            value={form.accountNumber}
            onChange={(v) => update("accountNumber", v)}
            required
            placeholder="0123456789"
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
                Saving…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Add account
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============================================================
// CHANGE PASSWORD MODAL
// ============================================================

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to change password");
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title={done ? "Password changed" : "Change password"}
      subtitle={done ? "You can keep using your session." : undefined}
      onClose={onClose}
    >
      {done ? (
        <div className="px-6 py-6">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-900">
                Your password has been updated.
              </p>
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
              label="New password *"
              type="password"
              value={password}
              onChange={setPassword}
              required
            />
            <Field
              label="Confirm new password *"
              type="password"
              value={confirm}
              onChange={setConfirm}
              required
            />
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              Must be at least 8 characters, with uppercase, lowercase, a
              number, and a special character.
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
                  Saving…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Update password
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}