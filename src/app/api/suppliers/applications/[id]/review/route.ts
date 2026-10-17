import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { UserRole, WalletType, ApplicationStatus } from "@prisma/client";
import { createWalletWithVA } from "~/lib/services/wallet.service";
import { sendAdminCredentialsEmail } from "~/lib/email/utils";

// ============================================================
// SCHEMA — organizationId is required when APPROVE is chosen
// ============================================================

const bodySchema = z
  .object({
    decision: z.enum([
      "APPROVE",
      "REJECT",
      "REQUEST_MORE_INFO",
      "START_REVIEW",
    ]),
    organizationId: z.string().optional(),
    notes: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine((v) => v.decision !== "APPROVE" || !!v.organizationId, {
    message: "organizationId is required when approving",
    path: ["organizationId"],
  });

// ============================================================
// HELPERS
// ============================================================

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
// POST
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    const app = await prisma.supplierApplication.findUnique({
      where: { id },
    });
    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // ---------------- START_REVIEW ----------------
    if (data.decision === "START_REVIEW") {
      const updated = await prisma.supplierApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.UNDER_REVIEW,
          reviewedById: caller.id,
          reviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // ---------------- REQUEST_MORE_INFO ----------------
    if (data.decision === "REQUEST_MORE_INFO") {
      const updated = await prisma.supplierApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.MORE_INFO_REQUESTED,
          reviewedById: caller.id,
          reviewedAt: new Date(),
          moreInfoRequest: data.notes || null,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // ---------------- REJECT ----------------
    if (data.decision === "REJECT") {
      const updated = await prisma.supplierApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.REJECTED,
          reviewedById: caller.id,
          reviewedAt: new Date(),
          rejectionReason: data.reason || data.notes || "Not specified",
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // ---------------- APPROVE ----------------
    if (app.status === ApplicationStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: "Application already approved" },
        { status: 400 }
      );
    }

    // Verify the selected organization exists and is active
    const org = await prisma.organization.findUnique({
      where: { id: data.organizationId! },
      select: { id: true, name: true, status: true },
    });
    if (!org || org.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Selected organization is not available",
        },
        { status: 400 }
      );
    }

    // If ADMIN, restrict to their own org
    if (caller.role === "ADMIN" && caller.organizationId !== org.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only approve suppliers into your own organization",
        },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: app.contact_email },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // ------------------------------------------------------
    // DEFAULT PASSWORD = the supplier's phone number
    // (matches createOrganization + admin settings users)
    // ------------------------------------------------------
    const normalizedPhone = normalizePhone(app.contact_phone);
    const defaultPassword = normalizedPhone;
    const password_hash = await hash(defaultPassword, 12);

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: app.contact_email,
            password_hash,
            full_name: app.contact_full_name,
            phone: normalizedPhone, // store normalized phone
            role: UserRole.SUPPLIER,
            status: "ACTIVE",
            organizationId: org.id,
            createdById: caller.id,
            must_change_password: true,
          },
        });

        await tx.supplierProfile.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            business_name: app.business_name,
            business_type: app.business_type,
            registration_no: app.registration_number,
            tax_id: app.tax_id,
            product_categories: app.product_categories,
            delivery_regions: app.delivery_regions,
            verified: true,
            verified_at: new Date(),
          },
        });

        await createWalletWithVA(tx, {
          userId: user.id,
          type: WalletType.SUPPLIER,
          accountName: `${app.business_name} - Supplier Wallet`,
          prefix: "44",
          holder: {
            name: app.contact_full_name,
            email: app.contact_email,
            phone: normalizedPhone,
          },
        });

        await tx.userPreferences.create({
          data: { userId: user.id, timezone: "Africa/Lagos" },
        });

        await tx.supplierApplication.update({
          where: { id },
          data: {
            status: ApplicationStatus.APPROVED,
            reviewedById: caller.id,
            reviewedAt: new Date(),
            decisionNotes: data.notes || null,
            approvedUserId: user.id,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: caller.id,
            action: "APPROVE_SUPPLIER_APPLICATION",
            entity_type: "SUPPLIER_APPLICATION",
            entity_id: app.id,
            new_values: JSON.stringify({
              approvedUserId: user.id,
              organizationId: org.id,
            }),
            success: true,
          },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Welcome to NAVSA",
            body: `Your supplier account with ${org.name} has been approved. Check your email for credentials.`,
            type: "SYSTEM",
          },
        });

        return {
          user,
          organizationId: org.id,
          organizationName: org.name,
        };
      },
      { timeout: 60000, maxWait: 60000 }
    );

    const loginUrl = `${
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    }/`;

    // ------------------------------------------------------
    // Email the phone number as the default password
    // ------------------------------------------------------
    sendAdminCredentialsEmail({
      to: app.contact_email,
      name: app.contact_full_name,
      email: app.contact_email,
      password: defaultPassword, // ← phone number
      organizationName: org.name,
      loginUrl,
    }).catch((err) => console.error("supplier email error:", err));

    console.log(
      `✅ Supplier approved: ${app.contact_email} → ${org.name} | default password: ${defaultPassword}`
    );

    return NextResponse.json({
      success: true,
      data: {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organizationId,
        organizationName: result.organizationName,
        defaultPassword, // returned so the admin UI can display it
      },
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/suppliers/applications/[id]/review] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to review" },
      { status: 400 }
    );
  }
}