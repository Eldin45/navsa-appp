// ~/lib/queries/wallet.ts
import "server-only";
import { db } from "../db";
import crypto from "crypto";

// Types
export interface DashboardAdmin {
  dadmin_id: number;
  fullname: string;
  admin_email: string;
  admin_phone: string;
  role: string;
  created_at: Date;
}

export interface DashboardWallet {
  wallet_id: number;
  user_id: number;
  account_number: string;
  bank_code: string;
  account_name: string;
  customer_id: string;
  request_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface WalletTransaction {
  transaction_id: number;
  credit_account: string;
  debit_account: string;
  amount: number;
  status: number;
  reference: string;
  description: string;
  created_at: Date;
}

export interface WalletBalance {
  bankCode: string;
  totalInflowAmt: number;
  totalOutflowAmt: number;
  ledgerBalance: number;
  accountName: string;
  netBalance: number;
  currency: string;
  accountNumber: string;
  availableBalance: number;
}

export interface WalletBalanceResponse {
  responseCode: string;
  responseMsg: string;
  responseData: WalletBalance[];
}

// Generate required wallet request data
function generateWalletRequestData(requestId?: string) {
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0];
  const formattedTime = date.toTimeString().split(' ')[0];
  const requestTime = `${formattedDate}T${formattedTime}+000000`;
  
  const merchantId = process.env.REMITA_MERCHANT_ID || 'NITDA1234';
  const apiKey = process.env.REMITA_API_KEY || 'TklUREExMjM0fE5JVERB';
  const apiToken = process.env.REMITA_API_TOKEN || 'RGlxVEZUNlJSUHZZVXZVa1VaRmtCNXhaRzBSUzNBNjNOdzVNQWFpNGRwaz0=';
  
  const reqId = requestId || Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  
  // Generate hash
  const hashString = apiKey + reqId + apiToken;
  const apiHash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  return {
    requestId: reqId,
    requestTime,
    merchantId,
    apiKey,
    apiHash
  };
}

// Get dashboard admin by ID
export async function getDashboardAdmin(dashId: number): Promise<DashboardAdmin | null> {
  try {
    const admin = await db.queryOne<DashboardAdmin>(
      `SELECT * FROM dashboard_admin WHERE dadmin_id = ?`,
      [dashId]
    );
    return admin || null;
  } catch (error) {
    console.error("Failed to fetch dashboard admin:", error);
    return null;
  }
}

// Get dashboard wallet by user ID
export async function getDashboardWallet(userId: number): Promise<DashboardWallet | null> {
  try {
    const wallet = await db.queryOne<DashboardWallet>(
      `SELECT * FROM dashboard_wallet WHERE user_id = ?`,
      [userId]
    );
    return wallet || null;
  } catch (error) {
    console.error("Failed to fetch dashboard wallet:", error);
    return null;
  }
}

// Get dashboard wallet with admin details (join)
export async function getDashboardWalletWithAdmin(): Promise<Array<DashboardWallet & DashboardAdmin> | null> {
  try {
    const wallets = await db.query<DashboardWallet & DashboardAdmin>(
      `SELECT a.*, b.* 
       FROM dashboard_admin as a 
       INNER JOIN dashboard_wallet as b ON a.dadmin_id = b.user_id`
    );
    return wallets || null;
  } catch (error) {
    console.error("Failed to fetch dashboard wallets with admin:", error);
    return null;
  }
}

// Get successful transactions for a specific wallet
export async function getWalletTransactions(
  walletAccountNumber: string,
  debitAccount: string = '03571646710',
  status: number = 1
): Promise<WalletTransaction[]> {
  try {
    const transactions = await db.query<WalletTransaction>(
      `SELECT * FROM dashboard_transfer 
       WHERE credit_account = ? 
         AND debit_account = ? 
         AND status = ?`,
      [walletAccountNumber, debitAccount, status]
    );
    return transactions || [];
  } catch (error) {
    console.error("Failed to fetch wallet transactions:", error);
    return [];
  }
}

// Get wallet balance from Remita API
export async function getWalletBalance(walletAccountNumber: string): Promise<WalletBalanceResponse | null> {
  try {
    const { requestId, requestTime, merchantId, apiKey, apiHash } = generateWalletRequestData();

    const response = await fetch(
      `https://login.remita.net/remita/exapp/api/v1/send/api/schedulesvc/remitawallet/balance/598/${walletAccountNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "MERCHANT_ID": merchantId,
          "API_KEY": apiKey,
          "REQUEST_ID": requestId,
          "REQUEST_TS": requestTime,
          "API_DETAILS_HASH": apiHash,
        },
        next: { revalidate: 60 } // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Wallet balance fetch failed: ${response.statusText}`);
    }

    const result: WalletBalanceResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to fetch wallet balance:", error);
    return null;
  }
}

// Get complete wallet information with balance
export async function getCompleteWalletInfo(dashId: number): Promise<{
  admin: DashboardAdmin | null;
  wallet: DashboardWallet | null;
  transactions: WalletTransaction[];
  balance: WalletBalance | null;
} | null> {
  try {
    // Get dashboard admin
    const admin = await getDashboardAdmin(dashId);
    if (!admin) {
      return null;
    }

    // Get dashboard wallet
    const wallet = await getDashboardWallet(dashId);
    if (!wallet) {
      return {
        admin,
        wallet: null,
        transactions: [],
        balance: null
      };
    }

    // Get transactions
    const transactions = await getWalletTransactions(wallet.account_number);

    // Get wallet balance from Remita
    const balanceResponse = await getWalletBalance(wallet.account_number);
    const balance = balanceResponse?.responseData?.[0] || null;

    return {
      admin,
      wallet,
      transactions,
      balance
    };
  } catch (error) {
    console.error("Failed to fetch complete wallet info:", error);
    return null;
  }
}

// Save wallet transaction
export async function saveWalletTransaction(data: {
  credit_account: string;
  debit_account: string;
  amount: number;
  reference: string;
  description: string;
  status?: number;
}): Promise<number | null> {
  try {
    const insertId = await db.insert(
      `INSERT INTO dashboard_transfer (
        credit_account, debit_account, amount, reference, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.credit_account,
        data.debit_account,
        data.amount,
        data.reference,
        data.description,
        data.status || 1
      ]
    );
    return insertId;
  } catch (error) {
    console.error("Failed to save wallet transaction:", error);
    return null;
  }
}