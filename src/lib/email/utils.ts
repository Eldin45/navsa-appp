// src/lib/email/utils.ts
import type { EmailTemplateData } from "./template";

export interface SendEmailOptions {
  template?:
    | "welcome"
    | "password-reset"
    | "verification"
    | "contact"
    | "order-confirmation"
    | "newsletter"
    | "account-update"
    | "admin-credentials"
    | "organization-created";
  data?: EmailTemplateData;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

/**
 * Calls the existing /api/email/send route.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/email/send`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    const result = (await response.json()) as { message?: string; error?: string };

    if (response.ok) {
      console.log("✅ Email queued:", result.message ?? "sent");
      return true;
    }
    console.error("❌ Failed to queue email:", result.error ?? response.statusText);
    return false;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}

// ============================================================
// CONVENIENCE SENDERS — existing
// ============================================================

export async function sendWelcomeEmail(
  to: string,
  name: string,
  email?: string,
  slink?: string
): Promise<boolean> {
  return sendEmail({
    template: "welcome",
    to,
    data: {
      name,
      email: email || to,
      slink,
      date: new Date().toLocaleDateString(),
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  otp: string,
  resetLink?: string
): Promise<boolean> {
  return sendEmail({
    template: "password-reset",
    to,
    data: { name, otp, link: resetLink },
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  otp: string,
  verificationLink?: string
): Promise<boolean> {
  return sendEmail({
    template: "verification",
    to,
    data: { name, otp, link: verificationLink },
  });
}

export async function sendContactFormEmail(
  fromEmail: string,
  name: string,
  subject: string,
  message: string,
  adminEmail?: string
): Promise<boolean> {
  return sendEmail({
    template: "contact",
    to: adminEmail || process.env.ADMIN_EMAIL || "admin@navsa.ng",
    data: {
      name,
      email: fromEmail,
      subject,
      message,
      date: new Date().toLocaleString(),
    },
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderId: string,
  amount: string
): Promise<boolean> {
  return sendEmail({
    template: "order-confirmation",
    to,
    data: { name, orderId, amount, date: new Date().toLocaleString() },
  });
}

// ============================================================
// CONVENIENCE SENDERS — NAVSA-specific
// ============================================================

/**
 * Sends admin credentials to a newly created admin.
 * Called from `admin.service.ts`.
 */
export async function sendAdminCredentialsEmail(input: {
  to: string;
  name: string;
  email: string;
  password: string;
  organizationName?: string;
  loginUrl?: string;
}): Promise<boolean> {
  return sendEmail({
    template: "admin-credentials",
    to: input.to,
    data: {
      name: input.name,
      email: input.email,
      password: input.password,
      organizationName: input.organizationName,
      loginUrl: input.loginUrl || getBaseUrl(),
    },
  });
}

/**
 * Sends an organization-created email to the primary contact.
 * Includes credentials if an admin was created at the same time.
 */
export async function sendOrganizationCreatedEmail(input: {
  to: string;
  name: string;
  organizationName: string;
  organizationType?: string;
  email?: string;
  password?: string;
  loginUrl?: string;
}): Promise<boolean> {
  return sendEmail({
    template: "organization-created",
    to: input.to,
    data: {
      name: input.name,
      organizationName: input.organizationName,
      organizationType: input.organizationType,
      email: input.email,
      password: input.password,
      loginUrl: input.loginUrl || getBaseUrl(),
      date: new Date().toLocaleString(),
    },
  });
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function testEmailConnection(): Promise<boolean> {
  try {
    const url = `${getBaseUrl()}/api/email/send`;
    const response = await fetch(url);
    const result = (await response.json()) as { success?: boolean };
    return response.ok && result.success === true;
  } catch (error) {
    console.error("Error testing email connection:", error);
    return false;
  }
}