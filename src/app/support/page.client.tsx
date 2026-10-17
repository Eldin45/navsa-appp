"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Package,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  X,
  Info,
  Lock,
} from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";
import { Label } from "~/ui/primitives/label";
import { Textarea } from "~/ui/primitives/textarea";
import CurrencyInput from "react-currency-input-field";

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  subscription: {
    plan: number;
    status: { status: string; planId: number; planType: string }[];
    expiresAt: { expiresAt: string }[];
  };
  businessCount: number;
  productCount: number;
  lastActive: string;
  businesses?: Business[];
  products?: Product[];
}

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalProducts: number;
  activeSubscriptions: number;
}

interface Business {
  id: string;
  name: string;
  type: string;
  status: string;
  products: number;
  createdAt: string;
  owner: string;
  whatsapp: string;
  store?: string;
  manage?: string;
  ownerId: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  business: string;
  businessId: string;
  createdAt: string;
  ownerId: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  features: string[];
  isActive: boolean;
  type: "monthly" | "quarterly" | "yearly";
}

interface SubscriptionPlanForm extends Omit<SubscriptionPlan, "id"> {}

type TabType = "users" | "businesses" | "products";
type UserDetailTabType = "businesses" | "products" | "subscriptions";

// New Interfaces for API data parsing
interface ApiUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  subscription?: {
    plan?: number;
    status?: { status: string; planId: number; planType: string }[];
    expiresAt?: { expiresAt: string }[];
  };
  plan?: number;
  status?: { status: string; planId: number; planType: string }[];
  expiresAt?: { expiresAt: string }[];
  businessCount?: number;
  businesses?: ApiBusiness[];
  productCount?: number;
  products?: ApiProduct[];
  lastActive?: string;
  updatedAt?: string;
}

interface ApiBusiness {
  id?: string;
  _id?: string;
  name?: string;
  businessName?: string;
  type?: string;
  status?: string;
  products?: number;
  whatsapp?: string;
  store?: string;
  manage?: string;
  productCount?: number;
  createdAt?: string;
  owner?: string;
  ownerId?: string;
}

interface ApiProduct {
  id?: string;
  _id?: string;
  name?: string;
  category?: string;
  price?: number;
  stock?: number;
  status?: string;
  business?: string;
  businessId?: string;
  createdAt?: string;
  ownerId?: string;
}

