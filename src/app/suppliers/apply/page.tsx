"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Truck,
  User,
  Building2,
  MapPin,
  Package,
  FileText,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const INITIAL_FORM = {
  contact_full_name: "",
  contact_email: "",
  contact_phone: "",
  business_name: "",
  business_type: "",
  registration_number: "",
  tax_id: "",
  country: "NIGERIA",
  state: "",
  city: "",
  address: "",
  website: "",
  product_categories: "",
  delivery_regions: "",
  years_in_business: "",
  description: "",
};

export default function SupplierApplicationPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ appNum: string } | null>(null);

  const update = (k: keyof typeof INITIAL_FORM, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        years_in_business: form.years_in_business
          ? Number(form.years_in_business)
          : undefined,
        website: form.website || undefined,
      };
      const res = await fetch("/api/suppliers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to submit");
      setSuccess({ appNum: data.data.application_number });
    } catch (err: any) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Success screen ───────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center border border-green-100">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            We&apos;ve received your application and will review it shortly.
            You&apos;ll receive an email at the contact address you provided.
          </p>
          <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Application Number
            </p>
            <p className="font-mono text-lg font-semibold text-gray-900">
              {success.appNum}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-green-700 mb-4 shadow-lg shadow-green-700/20">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Become a Supplier
          </h1>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            Join our network of agricultural suppliers. Fill in your business
            details and our team will review your application.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Submission failed
              </p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* ── SECTION 1: Contact Information ── */}
          <Section
            icon={<User className="h-5 w-5" />}
            title="Contact Information"
            description="Who should we reach out to about this application?"
          >
            <Field label="Contact Full Name" required>
              <input
                required
                value={form.contact_full_name}
                onChange={(e) => update("contact_full_name", e.target.value)}
                placeholder="Jane Doe"
                className={inputCls}
              />
            </Field>
            <Field label="Contact Email" required>
              <input
                required
                type="email"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                placeholder="jane@company.com"
                className={inputCls}
              />
            </Field>
            <Field label="Contact Phone" required>
              <input
                required
                type="tel"
                value={form.contact_phone}
                onChange={(e) => update("contact_phone", e.target.value)}
                placeholder="+234 801 234 5678"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── SECTION 2: Business Information ── */}
          <Section
            icon={<Building2 className="h-5 w-5" />}
            title="Business Information"
            description="Tell us about your company."
          >
            <Field label="Business Name" required className="sm:col-span-2">
              <input
                required
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
                placeholder="Agro Supplies Ltd."
                className={inputCls}
              />
            </Field>
            <Field label="Business Type">
              <select
                value={form.business_type}
                onChange={(e) => update("business_type", e.target.value)}
                className={inputCls}
              >
                <option value="">Select a type…</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="RETAILER">Retailer</option>
                <option value="IMPORTER">Importer</option>
                <option value="AGGREGATOR">Aggregator</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Years in Business">
              <input
                type="number"
                min="0"
                value={form.years_in_business}
                onChange={(e) =>
                  update("years_in_business", e.target.value)
                }
                placeholder="5"
                className={inputCls}
              />
            </Field>
            <Field label="Registration Number">
              <input
                value={form.registration_number}
                onChange={(e) =>
                  update("registration_number", e.target.value)
                }
                placeholder="RC-1234567"
                className={inputCls}
              />
            </Field>
            <Field label="Tax ID">
              <input
                value={form.tax_id}
                onChange={(e) => update("tax_id", e.target.value)}
                placeholder="TIN-00000000"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── SECTION 3: Location ── */}
          <Section
            icon={<MapPin className="h-5 w-5" />}
            title="Location"
            description="Where are you based and where do you deliver?"
          >
            <Field label="Country">
              <select
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className={inputCls}
              >
                <option value="NIGERIA">Nigeria</option>
                <option value="GHANA">Ghana</option>
                <option value="KENYA">Kenya</option>
                <option value="SOUTH_AFRICA">South Africa</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="State / Region">
              <input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                placeholder="Lagos"
                className={inputCls}
              />
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Ikeja"
                className={inputCls}
              />
            </Field>
            <Field label="Website" className="sm:col-span-2">
              <input
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://yourcompany.com"
                className={inputCls}
              />
            </Field>
            <Field label="Business Address" className="sm:col-span-2">
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street, building, landmark…"
                rows={2}
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── SECTION 4: Products & Delivery ── */}
          <Section
            icon={<Package className="h-5 w-5" />}
            title="Products & Delivery"
            description="What do you supply, and where can you deliver?"
          >
            <Field
              label="Product Categories"
              hint="Separate with commas"
              className="sm:col-span-2"
            >
              <input
                value={form.product_categories}
                onChange={(e) =>
                  update("product_categories", e.target.value)
                }
                placeholder="Seeds, Fertilizers, Pesticides, Farm Equipment…"
                className={inputCls}
              />
            </Field>
            <Field
              label="Delivery Regions"
              hint="Separate with commas"
              className="sm:col-span-2"
            >
              <input
                value={form.delivery_regions}
                onChange={(e) =>
                  update("delivery_regions", e.target.value)
                }
                placeholder="Lagos, Abuja, Kano, Ibadan…"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── SECTION 5: Description ── */}
          <Section
            icon={<FileText className="h-5 w-5" />}
            title="About Your Business"
            description="Give us a short overview of what you do."
          >
            <Field
              label="Description"
              className="sm:col-span-2"
              hint={`${form.description.length}/1000`}
            >
              <textarea
                value={form.description}
                onChange={(e) =>
                  update("description", e.target.value)
                }
                placeholder="Tell us about your business, years of experience, key products, and what makes you unique…"
                rows={4}
                maxLength={1000}
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── Actions ── */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end px-6 sm:px-10 py-6 bg-gray-50 border-t border-gray-100">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-white transition font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold shadow-lg shadow-green-700/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          By submitting, you agree to our review process. We typically respond
          within 3–5 business days.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// REUSABLE UI PRIMITIVES
// ============================================================

const inputCls =
  "w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition";

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 sm:px-10 py-7 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}