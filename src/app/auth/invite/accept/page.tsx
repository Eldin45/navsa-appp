// src/app/auth/invite/accept/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react"; // Add Suspense
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

// 1. Move the component that uses useSearchParams into a child
function AcceptInviteForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Missing invite token.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <ShieldCheck className="mx-auto h-12 w-12 text-[#2e7d32]" />
        <h1 className="text-2xl font-bold mt-2">Accept Admin Invitation</h1>
        <p className="text-sm text-gray-600 mt-1">Set your password to activate your account</p>
      </div>

      {success ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
          <p className="text-sm text-green-800">Account activated! Redirecting…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-gray-50"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {show ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 bg-[#2e7d32] text-white rounded-xl hover:bg-[#1b5e20] disabled:opacity-50 font-medium"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Activate Account"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already activated? <Link href="/" className="text-[#2e7d32] font-medium">Sign in</Link>
          </p>
        </form>
      )}
    </div>
  );
}

// 2. Default export wraps the child in Suspense
export default function AcceptAdminInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-white to-[#f1f8e9] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-[#2e7d32]" />
          <p className="text-sm text-gray-600 mt-4">Loading invitation…</p>
        </div>
      }>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}