// Phone Authentication Component
function PhoneAuthModal({
  isOpen,
  onSuccess,
}: {
  isOpen: boolean;
  onSuccess: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Static authorized phone numbers
  const AUTHORIZED_NUMBERS = ["23381992", "08123699909"];

  // Helper function to clean and normalize phone numbers
  const cleanPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If it starts with 0 and has 11 digits, convert to 234 format
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "234" + cleaned.substring(1);
    }

    // If it's 10 digits without 234, add 234
    if (cleaned.length === 10 && !cleaned.startsWith("234")) {
      cleaned = "234" + cleaned;
    }

    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const cleanedInput = cleanPhoneNumber(phoneNumber);

      // Check if the cleaned number matches any authorized number
      const isAuthorized = AUTHORIZED_NUMBERS.some((authorized) => {
        const cleanedAuthorized = cleanPhoneNumber(authorized);
        return cleanedInput === cleanedAuthorized;
      });

      if (isAuthorized) {
        toast.success("Access granted! Welcome to Admin Dashboard.");
        // Store authentication in localStorage
        localStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("admin_auth_time", Date.now().toString());
        onSuccess();
      } else {
        setError("Access denied. Please check your phone number.");
        toast.error("Invalid phone number. Access denied.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Access Required
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Enter your authorized phone number to continue
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="admin-phone"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  PIN
                </Label>
                <Input
                  id="admin-phone"
                  type="tel"
                  placeholder="Enter your PIN"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  required
                  className="w-full h-12 text-lg text-center font-medium border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                size="lg"
                disabled={isLoading || !phoneNumber.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Verifying Access...
                  </>
                ) : (
                  <>
                    <Lock className="mr-3 h-5 w-5" />
                    Access Dashboard
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                <strong>Note:</strong> This dashboard is restricted to
                authorized personnel only. Contact system administrator if you
                need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
const getPlanName = (planId: number) => {
  switch (planId) {
    case 1:
      return "TRIAL";
    case 2:
      return "BASIC";
    case 3:
      return "STANDARD";
    case 4:
      return "PREMIUM";
    default:
      return "N/A";
  }
};

const formatReadableDate = (isoString: string) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Invalid Date";
  }
};

function setNumber(number: string): string {
  if (!number) return "";
  const cleanNumber = number.replace(/\D/g, "");
  if (cleanNumber.startsWith("234") && cleanNumber.length === 13) {
    return cleanNumber;
  }
  if (cleanNumber.startsWith("0") && cleanNumber.length === 11) {
    return "234" + cleanNumber.substring(1);
  }
  if (cleanNumber.length === 10) {
    return "234" + cleanNumber;
  }
  return cleanNumber;
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// WhatsApp Modal Component
interface WhatsAppModalProps {
  user: User;
  business: Business | null;
  onClose: () => void;
}

function WhatsAppModal({ user, business, onClose }: WhatsAppModalProps) {
  const getWhatsAppNumber = () => {
    if (
      business?.whatsapp &&
      business.whatsapp !== "Unknown Owner" &&
      business.whatsapp.trim() !== ""
    ) {
      return business.whatsapp;
    }
    if (user.phone && user.phone !== "No phone" && user.phone.trim() !== "") {
      return user.phone;
    }
    return "+2348123699909";
  };

  const whatsappNumber = getWhatsAppNumber();
  const storeLink = business?.store;
  const managementLink = business?.manage;

  const [customMessage, setCustomMessage] = useState(
    `Welcome to Qreta! 🚀

We're thrilled to have you here. Your journey to simpler, faster sales starts with one powerful first step: adding your products.

🔑 Your store is already set up with these 2 powerful links:
   
    🧰 Manage Link: ${managementLink}
    - Add products & track orders here

    🛍 Store/Site Link: ${storeLink}
    -- Share this with customers so they can browse & buy instantly

Just add your products using your Manage Link, and you're ready to start selling! We'll be here to help you grow.

Welcome aboard,
The Qreta Team
`,
  );

  const whatsappLink = `https://wa.me/${setNumber(whatsappNumber)}?text=${encodeURIComponent(
    customMessage,
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
          type="button"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold">Send WhatsApp Welcome Message</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Send a welcome message to{" "}
          <strong>{business ? business.owner : user.name}</strong> via WhatsApp.
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
            <Info size={20} />
            {business ? "Business Details" : "User Details"}
          </div>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {business ? (
              <>
                <li>
                  <strong>Business</strong>: {business.name}
                </li>
                <li>
                  <strong>Owner</strong>: {business.owner}
                </li>
                <li>
                  <strong>Type</strong>: {business.type}
                </li>
                <li>
                  <strong>Store Link</strong>:{" "}
                  <span className="text-blue-600">{storeLink}</span>
                </li>
                <li>
                  <strong>Management Link</strong>:{" "}
                  <span className="text-blue-600">{managementLink}</span>
                </li>
                <li>
                  <strong>WhatsApp</strong>:{" "}
                  {business.whatsapp || "Not provided"}
                </li>
              </>
            ) : (
              <>
                <li>
                  <strong>Name</strong>: {user.name}
                </li>
                <li>
                  <strong>Email</strong>: {user.email}
                </li>
                <li>
                  <strong>Phone</strong>: {user.phone}
                </li>
                <li>
                  <strong>Store Link</strong>:{" "}
                  <span className="text-blue-600">{storeLink}</span>
                </li>
                <li>
                  <strong>Management Link</strong>:{" "}
                  <span className="text-blue-600">{managementLink}</span>
                </li>
                <li>
                  <strong>Plan</strong>: {getPlanName(user.subscription.plan)}
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="whatsapp-message">Customize Welcome Message</Label>
          <Textarea
            id="whatsapp-message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your custom message here..."
            rows={8}
            className="w-full font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            The message includes auto-generated store links. You can customize
            the links if needed.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCustomMessage(
                `Welcome to Qreta! 🎉
Your online store has been created successfully.

🛍 Store Link: ${storeLink}
🧰 Management Link: ${managementLink}

You can now add products, set prices, and start sharing your store with customers.
If you need help, just reply "Help" and our team will assist you.

Welcome to the Qreta community — let's grow your business together! 🚀`,
              );
            }}
          >
            Reset to Default
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(customMessage);
              toast.success("Message copied to clipboard!");
            }}
          >
            Copy Message
          </Button>
        </div>

        <div className="mt-6">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-green-600 bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <MessageCircle size={20} />
            Send WhatsApp Welcome Message
          </a>
        </div>
      </div>
    </div>
  );
}

