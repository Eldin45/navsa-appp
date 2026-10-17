// src/lib/roles.ts
import type { UserRole } from "@prisma/client";

/**
 * Every role that has "org admin"-level access:
 *  - SUPER_ADMIN   → platform-wide
 *  - ADMIN         → full control of their org
 *  - ORG_ADMIN     → sub-admin of their org (no admin-management powers)
 */
export const ADMIN_LIKE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "ORG_ADMIN",
];

/**
 * Roles that share the org-admin workspace (sidebar, pages, etc.)
 * but excludes SUPER_ADMIN (they use the /admin console).
 */
export const ORG_ADMIN_LIKE_ROLES: UserRole[] = ["ADMIN", "ORG_ADMIN"];

export function isAdminLike(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_LIKE_ROLES.includes(role as UserRole);
}

export function isOrgAdminLike(role: string | null | undefined): boolean {
  if (!role) return false;
  return ORG_ADMIN_LIKE_ROLES.includes(role as UserRole);
}

/**
 * Where a freshly signed-in user should land.
 * Mirrors what the middleware and dashboard pages expect.
 */
export function resolveDashboardForRole(role: string | null | undefined): string {
  if (role === "SUPER_ADMIN") return "/admin/dashboard";
  if (role === "ADMIN" || role === "ORG_ADMIN") return "/dashboard";
  if (role === "FARMER" || role === "SUPPLIER") return "/dashboard";
  console.warn("[roles] resolveDashboardForRole: unknown role:", role);
  return "/unauthorized";
}