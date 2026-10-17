// src/lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcrypt";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";

// ============================================================
// MODULE AUGMENTATION
// ============================================================

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    status: string;
    organizationId: string | null;
    phone: string | null;
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

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      status: string;
      organizationId: string | null;
      phone: string | null;
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
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    status: string;
    organizationId: string | null;
    phone: string | null;
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
    /** Milliseconds timestamp when the DB-sourced fields were last refreshed. */
    refreshedAt?: number;
  }
}

// ============================================================
// HELPERS
// ============================================================

function normalizeRole(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim().toUpperCase();
}

/**
 * How long (ms) before we re-read role / status / mustChangePassword /
 * wallets from the DB. Keeps the JWT mostly stateless but guarantees
 * fresh flags within ~15s of any DB change.
 */
const REFRESH_INTERVAL_MS = 15 * 1000;

// ============================================================
// AUTH OPTIONS
// ============================================================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            wallets: {
              select: {
                id: true,
                type: true,
                accountNumber: true,
                palmPayAccountNumber: true,
                palmPayBankName: true,
                palmPayAccountName: true,
                palmPayStatus: true,
              },
            },
          },
        });

        console.log("🔐 [AUTH] authorize:", {
          email,
          found: !!user,
          role: user?.role,
          status: user?.status,
          mustChangePassword: user?.must_change_password,
        });

        if (!user) return null;
        if (user.status === "SUSPENDED" || user.status === "INACTIVE") return null;
        if (!user.password_hash) return null;

        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) {
          console.log("❌ [AUTH] invalid password for", email);
          return null;
        }

        // Fire-and-forget
        prisma.user
          .update({ where: { id: user.id }, data: { last_login: new Date() } })
          .catch(() => {});

        const role = normalizeRole(user.role);

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role,
          status: user.status,
          organizationId: user.organizationId ?? null,
          phone: user.phone ?? null,
          mustChangePassword: user.must_change_password,
          wallets: user.wallets.map((w) => ({
            id: w.id,
            type: w.type,
            accountNumber: w.accountNumber,
            palmPayAccountNumber: w.palmPayAccountNumber,
            palmPayBankName: w.palmPayBankName,
            palmPayAccountName: w.palmPayAccountName,
            palmPayStatus: w.palmPayStatus,
          })),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial sign-in — populate everything from the freshly-authorized user.
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = normalizeRole((user as any).role);
        token.status = (user as any).status;
        token.organizationId = (user as any).organizationId;
        token.phone = (user as any).phone;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        token.wallets = (user as any).wallets ?? [];
        token.refreshedAt = Date.now();
        return token;
      }

      // 2. Manual session update (`useSession().update(...)`).
      if (trigger === "update" && session) {
        // Allow the client to flip mustChangePassword after a successful change.
        if (typeof (session as any).mustChangePassword === "boolean") {
          token.mustChangePassword = (session as any).mustChangePassword;
        }
        // Force a DB re-fetch on next request.
        token.refreshedAt = 0;
      }

      // 3. Periodic DB refresh — every REFRESH_INTERVAL_MS the token's
      //    volatile fields are re-read so password changes and status
      //    updates take effect without re-signing in.
      const stale =
        !token.refreshedAt ||
        Date.now() - token.refreshedAt > REFRESH_INTERVAL_MS;

      if (stale && token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              role: true,
              status: true,
              organizationId: true,
              phone: true,
              must_change_password: true,
              full_name: true,
            },
          });

          if (fresh) {
            token.role = normalizeRole(fresh.role);
            token.status = fresh.status;
            token.organizationId = fresh.organizationId ?? null;
            token.phone = fresh.phone ?? null;
            token.mustChangePassword = fresh.must_change_password;
            token.name = fresh.full_name;
          }
          token.refreshedAt = Date.now();
        } catch (err) {
          // Don't blow up the request if the DB hiccups; just retry next time.
          console.error("[JWT refresh] failed:", err);
          token.refreshedAt = Date.now() - REFRESH_INTERVAL_MS + 5000;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = normalizeRole(token.role);
        session.user.status = token.status;
        session.user.organizationId = token.organizationId;
        session.user.phone = token.phone;
        session.user.mustChangePassword = token.mustChangePassword ?? false;
        session.user.wallets = token.wallets ?? [];
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/" },
};