"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock as ClockIcon,
  ShoppingBag,
  Calendar,
  Check,
  X,
  Plus,
  Wheat,
  Egg,
  TreePine,
  Fish,
  Sprout,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown
} from "lucide-react";

// Import components
import Navbar from "~/ui/components/header/header";
import Sidebar from "~/ui/components/sidebar/sidebar";

// Import React Table
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from "@tanstack/react-table";

// Loading component - UPDATED: Only shows spinner in content area
const InputsLoading = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-transparent">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Loading inputs request data...
      </p>
    </div>
  </div>
);

// Input Request type definition
interface InputRequest {
  request_id: number;
  supplier_id: number;
  farmerId: number;
  status: number;
  approoveStat: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  ins_id: number;
  company_name?: string;
  company_email?: string;
  phone?: string;
  farmer_id: number;
  dash_id: number;
  f_surname: string;
  first_name: string;
  f_email: string;
  f_phone: string;
  gender: string;
  reg_date: string | Date;
  state: string;
  lga: string;
  farm_name: string;
  farm_size: number;
  f_loc: string;
  ents_id: number;
  state_batch: string;
  ent_id: number;
  enterprise_name?: string;
  enterprise_type?: string;
  farmerAvatar?: string;
}

// Props interface with default values
interface InputsPageProps {
  user: any;
  allInputRequests?: InputRequest[];
  pendingInputRequests?: InputRequest[];
  approvedInputRequests?: InputRequest[];
  rejectedInputRequests?: InputRequest[];
  recentPendingInputRequests?: InputRequest[];
}

