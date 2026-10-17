"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  X,
  Send,
  CheckCircle2,
  ShoppingCart,
  Building2,
  Warehouse,
  Truck,
  Trash2,
  Info,
  ChevronRight,
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
    organizationId: string | null;
  };
}

interface InputItem {
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
  category: string | null;
  storageRequirements: string | null;
  isActive: boolean;
  supplier: {
    id: string;
    businessName: string;
    verified: boolean;
    deliveryRegions: string | null;
    contactName: string | null;
    contactEmail: string | null;
  };
}

interface InputsResponse {
  items: InputItem[];
  categories: string[];
  types: string[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface CartLine {
  item: InputItem;
  quantity: number;
  notes: string;
}

// ============================================================
// MAIN
// ============================================================

export default function InputsClient({ user }: Props) {
  const router = useRouter();

  const [data, setData] = useState<InputsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Cart
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const cartCount = Object.keys(cart).length;
  const cartTotal = useMemo(
    () =>
      Object.values(cart).reduce((sum, line) => {
        const price = line.item.unitCost ?? 0;
        return sum + price * line.quantity;
      }, 0),
    [cart]
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("search", debounced);
        if (typeFilter !== "ALL") params.set("type", typeFilter);
        if (categoryFilter !== "ALL") params.set("category", categoryFilter);
        params.set("page", String(page));
        params.set("pageSize", "20");

        const res = await fetch(
          `/api/dashboard/inputs?${params.toString()}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error ?? "Failed to load inputs");
        if (!cancelled) setData(json.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, typeFilter, categoryFilter, page]);

  // ---------------------------------------------------------
  // Cart helpers
  // ---------------------------------------------------------
  const addToCart = (item: InputItem) => {
    setCart((prev) => {
      if (prev[item.id]) return prev;
      return {
        ...prev,
        [item.id]: { item, quantity: 1, notes: "" },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: qty },
    }));
  };

  const updateLineNotes = (itemId: string, notes: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], notes },
    }));
  };

  const clearCart = () => setCart({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inputs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse inputs from suppliers in your organization and request what
            you need.
          </p>
        </div>

        <Link
          href="/dashboard/input-requests"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          My requests
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inputs by name, code, manufacturer…"
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
            {(data?.types ?? []).map((t) => (
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
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Content + cart sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-16 text-center">
              <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                No inputs available
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Suppliers in your organization haven't listed any items yet,
                or they don't match your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    inCart={!!cart[item.id]}
                    onAdd={() => addToCart(item)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.total > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  <span>
                    Page{" "}
                    <strong className="text-slate-900">
                      {data.pagination.page}
                    </strong>{" "}
                    of {data.pagination.totalPages} ·{" "}
                    {data.pagination.total.toLocaleString()} items
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
            </>
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Request basket
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {cartCount}
              </span>
            </div>

            {cartCount === 0 ? (
              <div className="mt-6 py-8 text-center text-xs text-slate-500">
                Pick items from the list to add them here.
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {Object.values(cart).map((line) => (
                    <li
                      key={line.item.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {line.item.itemName}
                          </div>
                          <div className="truncate text-[10px] text-slate-500">
                            {line.item.supplier.businessName}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(line.item.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(line.item.id, line.quantity - 1)
                          }
                          className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              line.item.id,
                              Number(e.target.value)
                            )
                          }
                          className="h-7 w-14 rounded border border-slate-200 bg-white px-2 text-center text-xs focus:border-emerald-400 focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(line.item.id, line.quantity + 1)
                          }
                          className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <span className="ml-auto text-[11px] text-slate-500">
                          {line.item.unitType}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {line.item.currency}{" "}
                          {(line.item.unitCost ?? 0).toLocaleString()} each
                        </span>
                        <span className="font-semibold text-slate-900">
                          {line.item.currency}{" "}
                          {(
                            (line.item.unitCost ?? 0) * line.quantity
                          ).toLocaleString()}
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={line.notes}
                        onChange={(e) =>
                          updateLineNotes(line.item.id, e.target.value)
                        }
                        className="mt-2 h-7 w-full rounded border border-slate-200 bg-white px-2 text-[11px] focus:border-emerald-400 focus:outline-none"
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">Estimated total</span>
                  <span className="text-base font-bold text-slate-900">
                    ₦{cartTotal.toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setRequestModalOpen(true)}
                    className="flex-[2] inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Request modal */}
      {requestModalOpen && (
        <RequestModal
          cart={cart}
          total={cartTotal}
          onClose={() => setRequestModalOpen(false)}
          onSuccess={(requestNumber) => {
            setRequestModalOpen(false);
            clearCart();
            router.push("/dashboard/input-requests");
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// ITEM CARD
// ============================================================

function ItemCard({
  item,
  inCart,
  onAdd,
}: {
  item: InputItem;
  inCart: boolean;
  onAdd: () => void;
}) {
  const lowStock =
    item.minStock != null && item.currentStock <= item.minStock;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {item.itemName}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {item.itemType.replace(/_/g, " ")}
            </span>
            {item.category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {item.category}
              </span>
            )}
            {item.manufacturer && <span>{item.manufacturer}</span>}
          </div>
        </div>
        {inCart && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            In basket
          </span>
        )}
      </div>

      {item.description && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
          {item.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-slate-600">
          <Warehouse className="h-3.5 w-3.5 text-slate-400" />
          <span
            className={
              lowStock ? "font-medium text-amber-700" : "text-slate-700"
            }
          >
            {item.currentStock.toLocaleString()} {item.unitType}
          </span>
        </div>
        {item.storageRequirements && (
          <div className="flex items-center gap-1 text-slate-500">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">Storage: {item.storageRequirements}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <Building2 className="h-3.5 w-3.5 text-slate-400" />
        <span className="truncate">
          <span className="font-medium text-slate-800">
            {item.supplier.businessName}
          </span>
          {item.supplier.verified && (
            <span className="ml-1 text-[10px] text-emerald-700">✓ verified</span>
          )}
        </span>
      </div>

      {item.supplier.deliveryRegions && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <Truck className="h-3 w-3 text-slate-400" />
          Delivers to: {item.supplier.deliveryRegions}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="text-sm font-semibold text-slate-900">
          {item.currency} {(item.unitCost ?? 0).toLocaleString()}
          <span className="text-[10px] font-normal text-slate-500">
            {" "}
            / {item.unitType}
          </span>
        </div>
        <button
          onClick={onAdd}
          disabled={inCart}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {inCart ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Added
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// REQUEST MODAL
// ============================================================

function RequestModal({
  cart,
  total,
  onClose,
  onSuccess,
}: {
  cart: Record<string, CartLine>;
  total: number;
  onClose: () => void;
  onSuccess: (requestNumber: string) => void;
}) {
  const [form, setForm] = useState({
    farmId: "",
    neededByDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [farms, setFarms] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingFarms, setLoadingFarms] = useState(true);

  // Load farmer's farms for optional linking
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/farms", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!cancelled && json.success) {
          setFarms(
            (json.data as Array<{ id: string; name: string }>).map((f) => ({
              id: f.id,
              name: f.name,
            }))
          );
        }
      } catch {
        // non-fatal, the field is optional
      } finally {
        if (!cancelled) setLoadingFarms(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = Object.values(cart).map((line) => ({
        inventoryId: line.item.id,
        quantity: line.quantity,
        notes: line.notes || undefined,
      }));

      const res = await fetch("/api/dashboard/inputs/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          farmId: form.farmId || null,
          neededByDate: form.neededByDate || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to create request");
      onSuccess(data.data.requestNumber);
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
            <h2 className="text-lg font-bold text-slate-900">
              Submit input request
            </h2>
            <p className="text-xs text-slate-500">
              Your request will be sent to your organization admin for
              approval.
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

          <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {Object.keys(cart).length} item
                {Object.keys(cart).length === 1 ? "" : "s"}
              </span>
              <span className="text-base font-bold text-slate-900">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Link to farm (optional)
              </label>
              <select
                value={form.farmId}
                onChange={(e) =>
                  setForm({ ...form, farmId: e.target.value })
                }
                disabled={loadingFarms}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none disabled:opacity-60"
              >
                <option value="">
                  {loadingFarms ? "Loading farms…" : "Not linked to a farm"}
                </option>
                {farms.map((f) => (
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
                value={form.neededByDate}
                onChange={(e) =>
                  setForm({ ...form, neededByDate: e.target.value })
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Any additional information for your admin or supplier…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
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
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}