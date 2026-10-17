// src/app/dashboard/farmers/import/page.client.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface PreviewRow {
  rowNumber: number;
  full_name: string;
  email: string;
  phone: string;
  farmer_code?: string;
  primary_crops?: string;
  years_farming?: number | null;
  total_land_ha?: number | null;
  status: "ok" | "error";
  errorMessage?: string;
}

interface CommitResult {
  rowNumber: number;
  email: string;
  status: "created" | "skipped" | "error";
  message?: string;
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
}

type Step = "upload" | "preview" | "done";

// ============================================================
// MAIN
// ============================================================

export default function ImportFarmersClient({ user }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState("");
  const [results, setResults] = useState<CommitResult[]>([]);

  // ----------------------------------------------------------
  // 1. Upload / parse
  // ----------------------------------------------------------

  const onFile = async (f: File) => {
    setFile(f);
    setParseError("");
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/dashboard/farmers/import/parse", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse file");
      }
      const parsed: PreviewRow[] = data.data.rows ?? [];
      setRows(parsed);
      setSelected(
        new Set(
          parsed.filter((r) => r.status === "ok").map((r) => r.rowNumber)
        )
      );
      setStep("preview");
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  // ----------------------------------------------------------
  // 2. Row edit
  // ----------------------------------------------------------

  const updateRow = (rowNumber: number, patch: Partial<PreviewRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, ...patch } : r))
    );
  };

  const toggleRow = (rowNumber: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const toggleAll = () => {
    const validRows = rows
      .filter((r) => r.status === "ok")
      .map((r) => r.rowNumber);
    const allSelected = validRows.every((n) => selected.has(n));
    setSelected(allSelected ? new Set() : new Set(validRows));
  };

  // ----------------------------------------------------------
  // 3. Commit
  // ----------------------------------------------------------

  const commit = async () => {
    const payload = rows.filter((r) => selected.has(r.rowNumber));
    if (payload.length === 0) {
      setCommitError("Select at least one row to import.");
      return;
    }
    setCommitting(true);
    setCommitError("");
    try {
      const res = await fetch("/api/dashboard/farmers/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: payload.map((r) => ({
            rowNumber: r.rowNumber,
            full_name: r.full_name,
            email: r.email,
            phone: r.phone,
            farmer_code: r.farmer_code,
            primary_crops: r.primary_crops,
            years_farming: r.years_farming,
            total_land_ha: r.total_land_ha,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import farmers");
      }
      setResults(data.data.results ?? []);
      setStep("done");
      router.refresh();
    } catch (err: any) {
      setCommitError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  // ----------------------------------------------------------
  // Reset
  // ----------------------------------------------------------

  const reset = () => {
    setFile(null);
    setRows([]);
    setSelected(new Set());
    setResults([]);
    setParseError("");
    setCommitError("");
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ----------------------------------------------------------
  // Derived
  // ----------------------------------------------------------

  const validCount = rows.filter((r) => r.status === "ok").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const selectedCount = Array.from(selected).filter((n) =>
    rows.some((r) => r.rowNumber === n && r.status === "ok")
  ).length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/farmers"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to farmers
        </Link>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-slate-900">
            Bulk import farmers
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a spreadsheet (.xlsx, .xls) or CSV. Rows are validated before
            being committed.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        <StepBadge
          active={step === "upload"}
          done={step !== "upload"}
          label="1. Upload"
        />
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <StepBadge
          active={step === "preview"}
          done={step === "done"}
          label="2. Preview"
        />
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <StepBadge active={step === "done"} done={false} label="3. Done" />
      </div>

      {/* STEP 1 */}
      {step === "upload" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Upload className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Upload a file
                  </h2>
                  <p className="text-xs text-slate-500">
                    Max 5 MB · .xlsx, .xls, .csv
                  </p>
                </div>
              </div>

              <label
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={onPickFile}
                className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  Click to choose a file or drag & drop
                </p>
                <p className="text-xs text-slate-500">
                  {file ? file.name : "No file selected"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={onInputChange}
                  className="hidden"
                />
              </label>

              {parseError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </div>
              )}

              {parsing && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing file…
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Need a template?
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Download the CSV template with the correct columns.
            </p>
            <a
              href="/api/dashboard/farmers/import-template"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download template
            </a>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Required columns
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• <code>full_name</code></li>
                <li>• <code>email</code></li>
                <li>• <code>phone</code></li>
              </ul>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Optional
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• <code>farmer_code</code></li>
                <li>• <code>primary_crops</code></li>
                <li>• <code>years_farming</code></li>
                <li>• <code>total_land_ha</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === "preview" && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} valid
                </span>
                {errorCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <XCircle className="h-3 w-3" />
                    {errorCount} with errors
                  </span>
                )}
                <span className="text-slate-500">
                  {selectedCount} selected for import
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </button>
                <button
                  type="button"
                  onClick={commit}
                  disabled={committing || selectedCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {committing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {selectedCount} farmer
                      {selectedCount === 1 ? "" : "s"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {commitError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {commitError}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={
                          validCount > 0 && selectedCount === validCount
                        }
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Farmer Code</th>
                    <th className="px-3 py-3">Crops</th>
                    <th className="px-3 py-3">Years</th>
                    <th className="px-3 py-3">Land (ha)</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={r.status === "error" ? "bg-red-50/40" : ""}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          disabled={r.status === "error"}
                          checked={selected.has(r.rowNumber)}
                          onChange={() => toggleRow(r.rowNumber)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {r.rowNumber}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.full_name}
                          onChange={(e) =>
                            updateRow(r.rowNumber, {
                              full_name: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.email}
                          onChange={(e) =>
                            updateRow(r.rowNumber, { email: e.target.value })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.phone}
                          onChange={(e) =>
                            updateRow(r.rowNumber, { phone: e.target.value })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.farmer_code ?? ""}
                          onChange={(e) =>
                            updateRow(r.rowNumber, {
                              farmer_code: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.primary_crops ?? ""}
                          onChange={(e) =>
                            updateRow(r.rowNumber, {
                              primary_crops: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={r.years_farming ?? ""}
                          onChange={(e) =>
                            updateRow(r.rowNumber, {
                              years_farming: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={r.total_land_ha ?? ""}
                          onChange={(e) =>
                            updateRow(r.rowNumber, {
                              total_land_ha: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {r.status === "ok" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </span>
                        ) : (
                          <span
                            title={r.errorMessage}
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700"
                          >
                            <XCircle className="h-3 w-3" />
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* STEP 3 */}
      {step === "done" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Import complete
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {results.filter((r) => r.status === "created").length}{" "}
                  farmers created,{" "}
                  {results.filter((r) => r.status === "skipped").length}{" "}
                  skipped, {results.filter((r) => r.status === "error").length}{" "}
                  failed.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Per-row results
              </h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Row</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.rowNumber}>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {r.rowNumber}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-700">
                        {r.email}
                      </td>
                      <td className="px-4 py-2">
                        {r.status === "created" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Created
                          </span>
                        )}
                        {r.status === "skipped" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            <AlertCircle className="h-3 w-3" />
                            Skipped {r.message ? `— ${r.message}` : ""}
                          </span>
                        )}
                        {r.status === "error" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                            <XCircle className="h-3 w-3" />
                            {r.message ?? "Failed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={reset}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Import another file
            </button>
            <Link
              href="/dashboard/farmers"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Back to farmers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function StepBadge({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-600 text-white"
          : done
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}