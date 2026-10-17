// src/app/api/dashboard/farmers/import-template/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const header = [
    "full_name",
    "email",
    "phone",
    "farmer_code",
    "primary_crops",
    "years_farming",
    "total_land_ha",
  ].join(",");

  const sample = [
    "John Doe",
    "john@example.com",
    "08012345678",
    "FRM-0001",
    "Maize, Rice",
    "5",
    "2.5",
  ]
    .map((v) => `"${v.replace(/"/g, '""')}"`)
    .join(",");

  const csv = [header, sample].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="navsa-farmers-template.csv"`,
    },
  });
}