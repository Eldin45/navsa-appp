// src/lib/session.ts
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

// ============================================================
// TYPES
// ============================================================

export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  phone: string | null;
  role: string;
  status: string;
  organizationId: string | null;
  mustChangePassword: boolean;
  wallets: {
    id: string;
    type: string;
    accountNumber: string;
    palmPayAccountNumber: string | null;
    palmPayBankName: string | null;
    palmPayAccountName: string | null;
    palmPayStatus: string | null;
  }[];
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Roles that belong in the /admin console.
 * SUPER_ADMIN      → the platform owner
 * PLATFORM_ADMIN   → secondary admin created by SUPER_ADMIN
 */
const ADMIN_CONSOLE_ROLES = ["SUPER_ADMIN", "PLATFORM_ADMIN"] as const;

/**
 * Any role with admin-like privileges.
 */
const ADMIN_LIKE_ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "ADMIN",
  "ORG_ADMIN",
] as const;

// ============================================================
// HELPERS
// ============================================================

function normalizeRole(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim().toUpperCase();
}

// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = async (): Promise<UserSession | null> => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    phone: session.user.phone,
    role: normalizeRole(session.user.role),
    status: session.user.status,
    organizationId: session.user.organizationId,
    mustChangePassword: session.user.mustChangePassword ?? false,
    wallets: session.user.wallets ?? [],
  };
};

// ============================================================
// ROLE → DASHBOARD
// ============================================================

export const resolveDashboardForRole = (role: string): string => {
  const r = normalizeRole(role);
  switch (r) {
    case "SUPER_ADMIN":
    case "PLATFORM_ADMIN":
      return "/admin/dashboard";
    case "ADMIN":
    case "ORG_ADMIN":
    case "SUPPLIER":
    case "FARMER":
      return "/dashboard";
    default:
      console.warn("⚠️ resolveDashboardForRole: unknown role:", role);
      return "/dashboard";
  }
};

// ============================================================
// ROLE GUARDS
// ============================================================

/** Strictly the platform owner. */
export const isSuperAdmin = (user: UserSession | null): boolean =>
  normalizeRole(user?.role) === "SUPER_ADMIN";

/** SUPER_ADMIN or PLATFORM_ADMIN — the pair with /admin access. */
export const isPlatformAdmin = (user: UserSession | null): boolean => {
  const r = normalizeRole(user?.role);
  return ADMIN_CONSOLE_ROLES.includes(
    r as (typeof ADMIN_CONSOLE_ROLES)[number]
  );
};

/** Organization owner (ADMIN). */
export const isAdmin = (user: UserSession | null): boolean =>
  normalizeRole(user?.role) === "ADMIN";

/** Organization owner or org sub-admin. */
export const isOrgAdmin = (user: UserSession | null): boolean => {
  const r = normalizeRole(user?.role);
  return r === "ADMIN" || r === "ORG_ADMIN";
};

/** Any admin-like role (for loose checks only). */
export const isAdminLike = (user: UserSession | null): boolean => {
  const r = normalizeRole(user?.role);
  return ADMIN_LIKE_ROLES.includes(r as (typeof ADMIN_LIKE_ROLES)[number]);
};

/** Platform owner — strict. Use for destructive actions. */
export const isSystemOwner = (user: UserSession | null): boolean =>
  normalizeRole(user?.role) === "SUPER_ADMIN";

export const hasRole = (
  user: UserSession | null,
  allowedRoles: string[]
): boolean => {
  const r = normalizeRole(user?.role);
  return allowedRoles.map(normalizeRole).includes(r);
};

// ============================================================
// REQUIRE AUTH
// ============================================================

export const requireAuth = async (
  redirectTo: string = "/",
  requiredRoles?: string | string[]
): Promise<UserSession> => {
  const user = await getCurrentUser();

  if (!user) redirect(redirectTo);

  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    if (!hasRole(user, roles)) redirect("/unauthorized");
  }

  return user;
};

// ============================================================
// WALLET HELPERS
// ============================================================

export const getWalletOfType = (
  user: UserSession | null,
  type: string
): UserSession["wallets"][number] | undefined =>
  user?.wallets.find((w) => w.type === type);