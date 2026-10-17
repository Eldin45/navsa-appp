// src/lib/email/template.ts
export interface EmailTemplateData {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  link?: string;
  slink?: string;
  mlink?: string;
  otp?: string;
  orderId?: string;
  amount?: string;
  date?: string;

  // NAVSA-specific
  password?: string;
  role?: string;
  organizationName?: string;
  organizationType?: string;
  loginUrl?: string;
}

// ------------------------------------------------------------
// BASE TEMPLATE (NAVSA green)
// ------------------------------------------------------------
const baseTemplate = (content: string, title?: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || "NAVSA"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background-color: #059669;
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 30px 20px;
      border-left: 1px solid #e5e5e5;
      border-right: 1px solid #e5e5e5;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e5e5e5;
      border-top: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #059669;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .otp {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #059669;
      text-align: center;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 20px 0;
    }
    .highlight {
      background-color: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #059669;
      margin: 20px 0;
      border-radius: 4px;
    }
    .credentials {
      font-family: monospace;
      font-size: 14px;
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      width: 100%;
    }
    .credentials td {
      padding: 6px 0;
    }
    .credentials .label {
      color: #64748b;
      padding-right: 16px;
      white-space: nowrap;
    }
    @media (max-width: 600px) {
      .container { padding: 10px; }
      .header, .content, .footer { padding: 20px 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title || "NAVSA"}</h1>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} NAVSA. All rights reserved.</p>
      <p>National Adopted Village for Smart Agriculture</p>
      <p>If you didn't request this email, please ignore it or contact support.</p>
    </div>
  </div>
</body>
</html>
`;

// ------------------------------------------------------------
// WELCOME
// ------------------------------------------------------------
export const welcomeEmailTemplate = (data: EmailTemplateData) => {
  const subject = `Welcome to NAVSA, ${data.name || "there"}!`;
  const content = `
    <h2>Hi ${data.name || "there"},</h2>
    <p>Welcome to <strong>NAVSA</strong> — the National Adopted Village for Smart Agriculture platform.</p>
    <p>NAVSA connects agricultural organizations, farmers, suppliers, and IoT sensor networks with AI-driven agronomy assistance and closed-loop financial wallets.</p>

    <h2>What you can do</h2>
    <ul>
      <li>Manage farms, fields, and crop cycles</li>
      <li>Monitor real-time soil and micro-climate data</li>
      <li>Request farm inputs and receive AI agronomy advice</li>
      <li>Receive payments through your closed and open wallets</li>
    </ul>

    <div class="highlight">
      <p><strong>Your Account</strong></p>
      <p>Email: ${data.email}</p>
      ${data.date ? `<p>Registered on: ${data.date}</p>` : ""}
    </div>

    ${data.link ? `<a href="${data.link}" class="button">Open NAVSA</a>` : ""}

    <p>If you have any questions, reply to this email and our team will help.</p>
    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Welcome to NAVSA") };
};

// ------------------------------------------------------------
// ADMIN CREDENTIALS — NEW
// ------------------------------------------------------------
export const adminCredentialsEmailTemplate = (data: EmailTemplateData) => {
  const subject = `Your NAVSA Admin Account`;
  const content = `
    <h2>Hi ${data.name || "there"},</h2>
    <p>An administrator account has been created for you on <strong>NAVSA</strong>.</p>

    ${data.organizationName ? `<p>You have been assigned as the admin for <strong>${data.organizationName}</strong>.</p>` : ""}

    <p>Use the credentials below to sign in:</p>

    <table class="credentials" cellpadding="0" cellspacing="0">
      <tr>
        <td class="label">Email</td>
        <td>${data.email}</td>
      </tr>
      <tr>
        <td class="label">Password</td>
        <td><strong>${data.password}</strong></td>
      </tr>
    </table>

    ${data.loginUrl ? `<a href="${data.loginUrl}" class="button">Sign in to NAVSA</a>` : ""}

    <div class="highlight">
      <p><strong>Security tip</strong></p>
      <p>Please change your password after signing in for the first time.</p>
    </div>

    <p>If you didn't expect this email, contact support immediately.</p>
    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Your NAVSA Admin Account") };
};

// ------------------------------------------------------------
// ORGANIZATION CREATED — NEW
// ------------------------------------------------------------
export const organizationCreatedEmailTemplate = (data: EmailTemplateData) => {
  const subject = `Your organization has been created on NAVSA`;
  const content = `
    <h2>Hi ${data.name || "there"},</h2>
    <p>Your organization <strong>${data.organizationName}</strong> has been successfully created on NAVSA.</p>

    <div class="highlight">
      <p><strong>Organization Details</strong></p>
      <p>Name: ${data.organizationName}</p>
      ${data.organizationType ? `<p>Type: ${data.organizationType}</p>` : ""}
      <p>Created on: ${data.date || new Date().toLocaleDateString()}</p>
    </div>

    ${
      data.password
        ? `
      <p>An administrator account for your organization has been created. Use the credentials below to sign in:</p>
      <table class="credentials" cellpadding="0" cellspacing="0">
        <tr>
          <td class="label">Email</td>
          <td>${data.email}</td>
        </tr>
        <tr>
          <td class="label">Password</td>
          <td><strong>${data.password}</strong></td>
        </tr>
      </table>
    `
        : ""
    }

    ${data.loginUrl ? `<a href="${data.loginUrl}" class="button">Sign in to NAVSA</a>` : ""}

    <p>You can now onboard farmers, manage farm data, and fund farmer wallets from your admin dashboard.</p>

    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Organization created") };
};

