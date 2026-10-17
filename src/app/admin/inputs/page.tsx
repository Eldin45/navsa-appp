// src/app/dashboard/inputs/page.tsx (server component)
import { getCurrentUser } from "~/lib/auth1";
import InputsPage from "./page.client";
// import { 
//   getAllInputRequests, 
//   getPendingInputRequests, 
//   getApprovedInputRequests,
//   getRejectedInputRequests,
//   getRecentPendingInputRequests 
// } from "~/lib/queries/input-requests";
import { getPendingInputRequests,getAllInputRequests,getApprovedInputRequests, getRejectedInputRequests,getRecentPendingInputRequests  } from "~/lib/queries/input-request";

export default async function InputsPageServer() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.phone) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    const state_batch = user.state_batch || "A";
    const dash_id = user.dash_id || 0;

    // Fetch all data in parallel
    const [
      allRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      recentPendingRequests
    ] = await Promise.all([
      getAllInputRequests(dash_id, state_batch),
      getPendingInputRequests(dash_id, state_batch),
      getApprovedInputRequests(dash_id, state_batch),
      getRejectedInputRequests(dash_id, state_batch),
      getRecentPendingInputRequests(dash_id, state_batch, 10)
    ]);

    // Ensure all arrays are defined
    const safeAllRequests = Array.isArray(allRequests) ? allRequests : [];
    const safePendingRequests = Array.isArray(pendingRequests) ? pendingRequests : [];
    const safeApprovedRequests = Array.isArray(approvedRequests) ? approvedRequests : [];
    const safeRejectedRequests = Array.isArray(rejectedRequests) ? rejectedRequests : [];
    const safeRecentPendingRequests = Array.isArray(recentPendingRequests) ? recentPendingRequests : [];

    console.log("Dashboard data loaded:", {
      totalRequests: safeAllRequests.length,
      pendingRequests: safePendingRequests.length,
      approvedRequests: safeApprovedRequests.length,
      rejectedRequests: safeRejectedRequests.length,
      recentRequests: safeRecentPendingRequests.length
    });

    const userData = {
      id: user.id || "",
      phone: user.phone || "",
      cus: user.cus || "",
      email: user.email || "",
      dashId: dash_id,
      avatar: user.avatar || null,
      stateBatch: state_batch
    };

    return (
      <InputsPage
        user={userData}
        allInputRequests={safeAllRequests}
        pendingInputRequests={safePendingRequests}
        approvedInputRequests={safeApprovedRequests}
        rejectedInputRequests={safeRejectedRequests}
        recentPendingInputRequests={safeRecentPendingRequests}
      />
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error Loading Dashboard</h1>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}