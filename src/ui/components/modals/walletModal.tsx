// src/components/modals/WalletModal.tsx
"use client";

import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Building2, User, Copy, Check } from 'lucide-react';
//import { useModal } from '@/contexts/ModalContext';
import { useModal } from '~/lib/context/modalContext';

export default function WalletModal() {
  const { isModalOpen, modalType, closeModal } = useModal();
  const [copied, setCopied] = useState(false);

  if (!isModalOpen) return null;

  const accountInfo = {
    accountNumber: "1234567890",
    accountName: "NAVSA Agro Tech Ltd.",
    bankName: "First Bank of Nigeria",
    balance: "₦ 2,450,000.00",
    lastTransaction: "₦ 150,000.00",
    lastTransactionDate: "2024-02-07"
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAccountInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Account Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Main corporate account details</p>
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(`${accountInfo.accountNumber} - ${accountInfo.bankName}`)}
          className="flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span>{copied ? 'Copied!' : 'Copy Details'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Account Number</span>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {accountInfo.accountNumber}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bank Name</span>
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {accountInfo.bankName}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Account Name</span>
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {accountInfo.accountName}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance</span>
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {accountInfo.balance}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">Recent Transaction</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-400">Last Deposit</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">{accountInfo.lastTransactionDate}</p>
          </div>
          <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">
            {accountInfo.lastTransaction}
          </p>
        </div>
      </div>
    </div>
  );

  const renderFundAccount = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fund Corporate Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add funds to the main account</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount to Fund
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
            <input
              type="number"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-8 pr-4 text-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Bank Transfer', 'Card Payment', 'USSD', 'Mobile Money'].map((method) => (
              <button
                key={method}
                className="rounded-lg border border-gray-300 p-3 text-center hover:border-green-500 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-500"
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reference (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter reference note"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        <button className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700">
          Proceed to Payment
        </button>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-300">Account Details for Transfer</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
            <span className="font-medium">1234567890</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Bank:</span>
            <span className="font-medium">First Bank of Nigeria</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
            <span className="font-medium">NAVSA Agro Tech Ltd.</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {modalType === 'account-info' ? 'Account Information' : 'Fund Corporate Account'}
          </h2>
          <button
            onClick={closeModal}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {modalType === 'account-info' ? renderAccountInfo() : renderFundAccount()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
            {modalType === 'fund-account' && (
              <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
                Confirm Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}