// ------------------------------------------------------------
// PASSWORD RESET
// ------------------------------------------------------------
export const passwordResetEmailTemplate = (data: EmailTemplateData) => {
  const subject = "Reset Your NAVSA Password";
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${data.name || "there"},</p>
    <p>We received a request to reset your NAVSA password.</p>

    <div class="otp">${data.otp}</div>

    <p>Enter this OTP in the app to reset your password. This OTP will expire in 10 minutes.</p>

    ${data.link ? `<p>Or click the button below to reset your password:</p><a href="${data.link}" class="button">Reset Password</a>` : ""}

    <p>If you didn't request this, please ignore this email or contact support.</p>
    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Password Reset") };
};

// ------------------------------------------------------------
// VERIFICATION
// ------------------------------------------------------------
export const verificationEmailTemplate = (data: EmailTemplateData) => {
  const subject = "Verify Your NAVSA Email Address";
  const content = `
    <h2>Email Verification</h2>
    <p>Hi ${data.name || "there"},</p>
    <p>Please verify your email address to complete your NAVSA registration.</p>

    <div class="otp">${data.otp}</div>

    <p>Enter this OTP in the app. It will expire in 10 minutes.</p>

    ${data.link ? `<a href="${data.link}" class="button">Verify Email</a>` : ""}

    <p>If you didn't create an account with NAVSA, please ignore this email.</p>
    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Email Verification") };
};

// ------------------------------------------------------------
// CONTACT
// ------------------------------------------------------------
export const contactEmailTemplate = (data: EmailTemplateData) => {
  const subject = `New Contact Form Submission: ${data.subject}`;
  const content = `
    <h2>New Contact Form Message</h2>
    <p><strong>From:</strong> ${data.name} (${data.email})</p>
    <p><strong>Subject:</strong> ${data.subject}</p>

    <div class="highlight">
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    </div>

    <p><strong>Received:</strong> ${data.date || new Date().toLocaleString()}</p>
  `;
  return { subject, html: baseTemplate(content, "Contact Form Submission") };
};

// ------------------------------------------------------------
// ORDER CONFIRMATION
// ------------------------------------------------------------
export const orderConfirmationEmailTemplate = (data: EmailTemplateData) => {
  const subject = `Input Order Confirmation #${data.orderId}`;
  const content = `
    <h2>Order Confirmed 🎉</h2>
    <p>Hi ${data.name},</p>
    <p>Your input order has been received and is being processed.</p>

    <div class="highlight">
      <p><strong>Order Details</strong></p>
      <p>Order ID: ${data.orderId}</p>
      <p>Amount: ${data.amount}</p>
      <p>Date: ${data.date}</p>
    </div>

    <p>We'll notify you once your order is dispatched.</p>
    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Order Confirmation") };
};

// ------------------------------------------------------------
// NEWSLETTER
// ------------------------------------------------------------
export const newsletterSubscriptionTemplate = (data: EmailTemplateData) => {
  const subject = "Welcome to the NAVSA Newsletter!";
  const content = `
    <h2>Welcome to the NAVSA Newsletter 📰</h2>
    <p>Hi ${data.name || "there"},</p>
    <p>Thank you for subscribing. You'll receive:</p>
    <ul>
      <li>Smart agriculture updates</li>
      <li>Agronomy tips from our AI advisories</li>
      <li>Platform features and releases</li>
      <li>Field stories from across Nigeria</li>
    </ul>

    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Newsletter Subscription") };
};

// ------------------------------------------------------------
// ACCOUNT UPDATE
// ------------------------------------------------------------
export const accountUpdateTemplate = (data: EmailTemplateData) => {
  const subject = "Important: Your NAVSA Account Has Been Updated";
  const content = `
    <h2>Account Updated</h2>
    <p>Hi ${data.name},</p>
    <p>Your NAVSA account information was successfully updated.</p>

    <div class="highlight">
      <p><strong>Update Details</strong></p>
      <p>Date: ${data.date || new Date().toLocaleString()}</p>
      <p>Changes: ${data.subject || "account information"}</p>
    </div>

    <p>If you did not make these changes, contact support immediately.</p>
    <p>Best regards,<br>The NAVSA Team</p>
  `;
  return { subject, html: baseTemplate(content, "Account Update") };
};