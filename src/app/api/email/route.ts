// src/app/api/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { emailService } from "~/lib/email/email.service";
import {
  EmailTemplateData,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  verificationEmailTemplate,
  orderConfirmationEmailTemplate,
  newsletterSubscriptionTemplate,
  accountUpdateTemplate,
  contactEmailTemplate,
  adminCredentialsEmailTemplate,
  organizationCreatedEmailTemplate,
} from "~/lib/email/template";

// ---------- Request body ----------
interface SendEmailRequestBody {
  template?: string;
  data?: EmailTemplateData;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
}

// ---------- Supported templates ----------
type EmailTemplateType =
  | "welcome"
  | "password-reset"
  | "verification"
  | "contact"
  | "order-confirmation"
  | "newsletter"
  | "account-update"
  | "admin-credentials"
  | "organization-created";

// ---------- Rate limiting (in-memory) ----------
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// ============================================================
// POST — send email
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as SendEmailRequestBody;
    const { template, data, to, subject, text, html, attachments, cc, bcc } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email (to) is required" },
        { status: 400 }
      );
    }

    let finalSubject = subject;
    let finalHtml = html;

    if (template) {
      const templateData: EmailTemplateData = data || {};
      const templateType = template as EmailTemplateType;

      switch (templateType) {
        case "welcome": {
          const t = welcomeEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "password-reset": {
          const t = passwordResetEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "verification": {
          const t = verificationEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "contact": {
          const t = contactEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "order-confirmation": {
          const t = orderConfirmationEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "newsletter": {
          const t = newsletterSubscriptionTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "account-update": {
          const t = accountUpdateTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        // ---------- NEW ----------
        case "admin-credentials": {
          const t = adminCredentialsEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        case "organization-created": {
          const t = organizationCreatedEmailTemplate(templateData);
          finalSubject = finalSubject || t.subject;
          finalHtml = finalHtml || t.html;
          break;
        }
        default:
          return NextResponse.json(
            { error: "Invalid template specified" },
            { status: 400 }
          );
      }
    }

    if (!finalSubject || (!text && !finalHtml)) {
      return NextResponse.json(
        { error: "Email subject and content are required" },
        { status: 400 }
      );
    }

    const result = await emailService.sendEmail({
      to,
      subject: finalSubject,
      text,
      html: finalHtml,
      attachments,
      cc,
      bcc,
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
      });
    }
    throw new Error("Failed to send email");
  } catch (error) {
    console.error("Error in email API:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET — health check
// ============================================================
export async function GET() {
  try {
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "Email service is connected and ready",
      });
    }
    return NextResponse.json(
      { error: "Email service is not connected" },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to verify email connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}