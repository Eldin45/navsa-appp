// src/lib/palmpay/client.ts
import crypto from "crypto";

// ============================================================
// CONFIG
// ============================================================

const BASE_URL = process.env.PALMPAY_BASE_URL || "https://openapi.palmpay.com";
const APP_ID = process.env.PALMPAY_APP_ID!;
const MERCHANT_ID = process.env.PALMPAY_MERCHANT_ID!;
const PRIVATE_KEY = (process.env.PALMPAY_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const PUBLIC_KEY = (process.env.PALMPAY_PUBLIC_KEY || "").replace(/\\n/g, "\n");
const WEBHOOK_SECRET = process.env.PALMPAY_WEBHOOK_SECRET || "";

// ============================================================
// TYPES
// ============================================================

export interface CreateVirtualAccountInput {
  reference: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bvn?: string;
  nin?: string;
}

export interface VirtualAccountResponse {
  customerId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  reference: string;
  status: string;
  raw: any;
}

// ============================================================
// SIGNING
// ============================================================

function signRequest(payload: Record<string, any>): string {
  const sortedKeys = Object.keys(payload).sort();
  const signString = sortedKeys
    .filter((k) => payload[k] !== undefined && payload[k] !== null)
    .map((k) => `${k}=${payload[k]}`)
    .join("&");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signString);
  signer.end();
  return signer.sign(PRIVATE_KEY, "base64");
}

function buildHeaders(body: Record<string, any>) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const full = { ...body, appId: APP_ID, merchantId: MERCHANT_ID, timestamp, nonce };
  const signature = signRequest(full);

  return {
    "Content-Type": "application/json",
    appId: APP_ID,
    merchantId: MERCHANT_ID,
    timestamp,
    nonce,
    signature,
  };
}

// ============================================================
// REQUEST
// ============================================================

async function request<T>(path: string, body: Record<string, any>): Promise<T> {
  const headers = buildHeaders(body);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, appId: APP_ID, merchantId: MERCHANT_ID }),
  });

  const json: any = await res.json().catch(() => ({}));

  if (!res.ok || (json.respCode && json.respCode !== "00000000")) {
    throw new Error(
      json.respMsg || json.message || `PalmPay request failed (${res.status})`
    );
  }

  return json.data ?? json;
}

// ============================================================
// API
// ============================================================

export const palmPay = {
  async createVirtualAccount(input: CreateVirtualAccountInput): Promise<VirtualAccountResponse> {
    const data: any = await request("/pf/merchant/virtual-account/create", {
      reference: input.reference,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      bvn: input.bvn,
      nin: input.nin,
    });

    return {
      customerId: data.customerId || data.virtualAccountId,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      bankName: data.bankName || "PalmPay",
      bankCode: data.bankCode || "999991",
      reference: input.reference,
      status: data.status || "ACTIVE",
      raw: data,
    };
  },

  async getVirtualAccount(reference: string): Promise<VirtualAccountResponse> {
    const data: any = await request("/pf/merchant/virtual-account/query", { reference });

    return {
      customerId: data.customerId || data.virtualAccountId,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      bankName: data.bankName || "PalmPay",
      bankCode: data.bankCode || "999991",
      reference,
      status: data.status || "ACTIVE",
      raw: data,
    };
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    try {
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(rawBody);
      verifier.end();
      return verifier.verify(PUBLIC_KEY, signature, "base64");
    } catch {
      // Fallback: HMAC-SHA512 (some PalmPay merchant configs use this)
      try {
        const expected = crypto
          .createHmac("sha512", WEBHOOK_SECRET)
          .update(rawBody)
          .digest("hex");
        return crypto.timingSafeEqual(
          Buffer.from(expected),
          Buffer.from(signature)
        );
      } catch {
        return false;
      }
    }
  },
};