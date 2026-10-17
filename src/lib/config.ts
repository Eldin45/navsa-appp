// src/lib/config.ts
export const SYSTEM_CONFIG = {
  name: "NAVSA",
  fullName: "National Adopted Village for Smart Agriculture",
  tagline: "Smart Agriculture Management Platform",
  supportEmail: "support@navsa.ng",
  supportUrl: "/support",
  termsUrl: "/terms",
  privacyUrl: "/privacy",
  logo: "/uploads/NITDA.png",
} as const;

export type SystemConfig = typeof SYSTEM_CONFIG;