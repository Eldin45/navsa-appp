// src/app/api/suppliers/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  submitSupplierApplication,
  submitApplicationSchema,
} from "~/lib/services/supplier-application.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitApplicationSchema.parse(body);
    const app = await submitSupplierApplication(validated, req);
    return NextResponse.json(
      {
        success: true,
        message: "Application received. Our team will review it shortly.",
        data: { application_number: app.application_number, status: app.status },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}