// DataTable Component
interface Column<T> {
  key: string;
  header: string;
  cell: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  initialPageSize?: number;
  loadMore?: () => void;
  hasMore?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  searchable?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
}

function DataTable<T>({
  data,
  columns,
  loading = false,
  initialPageSize = 10,
  loadMore,
  hasMore = false,
  onRowClick,
  emptyMessage = "No data available",
  searchable = false,
  onSearch,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchValue);

  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onSearch]);

  useEffect(() => {
    setLocalSearchQuery(searchValue);
  }, [searchValue]);

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    onSearchChange?.(query);
    setCurrentPage(1);
  };

  const filteredData = React.useMemo(() => {
    if (!debouncedSearchQuery) return data;
    const query = debouncedSearchQuery.toLowerCase();
    return data.filter((item) => {
      return JSON.stringify(item).toLowerCase().includes(query);
    });
  }, [data, debouncedSearchQuery]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * initialPageSize;
    return sortedData.slice(0, startIndex + initialPageSize);
  }, [sortedData, currentPage, initialPageSize]);

  const totalPages = Math.ceil(sortedData.length / initialPageSize);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;
    setSortConfig((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    if (hasMore && loadMore) {
      loadMore();
    } else if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const canLoadMore = hasMore || currentPage < totalPages;

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {localSearchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-900 ${column.width || ""}`}
                >
                  <button
                    onClick={() => handleSort(column.key)}
                    className={`flex items-center gap-1 w-full text-left ${
                      column.sortable
                        ? "cursor-pointer hover:text-gray-700"
                        : "cursor-default"
                    }`}
                  >
                    {column.header}
                    {column.sortable &&
                      sortConfig?.key === column.key &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm">
                    {column.cell(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && !loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {debouncedSearchQuery
                  ? "No results found for your search"
                  : emptyMessage}
              </p>
              {debouncedSearchQuery && (
                <Button
                  variant="outline"
                  onClick={() => handleSearchChange("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {(paginatedData.length > 0 || loading) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {paginatedData.length} of {sortedData.length} entries
            {sortedData.length !== data.length &&
              ` (filtered from ${data.length} total)`}
            {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && !hasMore && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {canLoadMore && (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="ml-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Your existing states
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalProducts: 0,
    activeSubscriptions: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailTab, setUserDetailTab] =
    useState<UserDetailTabType>("businesses");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planFormData, setPlanFormData] = useState<SubscriptionPlanForm>({
    name: "",
    price: 0,
    duration: 30,
    description: "",
    features: [""],
    isActive: true,
    type: "monthly",
  });

  const [isUpdateSubModalOpen, setIsUpdateSubModalOpen] = useState(false);
  const [userToUpdateSub, setUserToUpdateSub] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<string | null>(null);

  // WhatsApp Modal State
  const [whatsappData, setWhatsappData] = useState<{
    user: User | null;
    business: Business | null;
  }>({
    user: null,
    business: null,
  });

  // Lazy loading states
  const [usersPage, setUsersPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const authenticated = localStorage.getItem("admin_authenticated");
        const authTime = localStorage.getItem("admin_auth_time");

        if (authenticated === "true" && authTime) {
          const timeDiff = Date.now() - Number.parseInt(authTime);
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            setIsAuthenticated(true);
            setShowAuthModal(false);
            fetchInitialData();
          } else {
            localStorage.removeItem("admin_authenticated");
            localStorage.removeItem("admin_auth_time");
            setIsAuthenticated(false);
            setShowAuthModal(true);
          }
        } else {
          setIsAuthenticated(false);
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setShowAuthModal(true);
      }
    };

    checkAuthentication();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    fetchInitialData();
  };

  // Fetch data only after authentication
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch stats
      const statsResponse = await fetch("/api/admin/stat");
      const statsData = (await statsResponse.json()) as AdminStats;
      setStats(statsData);

      // Fetch users
      await fetchUsers(1, "");

      // Fetch subscription plans
      const plansResponse = await fetch("/api/admin/subscription");
      const plansData = (await plansResponse.json()) as SubscriptionPlan[];
      setSubscriptionPlans(
        plansData.map((plan) => ({
          ...plan,
          features: plan.features || [],
        })),
      );
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = "") => {
    try {
      if (page === 1 || search) {
        setIsSearching(true);
      }

      const response = await fetch(
        `/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let usersData: any[] = [];

      if (typeof data === "object" && data !== null) {
        if ("users" in data && Array.isArray(data.users)) {
          usersData = data.users;
        } else if ("data" in data && Array.isArray(data.data)) {
          usersData = data.data;
        } else if (Array.isArray(data)) {
          usersData = data;
        } else {
          throw new Error("Invalid API response format for users");
        }
      } else {
        throw new Error("Invalid API response format for users");
      }

      const apiUsers: User[] = usersData.map((item: ApiUser) => ({
        id: String(item.id || item._id || Math.random().toString()),
        name: String(item.name || "Unknown User"),
        email: String(item.email || "No email"),
        phone: String(item.phone || "No phone"),
        createdAt: String(item.createdAt || new Date().toISOString()),
        subscription: {
          plan: Number(item.subscription?.plan || item.plan || 0),
          status: Array.isArray(item.subscription?.status)
            ? item.subscription.status
            : Array.isArray(item.status)
              ? item.status
              : [{ status: "unknown", planId: 0, planType: "N/A" }],
          expiresAt: Array.isArray(item.subscription?.expiresAt)
            ? item.subscription.expiresAt
            : Array.isArray(item.expiresAt)
              ? item.expiresAt
              : [{ expiresAt: new Date().toISOString() }],
        },
        businessCount: Number(
          item.businessCount || item.businesses?.length || 0,
        ),
        productCount: Number(item.productCount || item.products?.length || 0),
        lastActive: String(
          item.lastActive || item.updatedAt || new Date().toISOString(),
        ),
        businesses: Array.isArray(item.businesses)
          ? item.businesses.map((biz: ApiBusiness) => ({
              id: String(biz.id || biz._id || Math.random().toString()),
              name: String(biz.name || biz.businessName || "Unknown Business"),
              type: String(biz.type || "Unknown Type"),
              status: String(biz.status || "active"),
              products: Number(biz.products || biz.productCount || 0),
              whatsapp: String(biz.whatsapp || ""),
              store: String(biz.store || ""),
              manage: String(biz.manage || ""),
              createdAt: String(biz.createdAt || new Date().toISOString()),
              owner: String(biz.owner || item.name || "Unknown Owner"),
              ownerId: String(biz.ownerId || item.id || "unknown"),
            }))
          : [],
        products: Array.isArray(item.products)
          ? item.products.map((prod: ApiProduct) => ({
              id: String(prod.id || prod._id || Math.random().toString()),
              name: String(prod.name || "Unknown Product"),
              category: String(prod.category || "Uncategorized"),
              price: Number(prod.price || 0),
              stock: Number(prod.stock || 0),
              status: String(prod.status || "active"),
              business: String(prod.business || "Unknown Business"),
              businessId: String(prod.businessId || "unknown"),
              createdAt: String(prod.createdAt || new Date().toISOString()),
              ownerId: String(prod.ownerId || item.id || "unknown"),
            }))
          : [],
      }));

      if (page === 1 || search) {
        setUsers(apiUsers);
      } else {
        setUsers((prev) => [...prev, ...apiUsers]);
      }

      setHasMoreUsers(apiUsers.length === 20);

      const allBusinesses = apiUsers.flatMap((user) => user.businesses || []);
      const allProducts = apiUsers.flatMap((user) => user.products || []);

      if (page === 1 || search) {
        setBusinesses(allBusinesses);
        setProducts(allProducts);
      } else {
        setBusinesses((prev) => [...prev, ...allBusinesses]);
        setProducts((prev) => [...prev, ...allProducts]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users data");
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreUsers = () => {
    const nextPage = usersPage + 1;
    setUsersPage(nextPage);
    fetchUsers(nextPage, searchQuery);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setUsersPage(1);
    fetchUsers(1, query);
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    setSearchQuery("");
    setUsersPage(1);
  }, [activeTab]);

  const handlePlanFormChange = (
    field: keyof SubscriptionPlanForm,
    value: any,
  ) => {
    setPlanFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddFeature = () => {
    setPlanFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    if (planFormData.features.length === 1) return;
    setPlanFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...planFormData.features];
    newFeatures[index] = value;
    setPlanFormData((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPlan(true);

    try {
      const response = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription plan");
      }

      toast.success("Subscription plan created successfully!");
      setIsPlanModalOpen(false);
      setPlanFormData({
        name: "",
        price: 0,
        duration: 30,
        description: "",
        features: [""],
        isActive: true,
        type: "monthly",
      });

      // Refresh subscription plans
      const plansResponse = await fetch("/api/admin/subscription");
      const plansData = (await plansResponse.json()) as SubscriptionPlan[];
      setSubscriptionPlans(
        plansData.map((plan) => ({
          ...plan,
          features: plan.features || [],
        })),
      );
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      toast.error("Failed to create subscription plan");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Subscription Update Functions
  const openUpdateSubModal = (user: User) => {
    setUserToUpdateSub(user);
    setIsUpdateSubModalOpen(true);
    setSelectedPlan(user.subscription.plan.toString());
    setSelectedPlanType(user.subscription.status[0]?.planType || "monthly");
  };

  const handleUpdateSubscription = async () => {
    if (!userToUpdateSub || !selectedPlan || !selectedPlanType) {
      toast.error("Please select a plan and a plan type.");
      return;
    }

    const userId = userToUpdateSub.phone;

    try {
      const response = await fetch(`/api/admin/subscription/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlanId: selectedPlan,
          newPlanType: selectedPlanType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }

      toast.success("Subscription updated successfully!");
      setIsUpdateSubModalOpen(false);
      fetchUsers(usersPage, searchQuery);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription.");
    }
  };

  // Helper functions
  const getSubscriptionBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return (
      variants[status.toLowerCase() as keyof typeof variants] ||
      variants.pending
    );
  };

  // User Detail Functions
  const handleViewUserDetails = (
    user: User,
    tab: UserDetailTabType = "businesses",
  ) => {
    setSelectedUser(user);
    setUserDetailTab(tab);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
  };

  // Column definitions
  const userColumns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      sortable: true,
      cell: (user) => (
        <div>
          <p className="font-medium text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">ID: {user.id}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      cell: (user) => user.email,
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      cell: (user) => user.phone,
    },
    {
      key: "businessCount",
      header: "Businesses",
      sortable: true,
      cell: (user) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewUserDetails(user, "businesses");
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
            {user.businessCount}
          </Badge>
        </Button>
      ),
    },
    {
      key: "productCount",
      header: "Products",
      sortable: true,
      cell: (user) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewUserDetails(user, "products");
          }}
          className="text-green-600 hover:text-green-800"
        >
          <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
            {user.productCount}
          </Badge>
        </Button>
      ),
    },
    {
      key: "subscription",
      header: "Subscription",
      sortable: false,
      cell: (user) => {
        const status = user.subscription.status[0]?.status || "unknown";
        const planId = user.subscription.status[0]?.planId || 0;
        const planType = user.subscription.status[0]?.planType || "N/A";
        const expiresAt = user.subscription.expiresAt[0]?.expiresAt;

        return (
          <div className="flex flex-col gap-1">
            <Badge className={getSubscriptionBadge(status)}>
              {getPlanName(planId)}
            </Badge>
            <span className="text-xs text-gray-500 capitalize">{status}</span>
            <span className="text-xs text-gray-500">Type: {planType}</span>
            <span className="text-xs text-gray-500">
              Expires: {formatReadableDate(expiresAt || "")}
            </span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      cell: (user) => formatReadableDate(user.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      cell: (user) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWhatsappData({ user: user, business: null })}
            className="text-green-600 hover:text-green-800 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openUpdateSubModal(user)}
          >
            <CreditCard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewUserDetails(user, "businesses")}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const businessColumns: Column<Business>[] = [
    {
      key: "name",
      header: "Business",
      sortable: true,
      cell: (business) => (
        <span className="font-medium text-gray-900">{business.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (business) => business.type,
    },
    {
      key: "owner",
      header: "Owner",
      sortable: true,
      cell: (business) => business.owner,
    },
    {
      key: "products",
      header: "Products",
      sortable: true,
      cell: (business) => <Badge variant="outline">{business.products}</Badge>,
    },
    {
      key: "whatsapp",
      header: "WhatsApp",
      sortable: true,
      cell: (business) => (
        <Badge variant="outline">{business.whatsapp || "Not set"}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (business) => (
        <Badge className={getSubscriptionBadge(business.status)}>
          {business.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (business) => formatReadableDate(business.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      cell: (business) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const businessOwner = users.find((user) =>
                user.businesses?.some((biz) => biz.id === business.id),
              );
              setWhatsappData({
                user: businessOwner || {
                  id: "unknown",
                  name: business.owner,
                  email: "Unknown",
                  phone: "Unknown",
                  createdAt: new Date().toISOString(),
                  subscription: { plan: 0, status: [], expiresAt: [] },
                  businessCount: 0,
                  productCount: 0,
                  lastActive: new Date().toISOString(),
                },
                business: business,
              });
            }}
            className="text-green-600 hover:text-green-800 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const productColumns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      cell: (product) => (
        <span className="font-medium text-gray-900">{product.name}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      cell: (product) => <Badge variant="secondary">{product.category}</Badge>,
    },
    {
      key: "business",
      header: "Business",
      sortable: true,
      cell: (product) => product.business,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (product) => `₦${product.price.toFixed(2)}`,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      cell: (product) => (
        <Badge variant={product.stock > 0 ? "outline" : "destructive"}>
          {product.stock}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (product) => (
        <Badge className={getSubscriptionBadge(product.status)}>
          {product.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (product) => formatReadableDate(product.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      cell: (product) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    trend?: number;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend !== undefined && (
              <p
                className={`text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {trend >= 0 ? "+" : ""}
                {trend}% from last month
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Checking Access
          </h2>
          <p className="text-gray-600 mt-2">Verifying your credentials...</p>
        </div>
      </div>
    );
  }

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PhoneAuthModal isOpen={showAuthModal} onSuccess={handleAuthSuccess} />
        {!showAuthModal && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Preparing authentication...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show loading state for dashboard data
  if (isLoading && users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  // User Detail View
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToUsers}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedUser.name}
          </h1>
          <p className="text-gray-600">User Details - {selectedUser.email}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Businesses</p>
              <p className="text-2xl font-bold">{selectedUser.businessCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-2xl font-bold">{selectedUser.productCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Subscription</p>
              <p className="text-lg font-bold">
                {getPlanName(selectedUser.subscription.plan)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Last Active</p>
              <p className="text-sm font-bold">
                {formatReadableDate(selectedUser.lastActive)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  id: "businesses",
                  label: "Businesses",
                  count: selectedUser.businessCount,
                },
                {
                  id: "products",
                  label: "Products",
                  count: selectedUser.productCount,
                },
                {
                  id: "subscriptions",
                  label: "Subscriptions",
                  count: selectedUser.subscription ? 1 : 0,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setUserDetailTab(tab.id as UserDetailTabType)}
                  className={`flex items-center border-b-2 px-1 py-4 text-sm font-medium ${
                    userDetailTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {userDetailTab === "subscriptions" && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUser.subscription.status.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Plan: {getPlanName(selectedUser.subscription.plan)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Status:{" "}
                      <Badge
                        className={getSubscriptionBadge(
                          selectedUser.subscription.status[0]?.status ||
                            "unknown",
                        )}
                      >
                        {selectedUser.subscription.status[0]?.status || "N/A"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Expires At:</h4>
                    <p className="text-gray-600">
                      {formatReadableDate(
                        selectedUser.subscription.expiresAt[0]?.expiresAt || "",
                      ) || "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">
                  No active subscription found for this user.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {userDetailTab === "businesses" && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedUser.name}'s Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={selectedUser.businesses || []}
                columns={businessColumns.filter((col) => col.key !== "actions")}
                emptyMessage="No businesses found for this user"
              />
            </CardContent>
          </Card>
        )}

        {userDetailTab === "products" && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedUser.name}'s Products</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={selectedUser.products || []}
                columns={productColumns.filter((col) => col.key !== "actions")}
                emptyMessage="No products found for this user"
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage users, businesses, and products
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("admin_authenticated");
              localStorage.removeItem("admin_auth_time");
              setIsAuthenticated(false);
              setShowAuthModal(true);
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={12}
        />
        <StatCard
          title="Businesses"
          value={stats.totalBusinesses}
          icon={Building2}
          trend={8}
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          trend={15}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          trend={5}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "users", label: "Users", count: stats.totalUsers },
              {
                id: "businesses",
                label: "Businesses",
                count: stats.totalBusinesses,
              },
              { id: "products", label: "Products", count: stats.totalProducts },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="mb-6 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Plan Setup
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Subscription Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitPlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-name">Plan Name *</Label>
                    <Input
                      id="plan-name"
                      value={planFormData.name}
                      onChange={(e) =>
                        handlePlanFormChange("name", e.target.value)
                      }
                      placeholder="e.g., Premium Plan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Price (₦) *</Label>
                    <CurrencyInput
                      id="plan-price"
                      decimalsLimit={2}
                      prefix="₦"
                      groupSeparator=","
                      decimalSeparator="."
                      value={planFormData.price}
                      onValueChange={(value) =>
                        handlePlanFormChange(
                          "price",
                          Number.parseFloat(value ?? "0"),
                        )
                      }
                      placeholder="0.00"
                      required
                      className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-duration">Duration *</Label>
                    <Input
                      id="plan-duration"
                      type="number"
                      min="1"
                      value={planFormData.duration}
                      onChange={(e) =>
                        handlePlanFormChange(
                          "duration",
                          Number.parseInt(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-type">Plan Type *</Label>
                    <select
                      id="plan-type"
                      value={planFormData.type}
                      onChange={(e) =>
                        handlePlanFormChange(
                          "type",
                          e.target.value as "monthly" | "quarterly" | "yearly",
                        )
                      }
                      className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-description">Description</Label>
                  <Textarea
                    id="plan-description"
                    value={planFormData.description}
                    onChange={(e) =>
                      handlePlanFormChange("description", e.target.value)
                    }
                    placeholder="Describe what this plan includes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {planFormData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) =>
                            handleFeatureChange(index, e.target.value)
                          }
                          placeholder={`Feature ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFeature(index)}
                          disabled={planFormData.features.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFeature}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="plan-active"
                    checked={planFormData.isActive}
                    onChange={(e) =>
                      handlePlanFormChange("isActive", e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="plan-active" className="!mb-0">
                    Active Plan
                  </Label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPlanModalOpen(false)}
                    disabled={isSubmittingPlan}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingPlan}>
                    {isSubmittingPlan ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div> */}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "users" && "Users Management"}
            {activeTab === "businesses" && "Businesses Management"}
            {activeTab === "products" && "Products Management"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "users" && (
            <DataTable
              data={users}
              columns={userColumns}
              loading={isLoading || isSearching}
              loadMore={loadMoreUsers}
              hasMore={hasMoreUsers}
              onRowClick={(user) => handleViewUserDetails(user, "businesses")}
              searchable={true}
              onSearch={handleSearch}
              onSearchChange={handleSearchChange}
              searchValue={searchQuery}
              searchPlaceholder="Search users..."
              emptyMessage="No users found"
            />
          )}

          {activeTab === "businesses" && (
            <DataTable
              data={businesses}
              columns={businessColumns}
              loading={isLoading}
              emptyMessage="No businesses found"
            />
          )}

          {activeTab === "products" && (
            <DataTable
              data={products}
              columns={productColumns}
              loading={isLoading}
              emptyMessage="No products found"
            />
          )}
        </CardContent>
      </Card>

      {/* Update Subscription Modal */}
      <Dialog
        open={isUpdateSubModalOpen}
        onOpenChange={setIsUpdateSubModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Subscription for {userToUpdateSub?.name}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateSubscription();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="plan-select">Select a new plan</Label>
              <select
                id="plan-select"
                value={selectedPlan ?? ""}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full rounded-md border p-2"
              >
                <option value="" disabled>
                  -- Choose a plan --
                </option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ₦{plan.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-type">Plan Type *</Label>
              <select
                id="plan-type"
                value={selectedPlanType ?? ""}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="w-full rounded-md border p-2"
                required
              >
                <option value="" disabled>
                  -- Choose a plan type --
                </option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsUpdateSubModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Subscription</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      {whatsappData.user && (
        <WhatsAppModal
          user={whatsappData.user}
          business={whatsappData.business}
          onClose={() => setWhatsappData({ user: null, business: null })}
        />
      )}
    </div>
  );
}
