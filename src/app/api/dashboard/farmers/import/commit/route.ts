// src/app/api/dashboard/farmers/import/commit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";
import { UserRole, WalletType } from "@prisma/client";
import { createWalletWithVA } from "~/lib/services/wallet.service";
import { sendAdminCredentialsEmail } from "~/lib/email/utils";

export const runtime = "nodejs";

const rowSchema = z.object({
  rowNumber: z.number(),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  farmer_code: z.string().optional(),
  primary_crops: z.string().optional(),
  years_farming: z.coerce.number().int().min(0).nullable().optional(),
  total_land_ha: z.coerce.number().min(0).nullable().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(1000),
});

function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

interface CommitResult {
  rowNumber: number;
  email: string;
  status: "created" | "skipped" | "error";
  message?: string;
}

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();

  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  if (caller.role === "ADMIN" && !caller.organizationId) {
    return NextResponse.json(
      { success: false, error: "Admin has no organization linked" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { rows } = bodySchema.parse(body);

    const organizationId =
      caller.role === "ADMIN" ? caller.organizationId : null;

    const results: CommitResult[] = [];
    const loginUrl = `${
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    }/`;

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      const phone = normalizePhone(row.phone);

      try {
        // Pre-check uniqueness inside the loop
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          results.push({
            rowNumber: row.rowNumber,
            email,
            status: "skipped",
            message: "Email already exists",
          });
          continue;
        }

        const existingPhone = await prisma.user.findFirst({
          where: { phone },
        });
        if (existingPhone) {
          results.push({
            rowNumber: row.rowNumber,
            email,
            status: "skipped",
            message: "Phone already in use",
          });
          continue;
        }

        const password_hash = await hash(phone, 12);

        const created = await prisma.$transaction(
          async (tx) => {
            const u = await tx.user.create({
              data: {
                email,
                password_hash,
                full_name: row.full_name,
                phone,
                role: UserRole.FARMER,
                status: "ACTIVE",
                organizationId,
                createdById: caller.id,
                must_change_password: true,
              },
            });

            await tx.farmerProfile.create({
              data: {
                userId: u.id,
                organizationId,
                farmer_code: row.farmer_code,
                primary_crops: row.primary_crops,
                years_farming: row.years_farming ?? undefined,
                total_land_ha: row.total_land_ha ?? undefined,
              },
            });

            await createWalletWithVA(tx, {
              userId: u.id,
              type: WalletType.FARMER_CLOSED,
              accountName: `${row.full_name} - Input Wallet`,
              prefix: "41",
              holder: { name: row.full_name, email, phone },
            });

            await createWalletWithVA(tx, {
              userId: u.id,
              type: WalletType.FARMER_OPEN,
              accountName: `${row.full_name} - Payout Wallet`,
              prefix: "42",
              holder: { name: row.full_name, email, phone },
            });

            await tx.userPreferences.create({
              data: { userId: u.id, timezone: "Africa/Lagos" },
            });

            await tx.notification.create({
              data: {
                userId: u.id,
                title: "Welcome to NAVSA",
                body: `Your farmer account has been created. Check your email for credentials.`,
                type: "SYSTEM",
              },
            });

            await tx.auditLog.create({
              data: {
                userId: caller.id,
                action: "BULK_CREATE_FARMER",
                entity_type: "USER",
                entity_id: u.id,
                new_values: JSON.stringify({
                  email,
                  phone,
                  organizationId,
                  source: "bulk-import",
                }),
                success: true,
              },
            });

            return u;
          },
          { timeout: 60000, maxWait: 60000 }
        );

        // Fire-and-forget credentials email
        sendAdminCredentialsEmail({
          to: email,
          name: row.full_name,
          email,
          password: phone,
          loginUrl,
        }).catch((err) => console.error("bulk email error:", err));

        results.push({
          rowNumber: row.rowNumber,
          email,
          status: "created",
          message: created.id,
        });
      } catch (err: any) {
        results.push({
          rowNumber: row.rowNumber,
          email,
          status: "error",
          message: err.message || "Failed to create",
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        created: results.filter((r) => r.status === "created").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
      },
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[/api/dashboard/farmers/import/commit] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to import farmers" },
      { status: 500 }
    );
  }
}