// ~/lib/queries/wallet-service.ts
import "server-only";

interface WalletCreationParams {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  farmerId: number;
  accountName: string;
}

interface WalletResponse {
  responseCode: string;
  responseMsg: string;
  responseData: Array<{
    customerId: string;
    bankCode: string;
    accountNo: string;
    accountName: string;
  }>;
}

// Generate required IDs and hashes
function generateWalletRequestData() {
  const customerId = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const requestId = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0];
  const formattedTime = date.toTimeString().split(' ')[0];
  const requestTime = `${formattedDate}T${formattedTime}+000000`;
  
  const merchantId = 'NITDA1234';
  const apiKey = 'TklUREExMjM0fE5JVERB';
  const apiToken = 'RGlxVEZUNlJSUHZZVXZVa1VaRmtCNXhaRzBSUzNBNjNOdzVNQWFpNGRwaz0=';
  
  // Generate hash
  const hashString = apiKey + requestId + apiToken;
  const crypto = require('crypto');
  const apiHash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  return {
    customerId,
    requestId,
    requestTime,
    merchantId,
    apiKey,
    apiToken,
    apiHash
  };
}

export async function createWallet(params: WalletCreationParams): Promise<any> {
  try {
    const {
      customerId,
      requestId,
      requestTime,
      merchantId,
      apiKey,
      apiHash
    } = generateWalletRequestData();

    const dob = "17-12-2019"; // From PHP code
    const gender = "MALE";

    // Prepare request body
    const requestBody = {
      requestId: requestId,
      firstName: params.firstName,
      lastName: params.lastName,
      accountName: params.accountName,
      otherName: "",
      email: params.email,
      phoneNumber: params.phoneNumber,
      dateOfBirth: dob,
      customerId: customerId,
      accountTypeId: "PERSONAL",
      gender: gender,
      otherAccounts: [
        {
          requestId: requestId,
          accountName: "Secondary account",
          accountTypeId: "PERSONAL",
          isRestrictedWallet: true
        }
      ]
    };

    // Make API call to Remita
    const response = await fetch("https://login.remita.net/remita/exapp/api/v1/send/api/schedulesvc/remitawallet/open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MERCHANT_ID": merchantId,
        "API_KEY": apiKey,
        "REQUEST_ID": requestId,
        "REQUEST_TS": requestTime,
        "API_DETAILS_HASH": apiHash,
      },
      body: JSON.stringify(requestBody)
    });

    const result: WalletResponse = await response.json();

    // If wallet creation successful, save to database
    if (result.responseCode === "00" && result.responseData?.length > 0) {
      const primaryAccount = result.responseData[0];
      const secondaryAccount = result.responseData[1];

      await saveWalletData({
        farmerId: params.farmerId,
        customerId: primaryAccount.customerId,
        requestId: requestId,
        accountNumber: primaryAccount.accountNo,
        secondaryAccountNumber: secondaryAccount?.accountNo,
        bankCode: primaryAccount.bankCode
      });

      return {
        success: true,
        data: result
      };
    }

    return {
      success: false,
      message: result.responseMsg,
      data: result
    };

  } catch (error) {
    console.error("Wallet creation error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Wallet creation failed",
      error
    };
  }
}

async function saveWalletData(data: {
  farmerId: number;
  customerId: string;
  requestId: string;
  accountNumber: string;
  secondaryAccountNumber?: string;
  bankCode: string;
}) {
  try {
    const { db } = await import("../db");
    
    await db.insert(
      `INSERT INTO openWallet_data(
        farmerId, customerId, requestId, account_number, new_account, bankCode
      ) VALUES(?, ?, ?, ?, ?, ?)`,
      [
        data.farmerId,
        data.customerId,
        data.requestId,
        data.accountNumber,
        data.secondaryAccountNumber || '',
        data.bankCode
      ]
    );
  } catch (error) {
    console.error("Error saving wallet data:", error);
    throw error;
  }
}