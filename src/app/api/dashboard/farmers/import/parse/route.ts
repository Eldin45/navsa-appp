// src/app/api/dashboard/farmers/import/parse/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const runtime = "nodejs";

interface ParsedRow {
  rowNumber: number;
  full_name: string;
  email: string;
  phone: string;
  farmer_code?: string;
  primary_crops?: string;
  years_farming?: number | null;
  total_land_ha?: number | null;
  status: "ok" | "error";
  errorMessage?: string;
}

function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("234")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s ?? "").trim());
}

export async function POST(req: NextRequest) {
  const caller = await getCurrentUser();
  if (!caller || !["SUPER_ADMIN", "ADMIN"].includes(caller.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 5 MB)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: "No sheets in the file" },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (rawRows.length < 2) {
      return NextResponse.json(
        { success: false, error: "The file has no data rows" },
        { status: 400 }
      );
    }

    const [headerRow, ...dataRows] = rawRows;
    const headers = headerRow.map((h) => String(h).trim().toLowerCase());

    const colIndex = (name: string) => headers.indexOf(name);

    const required = ["full_name", "email", "phone"];
    const missing = required.filter((c) => colIndex(c) === -1);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required column(s): ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Load existing emails + phones to flag duplicates early
    const existingEmails = new Set(
      (
        await prisma.user.findMany({
          where: { email: { not: "" } },
          select: { email: true },
        })
      ).map((u) => u.email.toLowerCase())
    );

    const existingPhones = new Set(
      (
        await prisma.user.findMany({
          where: { phone: { not: null } },
          select: { phone: true },
        })
      )
        .map((u) => u.phone)
        .filter((p): p is string => !!p)
    );

    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    const rows: ParsedRow[] = dataRows.map((r, i) => {
      const rowNumber = i + 2;
      const get = (name: string) => String(r[colIndex(name)] ?? "").trim();

      const full_name = get("full_name");
      const emailRaw = get("email").toLowerCase();
      const phoneRaw = get("phone");
      const phone = normalizePhone(phoneRaw);
      const farmer_code = get("farmer_code") || undefined;
      const primary_crops = get("primary_crops") || undefined;
      const years_farming = get("years_farming")
        ? Number(get("years_farming"))
        : null;
      const total_land_ha = get("total_land_ha")
        ? Number(get("total_land_ha"))
        : null;

      const errs: string[] = [];
      if (!full_name || full_name.length < 2) errs.push("Invalid full_name");
      if (!isEmail(emailRaw)) errs.push("Invalid email");
      if (!/^\d{10,15}$/.test(phone))
        errs.push("Invalid phone (must be 10-15 digits)");
      if (
        years_farming !== null &&
        (Number.isNaN(years_farming) || years_farming < 0)
      )
        errs.push("Invalid years_farming");
      if (
        total_land_ha !== null &&
        (Number.isNaN(total_land_ha) || total_land_ha < 0)
      )
        errs.push("Invalid total_land_ha");

      if (emailRaw && existingEmails.has(emailRaw))
        errs.push("Email already exists");
      if (emailRaw && seenEmails.has(emailRaw))
        errs.push("Duplicate email in file");
      if (phone && existingPhones.has(phone)) errs.push("Phone already in use");
      if (phone && seenPhones.has(phone)) errs.push("Duplicate phone in file");

      if (emailRaw) seenEmails.add(emailRaw);
      if (phone) seenPhones.add(phone);

      return {
        rowNumber,
        full_name,
        email: emailRaw,
        phone: phoneRaw,
        farmer_code,
        primary_crops,
        years_farming,
        total_land_ha,
        status: errs.length === 0 ? "ok" : "error",
        errorMessage: errs.join(" · ") || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        rows,
        total: rows.length,
        valid: rows.filter((r) => r.status === "ok").length,
        errors: rows.filter((r) => r.status === "error").length,
      },
    });
  } catch (err: any) {
    console.error("[/api/dashboard/farmers/import/parse] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to parse file" },
      { status: 500 }
    );
  }
}