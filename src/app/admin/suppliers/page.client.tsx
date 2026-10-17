// src/app/admin/suppliers/applications/page.client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  Download,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  FileText,
  Calendar,
  UserCheck,
  ExternalLink,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type AppStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFO_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

interface ApplicationRow {
  id: string;
  applicationNumber: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  businessName: string;
  businessType: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  country: string;
  state: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  productCategories: string | null;
  deliveryRegions: string | null;
  yearsInBusiness: number | null;
  description: string | null;
  documents: any[];
  status: AppStatus;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  approvedUserId: string | null;
  reviewedBy: { id: string; name: string; email: string } | null;
  approvedUser: { id: string; name: string; email: string } | null;
}

interface OrganizationOption {
  id: string;
  name: string;
  type: string;
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    organizationId: string | null;
  };
  applications: ApplicationRow[];
  organizations: OrganizationOption[];
}

// ============================================================
// STYLE MAPS
// ============================================================

const STATUS_STYLE: Record<AppStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  MORE_INFO_REQUESTED: "bg-purple-50 text-purple-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<AppStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  MORE_INFO_REQUESTED: "More Info Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

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
  color: "primary" | "success" | "warning" | "danger" | "info";
  icon: any;
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

// ============================================================
// MAIN
// ============================================================

