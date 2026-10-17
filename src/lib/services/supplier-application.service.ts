// src/lib/services/supplier-application.service.ts
import { prisma } from "../db";
import { z } from "zod";
import { UserRole, ApplicationStatus } from "@prisma/client";

// ============================================================
// SCHEMAS
// ============================================================

export const submitApplicationSchema = z.object({
  contact_full_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().min(7),
  business_name: z.string().min(2),
  business_type: z.string().optional(),
  registration_number: z.string().optional(),
  tax_id: z.string().optional(),
  country: z.string().default("NIGERIA"),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  product_categories: z.string().optional(),
  delivery_regions: z.string().optional(),
  years_in_business: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  documents: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
        name: z.string(),
      })
    )
    .optional(),
});

export const reviewApplicationSchema = z.object({
  applicationId: z.string(),
  decision: z.enum([
    "APPROVE",
    "REJECT",
    "REQUEST_MORE_INFO",
    "START_REVIEW",
  ]),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;

// ============================================================
// SUBMIT APPLICATION  (public)
// ============================================================

export async function submitSupplierApplication(
  data: SubmitApplicationInput,
  request?: Request
) {
  const email = data.contact_email.toLowerCase();

  const existing = await prisma.supplierApplication.findFirst({
    where: {
      contact_email: email,
      status: {
        in: [
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.MORE_INFO_REQUESTED,
        ],
      },
    },
  });
  if (existing) {
    throw new Error("You already have an application in progress.");
  }

  const application_number = `SUP-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

  const application = await prisma.supplierApplication.create({
    data: {
      application_number,
      contact_full_name: data.contact_full_name,
      contact_email: email,
      contact_phone: data.contact_phone,
      business_name: data.business_name,
      business_type: data.business_type,
      registration_number: data.registration_number,
      tax_id: data.tax_id,
      country: data.country,
      state: data.state,
      city: data.city,
      address: data.address,
      website: data.website || undefined,
      product_categories: data.product_categories,
      delivery_regions: data.delivery_regions,
      years_in_business: data.years_in_business,
      description: data.description,
      documents: data.documents ?? [],
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      ipAddress:
        request?.headers?.get("x-forwarded-for") ||
        request?.headers?.get("x-real-ip") ||
        null,
      userAgent: request?.headers?.get("user-agent") || null,
    },
  });

  console.log(`📥 Supplier application: ${application.application_number}`);
  return application;
}

// ============================================================
// LIST APPLICATIONS  (SUPER_ADMIN / ADMIN)
// ============================================================

export async function listSupplierApplications(
  requesterId: string,
  filter?: { status?: ApplicationStatus }
) {
  const user = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true },
  });
  if (!user || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role)) {
    throw new Error("Forbidden");
  }

  return prisma.supplierApplication.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      reviewedBy: { select: { id: true, full_name: true, email: true } },
      approvedUser: { select: { id: true, email: true, full_name: true } },
    },
  });
}