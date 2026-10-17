"use client";

import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  Truck,
  Shield,
  Check,
} from "lucide-react";
import Image from "next/image";
import { SYSTEM_CONFIG } from "~/lib/config";

type ForgotPasswordStep = "phone" | "reset" | null;

const validatePassword = (password: string) => {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least 1 lowercase letter");
  if (!/\d/.test(password)) errors.push("At least 1 number");
  if (!/[@$!%*?&]/.test(password))
    errors.push("At least 1 special character (@$!%*?&)");
  return { isValid: errors.length === 0, errors };
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [forgotPasswordStep, setForgotPasswordStep] =
    useState<ForgotPasswordStep>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [pinId, setPinId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [resetPasswordErrors, setResetPasswordErrors] = useState<string[]>([]);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    router.prefetch(callbackUrl);
    router.prefetch("/admin");
    router.prefetch("/dashboard");
    router.prefetch("/change-password");
  }, [router, callbackUrl]);

  useEffect(() => {
    const remembered = localStorage.getItem("navsa_remember_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem("navsa_remember_email", email);
    } else if (!rememberMe) {
      localStorage.removeItem("navsa_remember_email");
    }
  }, [rememberMe, email]);

  // ============================================================
  // POST-AUTH ROUTING
  // ============================================================
const routeAfterAuth = async (fallback: string = callbackUrl) => {
  const session = await getSession();

  if (!session?.user) {
    router.push(fallback);
    return;
  }

  const role = String((session.user as any).role ?? "").toUpperCase();
  const status = (session.user as any).status;
  const mustChangePassword = (session.user as any).mustChangePassword;

  console.log("🔄 [LOGIN] routeAfterAuth:", { role, status, mustChangePassword });

  if (status === "PENDING_VERIFICATION") {
    router.push("/pending-verification");
    return;
  }

  if (mustChangePassword) {
    router.push("/change-password");
    return;
  }

  switch (role) {
    case "SUPER_ADMIN":
    case "PLATFORM_ADMIN":
      router.push("/admin");
      return;
    case "ADMIN":
    case "ORG_ADMIN":
    case "SUPPLIER":
    case "FARMER":
      router.push("/dashboard");
      return;
    default:
      router.push(fallback || "/dashboard");
      return;
  }
};

  // ============================================================
  // SIGN IN
  // ============================================================
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) return setError("Please fill in all fields");
    if (!/\S+@\S+\.\S+/.test(email))
      return setError("Please enter a valid email");

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : "Login failed. Please try again"
        );
        return;
      }
      if (!result?.ok) return setError("Login failed. Please try again.");

      await routeAfterAuth(callbackUrl);
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD — SEND PIN
  // ============================================================
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotPasswordSuccess("");

    if (!phoneNumber) return setError("Please enter your phone number");
    const phoneRegex = /^(0[7-9][0-1]\d{8})$/;
    if (!phoneRegex.test(phoneNumber))
      return setError("Enter a valid Nigerian phone number");

    setForgotPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/password-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send PIN");

      setForgotPasswordStep("reset");
      setForgotPasswordSuccess("A 6-digit PIN has been sent to your phone!");
      if (data.pinId) setPinId(data.pinId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD — RESET
  // ============================================================
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetPasswordErrors([]);

    if (!pin || !newPassword || !confirmPassword)
      return setError("Please fill in all fields");
    if (pin.length !== 6) return setError("PIN must be 6 digits");

    const pv = validatePassword(newPassword);
    if (!pv.isValid) {
      setResetPasswordErrors(pv.errors);
      return setError("Password does not meet security requirements");
    }
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match");

    setForgotPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          password: newPassword,
          token: pinId,
          phone: phoneNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to reset password");

      closeForgotPassword();
      alert("Password reset successful! Please sign in.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setForgotPasswordStep(null);
    setPhoneNumber("");
    setPin("");
    setNewPassword("");
    setConfirmPassword("");
    setPinId("");
    setError("");
    setForgotPasswordSuccess("");
    setResetPasswordErrors([]);
  };

  const PasswordStrength = ({ password }: { password: string }) => {
    const requirements = [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "At least 1 uppercase letter", met: /[A-Z]/.test(password) },
      { label: "At least 1 lowercase letter", met: /[a-z]/.test(password) },
      { label: "At least 1 number", met: /\d/.test(password) },
      { label: "At least 1 special character", met: /[@$!%*?&]/.test(password) },
    ];
    const met = requirements.filter((r) => r.met).length;
    const strength = met === 5 ? "Strong" : met >= 3 ? "Medium" : "Weak";
    const color =
      met === 5
        ? "text-green-600"
        : met >= 3
          ? "text-yellow-600"
          : "text-red-600";
    if (!password) return null;
    return (
      <div className="mt-2 space-y-1">
        <p className={`text-xs font-medium ${color}`}>
          Password strength: {strength}
        </p>
        <div className="space-y-0.5">
          {requirements.map((r, i) => (
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

  // ============================================================
  // FORGOT PASSWORD UI
  // ============================================================
  if (forgotPasswordStep) {
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
            <p className="mt-2 text-sm text-gray-600">Password Recovery</p>
          </div>

          <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {forgotPasswordStep === "phone"
                ? "Reset Your Password"
                : "Create New Password"}
            </h2>

            {forgotPasswordSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <p className="text-sm font-medium text-green-800">
                  {forgotPasswordSuccess}
                </p>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form
              onSubmit={
                forgotPasswordStep === "phone"
                  ? handleSendResetOtp
                  : handlePasswordReset
              }
              className="space-y-5"
            >
              {forgotPasswordStep === "phone" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registered Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 11)
                        )
                      }
                      placeholder="08012345678"
                      required
                      type="tel"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2e7d32] bg-gray-50"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <input
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6-digit PIN"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest font-mono"
                  />
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl"
                  />
                  <PasswordStrength password={newPassword} />
                  {resetPasswordErrors.length > 0 && (
                    <ul className="text-xs text-red-600 space-y-0.5">
                      {resetPasswordErrors.map((e, i) => (
                        <li key={i}>• {e}</li>
                      ))}
                    </ul>
                  )}
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="Confirm new password"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl"
                  />
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 px-4 py-3 bg-[#2e7d32] text-white rounded-xl hover:bg-[#1b5e20] disabled:opacity-50 font-medium"
                >
                  {forgotPasswordLoading ? (
                    <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                  ) : forgotPasswordStep === "phone" ? (
                    "Send PIN"
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN SIGN-IN UI
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-white to-[#f1f8e9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 p-3">
            <Image src={SYSTEM_CONFIG.logo} alt="NAVSA" width={80} height={80} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            <span className="text-[#2e7d32]">NAVSA</span>{" "}
            <span className="text-gray-700">Platform</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">{SYSTEM_CONFIG.fullName}</p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-sm text-gray-600 mb-6">Access your NAVSA account</p>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@navsa.ng"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2e7d32] bg-gray-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordStep("phone")}
                  className="text-sm font-medium text-[#2e7d32] hover:text-[#1b5e20]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2e7d32] bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[#2e7d32] focus:ring-[#2e7d32] border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2e7d32] text-white rounded-xl hover:bg-[#1b5e20] disabled:opacity-50 font-medium"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mx-auto" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-start gap-2 text-gray-600">
              <Truck className="h-4 w-4 mt-0.5 text-gray-400" />
              <span>
                <strong>Supplier?</strong>{" "}
                <Link
                  href="/suppliers/apply"
                  className="text-[#2e7d32] underline"
                >
                  Submit an application
                </Link>{" "}
                to be reviewed.
              </span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <Building2 className="h-4 w-4 mt-0.5 text-gray-400" />
              <span>
                <strong>Admin / Farmer?</strong> Accounts are created by your
                organization.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Need help? </span>
            <Link
              href={SYSTEM_CONFIG.supportUrl}
              className="font-medium text-[#2e7d32]"
            >
              Contact Support
            </Link>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            © {new Date().getFullYear()} NAVSA. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}