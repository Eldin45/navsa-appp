// src/app/change-password/page.client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { SYSTEM_CONFIG } from "~/lib/config";

// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(password: string) {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least 1 lowercase letter");
  if (!/\d/.test(password)) errors.push("At least 1 number");
  if (!/[@$!%*?&]/.test(password))
    errors.push("At least 1 special character (@$!%*?&)");
  return { isValid: errors.length === 0, errors };
}

// ============================================================
// COMPONENT
// ============================================================

export default function ChangePasswordClient() {
  const router = useRouter();
  const { update } = useSession();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ----------------------------------------------------------
  // Password strength indicator
  // ----------------------------------------------------------

  const PasswordStrength = ({ password }: { password: string }) => {
    const reqs = [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "1 uppercase letter", met: /[A-Z]/.test(password) },
      { label: "1 lowercase letter", met: /[a-z]/.test(password) },
      { label: "1 number", met: /\d/.test(password) },
      { label: "1 special character", met: /[@$!%*?&]/.test(password) },
    ];
    const metCount = reqs.filter((r) => r.met).length;
    const strength =
      metCount === 5 ? "Strong" : metCount >= 3 ? "Medium" : "Weak";
    const color =
      metCount === 5
        ? "text-green-600"
        : metCount >= 3
          ? "text-yellow-600"
          : "text-red-600";

    if (!password) return null;

    return (
      <div className="mt-2 space-y-1">
        <p className={`text-xs font-medium ${color}`}>
          Password strength: {strength}
        </p>
        <div className="space-y-0.5">
          {reqs.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              {r.met ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-gray-300" />
              )}
              <span className={r.met ? "text-green-600" : "text-gray-400"}>
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pv = validatePassword(password);
    if (!pv.isValid) {
      return setError("Password does not meet requirements.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      // 1. Persist the new password
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess(true);

      // 2. Force an immediate JWT refresh so `mustChangePassword`
      //    flips to `false` without waiting for the 15s auto-refresh.
      await update({ mustChangePassword: false });

      // 3. Read the fresh session to pick the right landing route.
      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const session = await sessionRes.json();
      const role = session?.user?.role as string | undefined;

      console.log("🔄 [CHANGE-PASSWORD] redirect decision:", {
        role,
        mustChangePassword: session?.user?.mustChangePassword,
      });

      setTimeout(() => {
        const target =
          role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN"
            ? "/admin/dashboard"
            : "/dashboard";
        router.push(target);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-white to-[#f1f8e9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 p-3">
            <Image
              src={SYSTEM_CONFIG.logo}
              alt="NAVSA"
              width={80}
              height={80}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            <span className="text-[#2e7d32]">NAVSA</span>{" "}
            <span className="text-gray-700">Platform</span>
          </h1>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Set a New Password
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              For security, please replace your default password before
              continuing.
            </p>
          </div>

          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-sm font-medium text-green-800">
                Password changed! Redirecting…
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2e7d32] bg-gray-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {show ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2e7d32] bg-gray-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2e7d32] text-white rounded-xl hover:bg-[#1b5e20] disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  "Change Password & Continue"
                )}
              </button>

              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}