// src/components/dashboard/DashboardLoading.tsx
export const DashboardLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Loading dashboard...
      </p>
    </div>
  </div>
);