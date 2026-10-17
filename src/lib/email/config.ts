// src/lib/email/config.ts
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
}

export const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || "smtp.myqreta.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "noreply@navsa.ng",
    pass: process.env.EMAIL_PASSWORD || "",
  },
  from: process.env.EMAIL_FROM || "NAVSA <info@navsa.ng>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@navsa.ng",
};