export default function SupplierApplicationsClient({
  user,
  applications,
  organizations,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        a.businessName.toLowerCase().includes(q) ||
        a.applicationNumber.toLowerCase().includes(q) ||
        a.contactFullName.toLowerCase().includes(q) ||
        a.contactEmail.toLowerCase().includes(q) ||
        (a.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [applications, query, statusFilter]);

  const selected = selectedId
    ? applications.find((a) => a.id === selectedId) ?? null
    : null;

  const stats = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter((a) => a.status === "SUBMITTED").length,
      underReview: applications.filter((a) => a.status === "UNDER_REVIEW").length,
      moreInfo: applications.filter(
        (a) => a.status === "MORE_INFO_REQUESTED"
      ).length,
      approved: applications.filter((a) => a.status === "APPROVED").length,
      rejected: applications.filter((a) => a.status === "REJECTED").length,
    };
  }, [applications]);

  const downloadCSV = () => {
    const header = [
      "Application #",
      "Business",
      "Contact",
      "Email",
      "Phone",
      "Status",
      "Submitted",
    ].join(",");
    const rows = filtered.map((a) =>
      [
        a.applicationNumber,
        a.businessName,
        a.contactFullName,
        a.contactEmail,
        a.contactPhone,
        a.status,
        a.submittedAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplier-applications-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Supplier Applications
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review supplier onboarding applications. On approval, assign each
            supplier to an organization.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total"
          value={stats.total}
          color="primary"
          icon={Package}
        />
        <StatCard
          label="Submitted"
          value={stats.submitted}
          color="info"
          icon={Clock}
        />
        <StatCard
          label="Under Review"
          value={stats.underReview}
          color="warning"
          icon={AlertTriangle}
        />
        <StatCard
          label="More Info"
          value={stats.moreInfo}
          color="warning"
          icon={MessageSquare}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          color="success"
          icon={CheckCircle2}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          color="danger"
          icon={XCircle}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by business, contact, application #…"
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
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="MORE_INFO_REQUESTED">More Info Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
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
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">
                      No applications found
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedId(a.id)}
                        className="group flex items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                          {a.businessName.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-emerald-700">
                            {a.businessName}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {a.applicationNumber}
                          </span>
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-900">
                          {a.contactFullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {a.contactEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {a.contactPhone}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {[a.city, a.state, a.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLE[a.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.submittedAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedId(a.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Open
                        <ChevronRight className="h-3 w-3" />
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
              {applications.length} applications
            </span>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <ApplicationDetailModal
          application={selected}
          user={user}
          organizations={organizations}
          onClose={() => setSelectedId(null)}
          onDecided={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// DETAIL MODAL (with organization picker on approve)
// ============================================================

function ApplicationDetailModal({
  application,
  user,
  organizations,
  onClose,
  onDecided,
}: {
  application: ApplicationRow;
  user: Props["user"];
  organizations: OrganizationOption[];
  onClose: () => void;
  onDecided: () => void;
}) {
  const [action, setAction] = useState<
    "APPROVE" | "REJECT" | "REQUEST_MORE_INFO" | "START_REVIEW" | null
  >(null);
  const [organizationId, setOrganizationId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDecidable =
    application.status !== "APPROVED" && application.status !== "REJECTED";

  const submit = async () => {
    if (!action) return;

    // Guard: approve requires an organization
    if (action === "APPROVE" && !organizationId) {
      setError(
        "Please select the organization this supplier will belong to."
      );
      return;
    }
    // Guard: reject requires a reason
    if (action === "REJECT" && !notes.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/suppliers/applications/${application.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: action,
            organizationId: action === "APPROVE" ? organizationId : undefined,
            notes,
            reason: action === "REJECT" ? notes : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process");
      }
      onDecided();
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
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {application.businessName}
              </h2>
              <p className="text-xs text-slate-500">
                {application.applicationNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLE[application.status] ??
                "bg-slate-100 text-slate-600"
              }`}
            >
              {STATUS_LABEL[application.status] ?? application.status}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Approved info banner */}
          {application.status === "APPROVED" && application.approvedUser && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Approved as {application.approvedUser.name}
                </p>
                <p className="text-xs">
                  Signed up with {application.approvedUser.email}
                </p>
              </div>
            </div>
          )}

          {/* Contact */}
          <Section title="Contact">
            <InfoRow
              icon={UserCheck}
              label="Name"
              value={application.contactFullName}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={application.contactEmail}
            />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={application.contactPhone}
            />
            <InfoRow
              icon={MapPin}
              label="Address"
              value={
                [application.city, application.state, application.country]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            {application.website && (
              <InfoRow
                icon={Globe}
                label="Website"
                value={application.website}
              />
            )}
          </Section>

          {/* Business */}
          <Section title="Business">
            <InfoRow
              icon={Building2}
              label="Business Name"
              value={application.businessName}
            />
            {application.businessType && (
              <InfoRow
                icon={Building2}
                label="Type"
                value={application.businessType}
              />
            )}
            {application.registrationNumber && (
              <InfoRow
                icon={FileText}
                label="Registration #"
                value={application.registrationNumber}
              />
            )}
            {application.taxId && (
              <InfoRow
                icon={FileText}
                label="Tax ID"
                value={application.taxId}
              />
            )}
            {application.yearsInBusiness != null && (
              <InfoRow
                icon={Calendar}
                label="Years in business"
                value={String(application.yearsInBusiness)}
              />
            )}
          </Section>

          {/* Capabilities */}
          {(application.productCategories ||
            application.deliveryRegions ||
            application.description) && (
            <Section title="Capabilities">
              {application.productCategories && (
                <InfoRow
                  icon={Package}
                  label="Product categories"
                  value={application.productCategories}
                />
              )}
              {application.deliveryRegions && (
                <InfoRow
                  icon={MapPin}
                  label="Delivery regions"
                  value={application.deliveryRegions}
                />
              )}
              {application.description && (
                <InfoRow
                  icon={FileText}
                  label="Description"
                  value={application.description}
                  multiline
                />
              )}
            </Section>
          )}

          {/* Timeline */}
          <Section title="Timeline">
            <InfoRow
              icon={Calendar}
              label="Submitted"
              value={new Date(application.submittedAt).toLocaleString()}
            />
            {application.reviewedAt && (
              <InfoRow
                icon={Calendar}
                label="Reviewed"
                value={new Date(application.reviewedAt).toLocaleString()}
              />
            )}
            {application.reviewedBy && (
              <InfoRow
                icon={UserCheck}
                label="Reviewed by"
                value={`${application.reviewedBy.name} (${application.reviewedBy.email})`}
              />
            )}
            {application.rejectionReason && (
              <InfoRow
                icon={XCircle}
                label="Reason"
                value={application.rejectionReason}
              />
            )}
          </Section>

          {/* Decision */}
          {isDecidable && (
            <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Decision
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                <DecisionButton
                  active={action === "START_REVIEW"}
                  onClick={() => setAction("START_REVIEW")}
                  icon={Clock}
                  label="Start Review"
                />
                <DecisionButton
                  active={action === "REQUEST_MORE_INFO"}
                  onClick={() => setAction("REQUEST_MORE_INFO")}
                  icon={MessageSquare}
                  label="Request More Info"
                />
                <DecisionButton
                  active={action === "APPROVE"}
                  onClick={() => setAction("APPROVE")}
                  icon={ThumbsUp}
                  label="Approve"
                  variant="success"
                />
                <DecisionButton
                  active={action === "REJECT"}
                  onClick={() => setAction("REJECT")}
                  icon={ThumbsDown}
                  label="Reject"
                  variant="danger"
                />
              </div>

              {/* Organization picker — only for APPROVE */}
              {action === "APPROVE" && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Assign to organization{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {organizations.length === 0 ? (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      No active organizations available.{" "}
                      {user.isSuperAdmin
                        ? "Create an organization first."
                        : "Ask your Super Admin to create one."}
                    </div>
                  ) : (
                    <select
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">Select an organization…</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} · {o.type.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    {user.isSuperAdmin
                      ? "As Super Admin you can assign the supplier to any organization."
                      : "You can only assign the supplier to your own organization."}
                  </p>
                </div>
              )}

              {/* Notes */}
              {(action === "APPROVE" ||
                action === "REJECT" ||
                action === "REQUEST_MORE_INFO") && (
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
                          ? "Explain why this application is rejected"
                          : "What additional information do you need?"
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {!isDecidable && (
            <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
              This application has already been{" "}
              {application.status === "APPROVED" ? "approved" : "rejected"}.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          {isDecidable && action && (
            <button
              onClick={submit}
              disabled={
                loading ||
                (action === "APPROVE" && !organizationId) ||
                (action === "REJECT" && !notes.trim())
              }
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>Confirm</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED SUBCOMPONENTS
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  multiline = false,
}: {
  icon: any;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div
          className={`text-sm text-slate-900 ${
            multiline ? "whitespace-pre-wrap" : ""
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function DecisionButton({
  active,
  onClick,
  icon: Icon,
  label,
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  variant?: "default" | "success" | "danger";
}) {
  const styles = {
    default: active
      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    success: active
      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: active
      ? "border-red-500 bg-red-50 text-red-700"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${styles[variant]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}