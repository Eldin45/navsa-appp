import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  weatherAlerts: z.boolean().optional(),
  paymentAlerts: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const updated = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        email_enabled: data.emailEnabled ?? true,
        sms_enabled: data.smsEnabled ?? false,
        push_enabled: data.pushEnabled ?? true,
        weather_alerts: data.weatherAlerts ?? true,
        payment_alerts: data.paymentAlerts ?? true,
      },
      update: {
        ...(data.emailEnabled !== undefined
          ? { email_enabled: data.emailEnabled }
          : {}),
        ...(data.smsEnabled !== undefined
          ? { sms_enabled: data.smsEnabled }
          : {}),
        ...(data.pushEnabled !== undefined
          ? { push_enabled: data.pushEnabled }
          : {}),
        ...(data.weatherAlerts !== undefined
          ? { weather_alerts: data.weatherAlerts }
          : {}),
        ...(data.paymentAlerts !== undefined
          ? { payment_alerts: data.paymentAlerts }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update preferences" },
      { status: 400 }
    );
  }
}