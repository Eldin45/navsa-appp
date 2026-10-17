// src/components/FundWalletCard.tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function FundWalletCard({
  wallet,
}: {
  wallet: {
    id: string;
    type: string;
    palmPayAccountNumber: string | null;
    palmPayAccountName: string | null;
    palmPayBankName: string | null;
    palmPayStatus: string | null;
  };
}) {
  const [copied, setCopied] = useState(false);

  if (wallet.palmPayStatus !== "ACTIVE" || !wallet.palmPayAccountNumber) {
    return (
      <div className="rounded-2xl border p-6 bg-white">
        <h3 className="font-semibold mb-2">Fund your wallet</h3>
        <p className="text-sm text-gray-500">
          Your virtual account is being provisioned. Please refresh in a moment.
        </p>
      </div>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(wallet.palmPayAccountNumber!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border p-6 bg-white">
      <h3 className="font-semibold mb-2">Fund your wallet</h3>
      <p className="text-sm text-gray-600 mb-4">
        Transfer to the account below from any Nigerian bank. Your wallet updates automatically.
      </p>

      <div className="space-y-2 font-mono text-sm">
        <div>
          <span className="text-gray-500">Account Number: </span>
          <span className="font-bold">{wallet.palmPayAccountNumber}</span>
        </div>
        <div>
          <span className="text-gray-500">Bank: </span>
          <span className="font-bold">{wallet.palmPayBankName}</span>
        </div>
        <div>
          <span className="text-gray-500">Account Name: </span>
          <span className="font-bold">{wallet.palmPayAccountName}</span>
        </div>
      </div>

      <button
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2e7d32] text-white rounded-xl hover:bg-[#1b5e20]"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy Account Number"}
      </button>
    </div>
  );
}