// src/app/unauthorized/page.tsx
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f5e9] via-white to-[#f1f8e9] p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          You don&apos;t have permission to view this page. Please sign in with
          the correct account.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#2e7d32] text-white rounded-xl hover:bg-[#1b5e20] font-medium"
          >
            Back to Sign In
          </Link>
          <Link
            href="/support"
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}