// Status badge component
const StatusBadge = ({ approoveStat }: { status: number; approoveStat: number }) => {
  const getStatusConfig = (approoveStat: number) => {
    if (approoveStat === 0) {
      return {
        label: "Pending Review",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: ClockIcon
      };
    } else if (approoveStat === 1) {
      return {
        label: "Approved",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle
      };
    } else if (approoveStat === 2) {
      return {
        label: "Rejected",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle
      };
    } else {
      return {
        label: "Unknown",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        icon: AlertCircle
      };
    }
  };

  const config = getStatusConfig(approoveStat);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Enterprise badge component
const EnterpriseBadge = ({ enterprise }: { enterprise?: string }) => {
  const enterpriseConfig: Record<string, { icon: any; color: string }> = {
    "Maize Farming": { icon: Wheat, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    "Poultry Farming": { icon: Egg, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    "Rice Farming": { icon: Egg, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    "Cassava Farming": { icon: TreePine, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    "Fish Farming": { icon: Fish, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" }
  };

  const config = enterpriseConfig[enterprise || ""] || { icon: Sprout, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {enterprise || "Unknown"}
    </span>
  );
};

// Stats card component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon,
  color = "primary",
  subtitle
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  color?: "primary" | "success" | "warning" | "info" | "danger";
  subtitle?: string;
}) => {
  const colorClasses = {
    primary: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    success: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    warning: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    info: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20",
    danger: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
  };

  return (
    <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Define columns for the data table
const createColumns = (): ColumnDef<InputRequest>[] => [
  {
    accessorKey: "farmer",
    header: "Farmer",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {`${request.f_surname?.charAt(0) || ''}${request.first_name?.charAt(0) || ''}`.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">
              {request.f_surname} {request.first_name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {request.f_phone}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "farm_details",
    header: "Farm Details",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {request.farm_name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {request.f_loc}, {request.lga}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "enterprise_name",
    header: "Enterprise",
    cell: ({ row }) => {
      const request = row.original;
      return <EnterpriseBadge enterprise={request.enterprise_name} />;
    },
  },
  {
    accessorKey: "company_name",
    header: "Supplier",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div>
          <div className="font-medium">{request.company_name || "No supplier"}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {request.phone || "No contact"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const request = row.original;
      return <StatusBadge status={request.status} approoveStat={request.approoveStat} />;
    },
  },
  {
    accessorKey: "created_at",
    header: "Request Date",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="text-sm">
          {request.created_at ? new Date(request.created_at).toLocaleDateString() : "N/A"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const request = row.original;
      
      const handleApprove = () => {
        toast.success(`Request #${request.request_id} approved!`);
      };

      const handleReject = () => {
        toast.error(`Request #${request.request_id} rejected!`);
      };

      const handleViewDetails = () => {
        toast.info(`Viewing details for request #${request.request_id}`);
      };

      return (
        <div className="flex gap-2">
          {request.approoveStat === 0 && (
            <>
              <button
                onClick={handleApprove}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                <Check className="h-3 w-3 inline mr-1" />
                Approve
              </button>
              <button
                onClick={handleReject}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                <X className="h-3 w-3 inline mr-1" />
                Reject
              </button>
            </>
          )}
          <button
            onClick={handleViewDetails}
            className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Eye className="h-3 w-3 inline mr-1" />
            View
          </button>
        </div>
      );
    },
  },
];

// Main component with default props
export default function InputsPage({
  user = {},
  allInputRequests = [],
  pendingInputRequests = [],
  approvedInputRequests = [],
  rejectedInputRequests = [],
  recentPendingInputRequests = []
}: InputsPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputRequests, setInputRequests] = useState<InputRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Use safe versions of props
  const safeAllRequests = allInputRequests || [];
  const safePendingRequests = pendingInputRequests || [];
  const safeApprovedRequests = approvedInputRequests || [];
  const safeRejectedRequests = rejectedInputRequests || [];
  const safeRecentRequests = recentPendingInputRequests || [];

  // Process and set data based on active filter
  useEffect(() => {
    let requestsToProcess: InputRequest[] = [];
    
    switch (activeFilter) {
      case "all":
        requestsToProcess = safeAllRequests;
        break;
      case "pending":
        requestsToProcess = safePendingRequests;
        break;
      case "approved":
        requestsToProcess = safeApprovedRequests;
        break;
      case "rejected":
        requestsToProcess = safeRejectedRequests;
        break;
    }
    
    if (requestsToProcess.length > 0) {
      const processedRequests = requestsToProcess.map(request => ({
        ...request,
        farmerAvatar: `${request.f_surname?.charAt(0) || ''}${request.first_name?.charAt(0) || ''}`.toUpperCase(),
      }));
      
      setInputRequests(processedRequests);
    } else {
      setInputRequests([]);
    }
    
    // Reset pagination when filter changes
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, [safeAllRequests, safePendingRequests, safeApprovedRequests, safeRejectedRequests, activeFilter]);

  // Stats calculations
  const totalRequests = safeAllRequests.length;
  const pendingRequests = safePendingRequests.length;
  const approvedRequests = safeApprovedRequests.length;
  const rejectedRequests = safeRejectedRequests.length;

  // Create columns
  const columns = useMemo(() => createColumns(), []);

  // Initialize React Table
  const table = useReactTable({
    data: inputRequests,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter: searchQuery,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const request = row.original;
      const searchLower = filterValue.toLowerCase();
      
      return (
        request.first_name?.toLowerCase().includes(searchLower) ||
        request.f_surname?.toLowerCase().includes(searchLower) ||
        request.farm_name?.toLowerCase().includes(searchLower) ||
        (request.company_name?.toLowerCase().includes(searchLower)) ||
        request.f_loc?.toLowerCase().includes(searchLower) ||
        request.lga?.toLowerCase().includes(searchLower) ||
        request.enterprise_name?.toLowerCase().includes(searchLower)
      );
    },
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Data refreshed!");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Imported Components - Always visible */}
      <Navbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-0' : ''} lg:ml-64`}>
        <div className="p-4 md:p-6 pt-20 lg:pt-24">
          {isLoading ? (
            <InputsLoading />
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-gray-50">
                      Input Requests Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Manage and track agricultural input requests from farmers
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <button className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date().toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div 
                  className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-blue-500 dark:border-gray-700 dark:bg-gray-900 ${activeFilter === "all" ? "border-blue-500 border-2" : "bg-white"}`}
                  onClick={() => setActiveFilter("all")}
                >
                  <StatsCard
                    title="Total Requests"
                    value={totalRequests}
                    icon={ShoppingBag}
                    color="primary"
                    subtitle={`${pendingRequests} pending`}
                  />
                </div>
                
                <div 
                  className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-yellow-500 dark:border-gray-700 dark:bg-gray-900 ${activeFilter === "pending" ? "border-yellow-500 border-2" : "bg-white"}`}
                  onClick={() => setActiveFilter("pending")}
                >
                  <StatsCard
                    title="Pending Review"
                    value={pendingRequests}
                    icon={ClockIcon}
                    color="warning"
                    subtitle="Awaiting approval"
                  />
                </div>
                
                <div 
                  className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-green-500 dark:border-gray-700 dark:bg-gray-900 ${activeFilter === "approved" ? "border-green-500 border-2" : "bg-white"}`}
                  onClick={() => setActiveFilter("approved")}
                >
                  <StatsCard
                    title="Approved"
                    value={approvedRequests}
                    icon={CheckCircle}
                    color="success"
                    subtitle="Ready for disbursement"
                  />
                </div>
                
                <div 
                  className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-red-500 dark:border-gray-700 dark:bg-gray-900 ${activeFilter === "rejected" ? "border-red-500 border-2" : "bg-white"}`}
                  onClick={() => setActiveFilter("rejected")}
                >
                  <StatsCard
                    title="Rejected"
                    value={rejectedRequests}
                    icon={XCircle}
                    color="danger"
                    subtitle="Not approved"
                  />
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeFilter === "all" ? "bg-blue-500 text-white" : "border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"}`}
                >
                  All ({totalRequests})
                </button>
                <button
                  onClick={() => setActiveFilter("pending")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeFilter === "pending" ? "bg-yellow-500 text-white" : "border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"}`}
                >
                  Pending ({pendingRequests})
                </button>
                <button
                  onClick={() => setActiveFilter("approved")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeFilter === "approved" ? "bg-green-500 text-white" : "border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"}`}
                >
                  Approved ({approvedRequests})
                </button>
                <button
                  onClick={() => setActiveFilter("rejected")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeFilter === "rejected" ? "bg-red-500 text-white" : "border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"}`}
                >
                  Rejected ({rejectedRequests})
                </button>
              </div>

              {/* Action Bar */}
              <div className="mb-6 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by farmer name, farm, or supplier..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.info("Export feature coming soon!")}
                      className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </button>
                    {activeFilter === "pending" && pendingRequests > 0 && (
                      <button
                        onClick={() => toast.info("Bulk approval feature coming soon!")}
                        className="flex items-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Bulk Approve
                      </button>
                    )}
                    <button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Pending Requests */}
              {(activeFilter === "all" || activeFilter === "pending") && safeRecentRequests && safeRecentRequests.length > 0 && (
                <div className="mb-6 rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
                  <div className="p-4 border-b dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">Recent Pending Requests</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {safeRecentRequests.length} most recent requests requiring attention
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveFilter("pending")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        View All Pending →
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {safeRecentRequests.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                              {`${request.f_surname?.charAt(0) || ''}${request.first_name?.charAt(0) || ''}`.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {request.f_surname} {request.first_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {request.farm_name} • {request.enterprise_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {request.created_at ? new Date(request.created_at).toLocaleDateString() : "N/A"}
                            </div>
                            <button
                              onClick={() => toast.success(`Request #${request.request_id} approved!`)}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              <Check className="h-3 w-3 inline mr-1" />
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="p-4 border-b dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                        {activeFilter === "all" ? "All Input Requests" : 
                        activeFilter === "pending" ? "Pending Input Requests" :
                        activeFilter === "approved" ? "Approved Input Requests" : "Rejected Input Requests"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Showing {table.getRowModel().rows.length} of {inputRequests.length} requests
                        {searchQuery && ` • Filtered by: "${searchQuery}"`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b dark:border-gray-800">
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  {...{
                                    className: header.column.getCanSort()
                                      ? 'cursor-pointer select-none flex items-center gap-1'
                                      : '',
                                    onClick: header.column.getToggleSortingHandler(),
                                  }}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {{
                                    asc: <ChevronUp className="h-4 w-4" />,
                                    desc: <ChevronDown className="h-4 w-4" />,
                                  }[header.column.getIsSorted() as string] ?? 
                                    (header.column.getCanSort() ? <ChevronsUpDown className="h-4 w-4" /> : null)}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-6 py-4">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length} className="px-6 py-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                              <ShoppingBag className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                              {inputRequests.length === 0 ? "No input requests found" : "No matching requests"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              {inputRequests.length === 0 
                                ? "No input requests have been submitted yet" 
                                : "Try adjusting your search or filter"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t px-6 py-4 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </button>
                    <button
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </button>
                    <select
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium dark:border-gray-600 dark:bg-gray-800"
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                          Show {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}