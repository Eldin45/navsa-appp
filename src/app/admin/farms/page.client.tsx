// src/app/dashboard/farms/page.client.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  Trees,
  Users,
  TrendingUp,
  Upload,
  Thermometer,
  Wind,
  Activity,
  CheckCircle,
  XCircle,
  ChevronRight,
  ArrowUpDown,
  Building2,
  Target,
  BarChart3,
  Layers,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Navigation,
  Crop,
  Package,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  ArrowDown,
  ArrowUp
} from "lucide-react";

// Import components
import Navbar from "~/ui/components/header/header";
import Sidebar from "~/ui/components/sidebar/sidebar";

// Loading component - UPDATED: Only shows spinner in content area
const FarmsLoading = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-transparent">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Loading farms data...
      </p>
    </div>
  </div>
);

// Farm type definition
interface Farm {
  id: number;
  name: string;
  owner: string;
  ownerId: number;
  location: {
    state: string;
    lga: string;
    village: string;
    coordinates: string;
  };
  type: "crop" | "livestock" | "mixed";
  crops: string[];
  livestock?: string[];
  status: "active" | "inactive" | "maintenance";
  soilType: string;
  irrigation: string;
  yield: {
    current: number;
    target: number;
    unit: string;
  };
  lastHarvest: string;
  nextActivity: string;
  createdAt: string;
  iotDevices: number;
  alerts: number;
}

// Props interface
interface FarmsPageProps {
  user: {
    id: string;
    phone: string;
    email: string;
    dashId: number;
    name: string;
    avatar: string | null;
  };
  initialFarms: Farm[];
  stats: {
    totalFarms: number;
    activeFarms: number;
    cropFarms: number;
    livestockFarms: number;
    mixedFarms: number;
    activeAlerts: number;
  };
  filters: {
    states: string[];
    statuses: string[];
  };
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    state?: string;
    type?: string;
  };
}

