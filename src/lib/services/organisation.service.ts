// src/lib/services/organization.service.ts
import { prisma } from "../db";
import { hash } from "bcrypt";
import { z } from "zod";
import {
  UserRole,
  WalletType,
  OrganizationType,
  UserStatus,
} from "@prisma/client";
import { createWalletWithVA } from "./wallet.service";
import {
  sendAdminCredentialsEmail,
  sendOrganizationCreatedEmail,
} from "../email/utils";

// ============================================================
// SCHEMAS
// ============================================================

export const createOrganizationSchema = z.object({
  name: z.string().min(2),
  legal_name: z.string().optional().or(z.literal("")),
  type: z.nativeEnum(OrganizationType),
  country: z.string().default("NIGERIA"),
  region: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),

  // Required representative (first user)
  representative_full_name: z.string().min(2),
  representative_email: z.string().email(),
  representative_phone: z
    .string()
    .min(7)
    .regex(/^\d+$/, "Phone must contain only digits"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(2).optional(),
  legal_name: z.string().optional().or(z.literal("")),
  type: z.nativeEnum(OrganizationType).optional(),
  country: z.string().optional(),
  region: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const verifyOrganizationSchema = z.object({
  organizationId: z.string(),
  verified: z.boolean(),
  notes: z.string().optional(),
});

export type VerifyOrganizationInput = z.infer<typeof verifyOrganizationSchema>;

// ============================================================
// HELPERS
// ============================================================

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

/**
 * Normalizes a phone number to Nigerian style.
 *   "+2348012345678" → "08012345678"
 *   "2348012345678"  → "08012345678"
 *   "08012345678"    → "08012345678"
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

// ============================================================
// CREATE ORGANIZATION  (SUPER_ADMIN only)
// ============================================================

export async function createOrganization(
  data: CreateOrganizationInput,
  createdById: string,
  request?: Request
) {
  // 1. Verify caller
  const caller = await prisma.user.findUnique({
    where: { id: createdById },
    select: { id: true, role: true },
  });
  if (!caller || caller.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Only SUPER_ADMIN can create organizations");
  }

  const repEmail = data.representative_email.trim().toLowerCase();
  const repPhone = normalizePhone(data.representative_phone);

  // 2. Uniqueness checks
  const existingUser = await prisma.user.findUnique({
    where: { email: repEmail },
  });
  if (existingUser) {
    throw new Error("A user with this representative email already exists");
  }

  const existingPhone = await prisma.user.findFirst({
    where: { phone: repPhone },
  });
  if (existingPhone) {
    throw new Error("Representative phone number already in use");
  }

  if (data.email) {
    const existingOrg = await prisma.organization.findFirst({
      where: { email: data.email.toLowerCase() },
    });
    if (existingOrg) {
      throw new Error("An organization with this email already exists");
    }
  }

  // 3. Default password = representative's phone
  const defaultPassword = repPhone;
  const password_hash = await hash(defaultPassword, 12);

  const baseSlug = slugify(data.name);
  const slug = await uniqueSlug(baseSlug);

  // 4. Transaction
  const result = await prisma.$transaction(
    async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name.trim(),
          legal_name: data.legal_name || null,
          slug,
          type: data.type,
          country: data.country || "NIGERIA",
          region: data.region || null,
          city: data.city || null,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email ? data.email.toLowerCase() : null,
          website: data.website || null,
          verified: false,
          status: UserStatus.ACTIVE,
        },
      });

      // Representative becomes the org's first ADMIN
      const rep = await tx.user.create({
        data: {
          email: repEmail,
          password_hash,
          full_name: data.representative_full_name,
          phone: repPhone,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          organizationId: org.id,
          createdById,
          must_change_password: true,
        },
      });

      await createWalletWithVA(tx, {
        userId: rep.id,
        type: WalletType.ADMIN,
        accountName: `${data.representative_full_name} - Admin Wallet`,
        prefix: "43",
        holder: {
          name: data.representative_full_name,
          email: repEmail,
          phone: repPhone,
        },
      });

      await tx.userPreferences.create({
        data: { userId: rep.id, timezone: "Africa/Lagos" },
      });

      await tx.notification.create({
        data: {
          userId: rep.id,
          title: "Welcome to NAVSA",
          body: `You have been registered as the representative of ${data.name}. Check your email for credentials.`,
          type: "SYSTEM",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: createdById,
          action: "CREATE_ORGANIZATION",
          entity_type: "ORGANIZATION",
          entity_id: org.id,
          new_values: JSON.stringify({
            name: data.name,
            type: data.type,
            representativeUserId: rep.id,
          }),
          ip_address:
            request?.headers?.get("x-forwarded-for") ||
            request?.headers?.get("x-real-ip") ||
            null,
          user_agent: request?.headers?.get("user-agent") || null,
          success: true,
        },
      });

      return { org, representativeId: rep.id };
    },
    { timeout: 60000, maxWait: 60000 }
  );

  // 5. Emails (fire-and-forget)
  const loginUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  }/`;

  sendAdminCredentialsEmail({
    to: repEmail,
    name: data.representative_full_name,
    email: repEmail,
    password: defaultPassword,
    organizationName: data.name,
    loginUrl,
  })
    .then((ok) => {
      if (ok) console.log(`📧 Credentials emailed to rep: ${repEmail}`);
      else console.error(`❌ Failed credentials email to: ${repEmail}`);
    })
    .catch((err) => console.error("rep credentials email error:", err));

  if (data.email) {
    sendOrganizationCreatedEmail({
      to: data.email,
      name: data.representative_full_name,
      organizationName: data.name,
      organizationType: data.type,
      email: repEmail,
      password: defaultPassword,
      loginUrl,
    })
      .then((ok) => {
        if (ok) console.log(`📧 Organization created email sent to: ${data.email}`);
        else console.error(`❌ Failed org email to: ${data.email}`);
      })
      .catch((err) => console.error("org created email error:", err));
  }

  console.log(
    `✅ Organization created: ${data.name} | rep: ${repEmail} | default password: ${repPhone}`
  );

  return {
    organization: {
      id: result.org.id,
      name: result.org.name,
      slug: result.org.slug,
      type: result.org.type,
      verified: result.org.verified,
    },
    representativeId: result.representativeId,
  };
}

// ============================================================
// LIST ORGANIZATIONS  (role-scoped)
// ============================================================

export async function listOrganizations(
  requesterId: string,
  opts?: { search?: string; type?: OrganizationType; verified?: boolean }
) {
  const caller = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!caller || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(caller.role)) {
    throw new Error("Forbidden");
  }

  const isSuperAdmin = caller.role === UserRole.SUPER_ADMIN;

  const where: any = {};
  if (!isSuperAdmin) where.id = caller.organizationId ?? "__none__";
  if (opts?.type) where.type = opts.type;
  if (typeof opts?.verified === "boolean") where.verified = opts.verified;
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search } },
      { legal_name: { contains: opts.search } },
      { slug: { contains: opts.search } },
      { email: { contains: opts.search } },
      { city: { contains: opts.search } },
      { region: { contains: opts.search } },
    ];
  }

  return prisma.organization.findMany({
    where,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      legal_name: true,
      slug: true,
      type: true,
      country: true,
      region: true,
      city: true,
      phone: true,
      email: true,
      website: true,
      verified: true,
      verified_at: true,
      status: true,
      created_at: true,
      _count: {
        select: {
          users: true,
          farmers: true,
          suppliers: true,
          farmGroups: true,
        },
      },
    },
  });
}

// ============================================================
// GET SINGLE ORGANIZATION
// ============================================================

export async function getOrganizationById(
  organizationId: string,
  requesterId: string
) {
  const caller = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!caller || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(caller.role)) {
    throw new Error("Forbidden");
  }

  const isSuperAdmin = caller.role === UserRole.SUPER_ADMIN;
  if (!isSuperAdmin && caller.organizationId !== organizationId) {
    throw new Error("Forbidden");
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        orderBy: { created_at: "desc" },
        take: 50,
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
          wallets: {
            select: {
              id: true,
              type: true,
              accountNumber: true,
              balance: true,
              palmPayAccountNumber: true,
              palmPayBankName: true,
              palmPayStatus: true,
            },
          },
        },
      },
      _count: {
        select: {
          users: true,
          farmers: true,
          suppliers: true,
          farmGroups: true,
        },
      },
    },
  });

  if (!org) throw new Error("Organization not found");

  const walletAgg = await prisma.wallet.aggregate({
    _sum: { balance: true, availableBalance: true },
    where: { user: { organizationId } },
  });

  return {
    organization: org,
    walletTotals: {
      balance: Number(walletAgg._sum.balance ?? 0),
      available: Number(walletAgg._sum.availableBalance ?? 0),
    },
  };
}

// ============================================================
// UPDATE ORGANIZATION  (SUPER_ADMIN only)
// ============================================================

export async function updateOrganization(
  data: UpdateOrganizationInput,
  actorId: string,
  request?: Request
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true },
  });
  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Only SUPER_ADMIN can update organizations");
  }

  const existing = await prisma.organization.findUnique({
    where: { id: data.organizationId },
  });
  if (!existing) throw new Error("Organization not found");

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = await uniqueSlug(slugify(data.name), existing.id);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: data.organizationId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.name ? { slug } : {}),
        ...(data.legal_name !== undefined
          ? { legal_name: data.legal_name || null }
          : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.country ? { country: data.country } : {}),
        ...(data.region !== undefined ? { region: data.region || null } : {}),
        ...(data.city !== undefined ? { city: data.city || null } : {}),
        ...(data.address !== undefined
          ? { address: data.address || null }
          : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.email !== undefined
          ? { email: data.email ? data.email.toLowerCase() : null }
          : {}),
        ...(data.website !== undefined
          ? { website: data.website || null }
          : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "UPDATE_ORGANIZATION",
        entity_type: "ORGANIZATION",
        entity_id: org.id,
        new_values: JSON.stringify(data),
        ip_address:
          request?.headers?.get("x-forwarded-for") ||
          request?.headers?.get("x-real-ip") ||
          null,
        user_agent: request?.headers?.get("user-agent") || null,
        success: true,
      },
    });

    return org;
  });

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    type: updated.type,
  };
}

// ============================================================
// VERIFY / UNVERIFY  (SUPER_ADMIN only)
// ============================================================

export async function verifyOrganization(
  data: VerifyOrganizationInput,
  actorId: string,
  request?: Request
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true },
  });
  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Only SUPER_ADMIN can verify organizations");
  }

  const org = await prisma.organization.findUnique({
    where: { id: data.organizationId },
  });
  if (!org) throw new Error("Organization not found");

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.organization.update({
      where: { id: data.organizationId },
      data: {
        verified: data.verified,
        verified_at: data.verified ? new Date() : null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: data.verified
          ? "VERIFY_ORGANIZATION"
          : "UNVERIFY_ORGANIZATION",
        entity_type: "ORGANIZATION",
        entity_id: o.id,
        new_values: JSON.stringify({
          verified: data.verified,
          notes: data.notes ?? null,
        }),
        ip_address:
          request?.headers?.get("x-forwarded-for") ||
          request?.headers?.get("x-real-ip") ||
          null,
        user_agent: request?.headers?.get("user-agent") || null,
        success: true,
      },
    });

    return o;
  });

  return {
    id: updated.id,
    name: updated.name,
    verified: updated.verified,
  };
}