// Status badge component
const StatusBadge = ({ status }: { status: Farm["status"] }) => {
  const statusConfig = {
    active: {
      label: "Active",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle
    },
    inactive: {
      label: "Inactive",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      icon: XCircle
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: AlertCircle
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Type badge component
const TypeBadge = ({ type }: { type: Farm["type"] }) => {
  const typeConfig = {
    crop: {
      label: "Crop Farm",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: Crop
    },
    livestock: {
      label: "Livestock",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      icon: Trees
    },
    mixed: {
      label: "Mixed Farm",
      className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
      icon: Layers
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Stats card component
const StatsCard = ({ 
  title, 
  value, 
  change, 
  trend = "up",
  icon: Icon,
  color = "primary"
}: { 
  title: string; 
  value: string | number; 
  change?: string;
  trend?: "up" | "down";
  icon: any;
  color?: "primary" | "success" | "warning" | "info" | "danger";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`text-sm font-medium ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {trend === "up" ? "+" : "-"}{change}
          </div>
        )}
      </div>
    </div>
  );
};

// Progress bar component
const ProgressBar = ({ value, max = 100, label }: { value: number; max?: number; label?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          <span className="font-medium">{value}/{max}</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Table header sorting component
interface SortConfig {
  key: keyof Farm;
  direction: 'asc' | 'desc';
}

// Add Farm Modal Component
const AddFarmModal = ({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: FarmsPageProps["user"] }) => {
  const [formData, setFormData] = useState({
    name: "",
    ownerId: "",
    type: "crop",
    state: "",
    lga: "",
    village: "",
    soilType: "",
    irrigation: "rain-fed",
    crops: [] as string[],
    livestock: [] as string[],
    targetYield: "",
    yieldUnit: "tons",
    farmStatus: "active"
  });

  const [currentCrop, setCurrentCrop] = useState("");
  const [currentLivestock, setCurrentLivestock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to add farm
      const response = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashId: user.dashId,
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add farm');
      }

      const result = await response.json();
      
      toast.success("Farm added successfully!");
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        ownerId: "",
        type: "crop",
        state: "",
        lga: "",
        village: "",
        soilType: "",
        irrigation: "rain-fed",
        crops: [],
        livestock: [],
        targetYield: "",
        yieldUnit: "tons",
        farmStatus: "active"
      });
      
      // Refresh the page to show new farm
      window.location.reload();
    } catch (error) {
      console.error("Failed to add farm:", error);
      toast.error("Failed to add farm. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCrop = () => {
    if (currentCrop.trim() && !formData.crops.includes(currentCrop.trim())) {
      setFormData({ ...formData, crops: [...formData.crops, currentCrop.trim()] });
      setCurrentCrop("");
    }
  };

  const removeCrop = (crop: string) => {
    setFormData({ ...formData, crops: formData.crops.filter(c => c !== crop) });
  };

  const addLivestock = () => {
    if (currentLivestock.trim() && !formData.livestock.includes(currentLivestock.trim())) {
      setFormData({ ...formData, livestock: [...formData.livestock, currentLivestock.trim()] });
      setCurrentLivestock("");
    }
  };

  const removeLivestock = (animal: string) => {
    setFormData({ ...formData, livestock: formData.livestock.filter(a => a !== animal) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-xl bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Farm</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Register a new farm with complete details
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Farm Name */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter farm name"
                  disabled={isSubmitting}
                />
              </div>

              {/* Farm Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Farm Status *
                </label>
                <select
                  required
                  value={formData.farmStatus}
                  onChange={(e) => setFormData({ ...formData, farmStatus: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Farm Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Farm Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="crop">Crop Farm</option>
                  <option value="livestock">Livestock Farm</option>
                  <option value="mixed">Mixed Farm</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  State *
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="">Select State</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abia">Abia</option>
                  <option value="Kano">Kano</option>
                  <option value="Anambra">Anambra</option>
                  <option value="Kaduna">Kaduna</option>
                  <option value="Enugu">Enugu</option>
                </select>
              </div>

              {/* LGA */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Local Government Area *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lga}
                  onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter LGA"
                  disabled={isSubmitting}
                />
              </div>

              {/* Village */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Village/Town *
                </label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter village/town"
                  disabled={isSubmitting}
                />
              </div>

              {/* Soil Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Soil Type *
                </label>
                <select
                  required
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="">Select Soil Type</option>
                  <option value="Loamy Soil">Loamy Soil</option>
                  <option value="Clay Soil">Clay Soil</option>
                  <option value="Sandy Soil">Sandy Soil</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Clay Loam">Clay Loam</option>
                </select>
              </div>

              {/* Irrigation */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Irrigation System *
                </label>
                <select
                  required
                  value={formData.irrigation}
                  onChange={(e) => setFormData({ ...formData, irrigation: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="rain-fed">Rain-fed</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler System</option>
                  <option value="manual">Manual Irrigation</option>
                </select>
              </div>

              {/* Target Yield */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Yield *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.targetYield}
                    onChange={(e) => setFormData({ ...formData, targetYield: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Target yield"
                    disabled={isSubmitting}
                  />
                  <select
                    value={formData.yieldUnit}
                    onChange={(e) => setFormData({ ...formData, yieldUnit: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="tons">Tons</option>
                    <option value="kg">Kilograms</option>
                    <option value="bags">Bags</option>
                    <option value="birds">Birds</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>
              </div>

              {/* Crops (conditional) */}
              {formData.type !== "livestock" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Crops *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentCrop}
                        onChange={(e) => setCurrentCrop(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCrop())}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter crop name"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={addCrop}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.crops.map((crop, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {crop}
                          <button
                            type="button"
                            onClick={() => removeCrop(crop)}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Livestock (conditional) */}
              {formData.type !== "crop" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Livestock *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentLivestock}
                        onChange={(e) => setCurrentLivestock(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLivestock())}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter livestock type"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={addLivestock}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.livestock.map((animal, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        >
                          {animal}
                          <button
                            type="button"
                            onClick={() => removeLivestock(animal)}
                            className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Adding...
                  </div>
                ) : (
                  "Add Farm"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function FarmsPage({ 
  user, 
  initialFarms, 
  stats, 
  filters,
  searchParams 
}: FarmsPageProps) {
  console.log("🟣 CLIENT DEBUG: Farms data received:", {
    initialFarmsCount: initialFarms?.length || 0,
    initialFarms: initialFarms,
    stats: stats,
    filters: filters,
    searchParams: searchParams
  });
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFarms, setSelectedFarms] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });
  
  // Fallback test data to ensure something shows up
  const testFarms: Farm[] = [
    {
      id: 1,
      name: "Sunshine Crop Farm",
      owner: "John Adebayo",
      ownerId: 101,
      location: {
        state: "Lagos",
        lga: "Ikeja",
        village: "Opebi",
        coordinates: ""
      },
      type: "crop",
      crops: ["Maize", "Cassava", "Vegetables"],
      livestock: [],
      status: "active",
      soilType: "Loamy Soil",
      irrigation: "Rain-fed",
      yield: {
        current: 45,
        target: 60,
        unit: "tons"
      },
      lastHarvest: "2024-03-15",
      nextActivity: "2024-04-10",
      createdAt: "2024-01-10",
      iotDevices: 2,
      alerts: 1
    },
    {
      id: 2,
      name: "Green Pastures Livestock",
      owner: "Musa Ibrahim",
      ownerId: 102,
      location: {
        state: "Kano",
        lga: "Nasarawa",
        village: "Tudun Wada",
        coordinates: ""
      },
      type: "livestock",
      crops: [],
      livestock: ["Cattle", "Goats"],
      status: "active",
      soilType: "Clay Soil",
      irrigation: "Manual",
      yield: {
        current: 80,
        target: 100,
        unit: "heads"
      },
      lastHarvest: "2024-03-20",
      nextActivity: "2024-04-05",
      createdAt: "2024-02-15",
      iotDevices: 3,
      alerts: 0
    },
    {
      id: 3,
      name: "Mixed Agro Farm",
      owner: "Chinedu Okoro",
      ownerId: 103,
      location: {
        state: "Enugu",
        lga: "Nsukka",
        village: "University Town",
        coordinates: ""
      },
      type: "mixed",
      crops: ["Rice", "Yam"],
      livestock: ["Poultry", "Fish"],
      status: "active",
      soilType: "Sandy Loam",
      irrigation: "Drip",
      yield: {
        current: 60,
        target: 80,
        unit: "tons"
      },
      lastHarvest: "2024-03-10",
      nextActivity: "2024-04-15",
      createdAt: "2024-01-25",
      iotDevices: 4,
      alerts: 2
    },
    {
      id: 4,
      name: "Northern Grains Estate",
      owner: "Amina Suleiman",
      ownerId: 104,
      location: {
        state: "Kaduna",
        lga: "Zaria",
        village: "Samaru",
        coordinates: ""
      },
      type: "crop",
      crops: ["Wheat", "Maize", "Millet"],
      livestock: [],
      status: "active",
      soilType: "Sandy Loam",
      irrigation: "Sprinkler",
      yield: {
        current: 150,
        target: 180,
        unit: "tons"
      },
      lastHarvest: "2024-03-25",
      nextActivity: "2024-04-20",
      createdAt: "2023-11-15",
      iotDevices: 5,
      alerts: 0
    },
    {
      id: 5,
      name: "Southwest Poultry Farm",
      owner: "Tunde Balogun",
      ownerId: 105,
      location: {
        state: "Ogun",
        lga: "Abeokuta",
        village: "Obantoko",
        coordinates: ""
      },
      type: "livestock",
      crops: [],
      livestock: ["Poultry", "Egg Layers"],
      status: "maintenance",
      soilType: "Clay Soil",
      irrigation: "Manual",
      yield: {
        current: 5000,
        target: 8000,
        unit: "birds"
      },
      lastHarvest: "2024-03-18",
      nextActivity: "2024-04-12",
      createdAt: "2024-02-28",
      iotDevices: 3,
      alerts: 3
    },
    {
      id: 6,
      name: "Delta Fish & Crop Farm",
      owner: "Grace Okon",
      ownerId: 106,
      location: {
        state: "Delta",
        lga: "Warri",
        village: "Effurun",
        coordinates: ""
      },
      type: "mixed",
      crops: ["Cassava", "Plantain"],
      livestock: ["Fish", "Snails"],
      status: "active",
      soilType: "Clay Loam",
      irrigation: "Drip",
      yield: {
        current: 40,
        target: 65,
        unit: "tons"
      },
      lastHarvest: "2024-03-22",
      nextActivity: "2024-04-18",
      createdAt: "2024-01-05",
      iotDevices: 4,
      alerts: 1
    },
    {
      id: 7,
      name: "Jos Plateau Farm",
      owner: "James Pam",
      ownerId: 107,
      location: {
        state: "Plateau",
        lga: "Jos",
        village: "Bukuru",
        coordinates: ""
      },
      type: "crop",
      crops: ["Potatoes", "Carrots", "Cabbage"],
      livestock: [],
      status: "inactive",
      soilType: "Volcanic Soil",
      irrigation: "Rain-fed",
      yield: {
        current: 0,
        target: 100,
        unit: "tons"
      },
      lastHarvest: "2023-12-15",
      nextActivity: "2024-05-01",
      createdAt: "2023-08-20",
      iotDevices: 0,
      alerts: 0
    },
    {
      id: 8,
      name: "Benin Mixed Farm",
      owner: "Osagie Idahor",
      ownerId: 108,
      location: {
        state: "Edo",
        lga: "Benin",
        village: "Ugbowo",
        coordinates: ""
      },
      type: "mixed",
      crops: ["Yam", "Cassava", "Vegetables"],
      livestock: ["Goats", "Poultry"],
      status: "active",
      soilType: "Loamy Soil",
      irrigation: "Rain-fed",
      yield: {
        current: 70,
        target: 85,
        unit: "tons"
      },
      lastHarvest: "2024-03-28",
      nextActivity: "2024-04-25",
      createdAt: "2023-12-10",
      iotDevices: 3,
      alerts: 0
    }
  ];
  
  // Use initialFarms if available, otherwise use test data
  const [farms, setFarms] = useState<Farm[]>(
    (initialFarms && initialFarms.length > 0) ? initialFarms : testFarms
  );
  
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");

  // Calculate stats from props - use provided stats or calculate from farms
  const {
    totalFarms = farms.length,
    activeFarms = farms.filter(f => f.status === 'active').length,
    cropFarms = farms.filter(f => f.type === 'crop').length,
    livestockFarms = farms.filter(f => f.type === 'livestock').length,
    mixedFarms = farms.filter(f => f.type === 'mixed').length,
    activeAlerts = farms.reduce((sum, farm) => sum + farm.alerts, 0)
  } = stats;

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Apply search from searchParams on initial load
  useEffect(() => {
    if (searchParams.search) {
      setSearchQuery(searchParams.search);
    }
  }, [searchParams]);

  // Sort farms
  const sortedFarms = [...farms].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortConfig.key === 'createdAt') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortConfig.key === 'id') {
      return sortConfig.direction === 'asc' 
        ? a.id - b.id
        : b.id - a.id;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedFarms.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedFarms = sortedFarms.slice(startIndex, endIndex);

  // Filter farms based on search query
  const filteredFarms = paginatedFarms.filter(farm => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      farm.name.toLowerCase().includes(query) ||
      farm.owner.toLowerCase().includes(query) ||
      farm.location.state.toLowerCase().includes(query) ||
      farm.location.lga.toLowerCase().includes(query) ||
      farm.type.toLowerCase().includes(query) ||
      farm.status.toLowerCase().includes(query)
    );
  });

  const handleDeleteFarm = async (id: number) => {
    if (confirm("Are you sure you want to delete this farm? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/farms/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dashId: user.dashId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete farm');
        }

        setFarms(farms.filter(f => f.id !== id));
        toast.success("Farm deleted successfully");
      } catch (error) {
        console.error("Failed to delete farm:", error);
        toast.error("Failed to delete farm. Please try again.");
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedFarms.length === 0) {
      toast.error("Please select farms to delete");
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedFarms.length} farm(s)? This action cannot be undone.`)) {
      setFarms(farms.filter(f => !selectedFarms.includes(f.id)));
      setSelectedFarms([]);
      toast.success(`${selectedFarms.length} farm(s) deleted successfully`);
    }
  };

  const handleSelectAll = () => {
    if (selectedFarms.length === filteredFarms.length) {
      setSelectedFarms([]);
    } else {
      setSelectedFarms(filteredFarms.map(farm => farm.id));
    }
  };

  const handleSelectFarm = (id: number) => {
    if (selectedFarms.includes(id)) {
      setSelectedFarms(selectedFarms.filter(farmId => farmId !== id));
    } else {
      setSelectedFarms([...selectedFarms, id]);
    }
  };

  const handleExport = () => {
    toast.success("Exporting farms data...");
    // Create CSV data
    const csvData = [
      ['Farm ID', 'Farm Name', 'Owner', 'State', 'LGA', 'Village', 'Type', 'Status', 'Created Date'],
      ...farms.map(farm => [
        farm.id,
        farm.name,
        farm.owner,
        farm.location.state,
        farm.location.lga,
        farm.location.village,
        farm.type,
        farm.status,
        farm.createdAt
      ])
    ].map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farms_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = () => {
    toast.info("Bulk upload feature coming soon!");
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Farms data refreshed");
    }, 1000);
  };

  const handleSort = (key: keyof Farm) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Farm) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
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

      {/* Add Farm Modal */}
      <AddFarmModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        user={user}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-0' : ''} lg:ml-64`}>
        <div className="p-4 md:p-6 pt-20 lg:pt-24">
          {isLoading ? (
            <FarmsLoading />
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-gray-50">
                      Adopted Farms
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      All Adopted Farms
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <button 
                      onClick={handleRefresh}
                      className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </button>
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
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                  title="Total Farms"
                  value={totalFarms}
                  change="+5"
                  trend="up"
                  icon={Building2}
                  color="primary"
                />
                <StatsCard
                  title="Active Farms"
                  value={activeFarms}
                  change="+3"
                  trend="up"
                  icon={CheckCircle}
                  color="success"
                />
                <StatsCard
                  title="Active Alerts"
                  value={activeAlerts}
                  change="-2"
                  trend="down"
                  icon={AlertCircle}
                  color="danger"
                />
              </div>

              {/* Action Bar */}
              <div className="mb-6 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Bulk Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFarms.length === filteredFarms.length && filteredFarms.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {selectedFarms.length > 0 ? `${selectedFarms.length} selected` : 'Select all'}
                      </span>
                    </div>
                    {selectedFarms.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete Selected ({selectedFarms.length})
                      </button>
                    )}
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-1 flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search farms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Rows Per Page */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Bulk Upload
                    </button>
                    {/* <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Farm
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Farms Data Table */}
   {/* Farms Data Table */}
<div className="rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px]">
      <thead>
        <tr className="border-b dark:border-gray-800">
          <th className="px-6 py-3 text-left">
            <input
              type="checkbox"
              checked={selectedFarms.length === filteredFarms.length && filteredFarms.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </th>
          <th className="px-6 py-3 text-left">
            <button
              onClick={() => handleSort('id')}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              ID {getSortIcon('id')}
            </button>
          </th>
          <th className="px-6 py-3 text-left">
            <button
              onClick={() => handleSort('name')}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Farm Name {getSortIcon('name')}
            </button>
          </th>
          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
            Owner
          </th>
          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
            Location
          </th>
          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
            Type & Status
          </th>
          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
            Created
          </th>
          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
        {filteredFarms.map((farm) => (
          <tr key={farm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-6 py-4">
              <input
                type="checkbox"
                checked={selectedFarms.includes(farm.id)}
                onChange={() => handleSelectFarm(farm.id)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </td>
            <td className="px-6 py-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">#{farm.id}</span>
            </td>
            <td className="px-6 py-4">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{farm.name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(farm.type === "livestock" ? (farm.livestock || []) : farm.crops)?.slice(0, 2).map((item, idx) => (
                    <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 dark:text-white">{farm.owner}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {farm.ownerId}</div>
            </td>
            <td className="px-6 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{farm.location.state}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {farm.location.lga}, {farm.location.village}
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="space-y-2">
                <TypeBadge type={farm.type} />
                <StatusBadge status={farm.status} />
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(farm.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/dashboard/farms/${farm.id}`)}
                  className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="View Details"
                >
                  <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => router.push(`/dashboard/farms/${farm.id}/edit`)}
                  className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Empty State */}
    {filteredFarms.length === 0 && (
      <div className="p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No farms found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Get started by adding your first farm
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add First Farm
        </button>
      </div>
    )}
  </div>

  {/* Pagination */}
  {filteredFarms.length > 0 && (
    <div className="flex items-center justify-between border-t px-6 py-4 dark:border-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, sortedFarms.length)}</span> of{' '}
        <span className="font-medium">{sortedFarms.length}</span> farms
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-800"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
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
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`rounded-lg px-3 py-1 text-sm ${
                  currentPage === pageNum
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-1 text-gray-500">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-800"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-800"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )}
</div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}