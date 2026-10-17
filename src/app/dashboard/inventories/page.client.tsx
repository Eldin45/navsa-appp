// src/app/dashboard/inventory/page.client.tsx
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
  Package,
  Users,
  TrendingUp,
  Upload,
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
  Box,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  ArrowDown,
  ArrowUp,
  Warehouse,
  Truck,
  Scale,
  DollarSign,
  Hash,
  BarChart,
  PieChart as PieChartIcon,
  TrendingDown,
  ShoppingCart,
  Tag,
  Clock as ClockIcon,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Home,
  Check,
  AlertTriangle,
  ShoppingBag,
  PackageOpen,
  List,
  Grid3X3,
  CheckSquare,
  XSquare,
  Calculator,
  ArrowUpFromSquare,
  ArrowDownToSquare,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  FileChartLine,
  FileChartColumn,
  ChartColumn,
  ChartLine,
  ChartPie,
  ChartBar,
  ChartArea,
  ChartCandlestick
} from "lucide-react";

// Import components
import Navbar from "~/ui/components/header/header";
import Sidebar from "~/ui/components/sidebar/sidebar";

// Import chart components
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

// Loading component
const InventoryLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Loading inventory data...
      </p>
    </div>
  </div>
);

// Inventory item type definition
interface InventoryItem {
  item_name: string;
  itemid: number;
  entry_status: string;
  inventoryId: number;
  amount: number;
  quantity: number;
  count: number;
  current_stock?: number; // Added for tracking current stock
}

// Props interface
interface InventoryPageProps {
  user: {
    id: string;
    phone: string;
    email: string;
    dashId: number;
    name: string;
    avatar: string | null;
  };
  initialInventory: InventoryItem[];
  stats: {
    total_items: number;
    total_entries: number;
    total_amount: number;
    total_quantity: number;
  };
  farmInfo: {
    farmId: number;
    farmName: string;
  };
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    item?: string;
  };
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    "incoming": {
      label: "Incoming",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: ArrowDownToLine
    },
    "outgoing": {
      label: "Outgoing",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: ArrowUpFromLine
    },
    "pending": {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: ClockIcon
    },
    "completed": {
      label: "Completed",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: CheckCircle
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    icon: Package
  };

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
  color = "primary",
  subtitle
}: { 
  title: string; 
  value: string | number; 
  change?: string;
  trend?: "up" | "down";
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
      <div className="flex items-center justify-between">
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
        {change && (
          <div className={`text-sm font-medium ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {trend === "up" ? "+" : "-"}{change}
          </div>
        )}
      </div>
    </div>
  );
};

// Table header sorting component
interface SortConfig {
  key: keyof InventoryItem;
  direction: 'asc' | 'desc';
}

// Add Record Modal Component
const AddRecordModal = ({ 
  isOpen, 
  onClose, 
  user,
  farmId,
  farmName,
  existingItems
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: InventoryPageProps["user"];
  farmId: number;
  farmName: string;
  existingItems: InventoryItem[];
}) => {
  const [formData, setFormData] = useState({
    itemid: "",
    item_name: "",
    entry_status: "incoming",
    quantity: "",
    amount: "",
    unit: "units",
    notes: "",
    supplier: "",
    receiver: "",
    date: new Date().toISOString().split('T')[0],
    transaction_type: "purchase" // purchase, usage, transfer, etc.
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [customItem, setCustomItem] = useState("");

  // Calculate total stock for selected item
  const calculateCurrentStock = (itemId: number) => {
    const item = existingItems.find(i => i.itemid === itemId);
    if (!item) return 0;
    
    // Simple calculation: incoming - outgoing
    const incoming = existingItems
      .filter(i => i.itemid === itemId && i.entry_status === "incoming")
      .reduce((sum, i) => sum + i.quantity, 0);
    
    const outgoing = existingItems
      .filter(i => i.itemid === itemId && i.entry_status === "outgoing")
      .reduce((sum, i) => sum + i.quantity, 0);
    
    return incoming - outgoing;
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = parseInt(e.target.value);
    if (itemId === 0) {
      // Custom item
      setSelectedItem(null);
      setFormData({ ...formData, itemid: "", item_name: customItem });
    } else {
      const item = existingItems.find(i => i.itemid === itemId);
      if (item) {
        setSelectedItem(item);
        setFormData({ ...formData, itemid: itemId.toString(), item_name: item.item_name });
      }
    }
  };

  const handleCustomItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomItem(value);
    if (!selectedItem) {
      setFormData({ ...formData, item_name: value });
    }
  };

  const handleEntryStatusChange = (status: string) => {
    setFormData({ ...formData, entry_status: status });
    
    // Auto-fill receiver/supplier based on entry status
    if (status === "incoming") {
      setFormData(prev => ({ ...prev, supplier: "", receiver: "Farm Store" }));
    } else if (status === "outgoing") {
      setFormData(prev => ({ ...prev, supplier: "Farm Store", receiver: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.item_name.trim()) {
        toast.error("Please select or enter an item name");
        setIsSubmitting(false);
        return;
      }

      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        toast.error("Please enter a valid quantity");
        setIsSubmitting(false);
        return;
      }

      // For outgoing, check if we have enough stock
      if (formData.entry_status === "outgoing" && selectedItem) {
        const currentStock = calculateCurrentStock(selectedItem.itemid);
        const outgoingQuantity = parseFloat(formData.quantity);
        
        if (outgoingQuantity > currentStock) {
          toast.error(`Insufficient stock! Available: ${currentStock}, Requested: ${outgoingQuantity}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Call API to add inventory record
      const response = await fetch('/api/inventory/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashId: user.dashId,
          farmId: farmId,
          ...formData,
          itemid: formData.itemid || null, // Send null if new item
          quantity: parseFloat(formData.quantity),
          amount: formData.amount ? parseFloat(formData.amount) : 0,
          unit_price: formData.amount && formData.quantity 
            ? parseFloat(formData.amount) / parseFloat(formData.quantity)
            : 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add inventory record');
      }

      const result = await response.json();
      
      toast.success(`Record added successfully! ${formData.entry_status === "incoming" ? "Stock increased" : "Stock decreased"}`);
      onClose();
      
      // Reset form
      setFormData({
        itemid: "",
        item_name: "",
        entry_status: "incoming",
        quantity: "",
        amount: "",
        unit: "units",
        notes: "",
        supplier: "",
        receiver: "",
        date: new Date().toISOString().split('T')[0],
        transaction_type: "purchase"
      });
      setSelectedItem(null);
      setCustomItem("");
      
      // Refresh the page to show new record
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to add inventory record:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add inventory record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentStock = selectedItem ? calculateCurrentStock(selectedItem.itemid) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900">
          {/* Header */}
          <div className={`rounded-t-xl p-6 ${formData.entry_status === "incoming" ? "bg-gradient-to-r from-green-600 to-green-800" : "bg-gradient-to-r from-red-600 to-red-800"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Add Inventory Record</h2>
                <p className="text-sm text-white/90 mt-1">
                  {farmName} • {formData.entry_status === "incoming" ? "Add Stock" : "Use Stock"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-white/10"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Entry Type Toggle */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleEntryStatusChange("incoming")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium transition-all ${
                    formData.entry_status === "incoming"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Incoming Stock
                </button>
                <button
                  type="button"
                  onClick={() => handleEntryStatusChange("outgoing")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium transition-all ${
                    formData.entry_status === "outgoing"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <ArrowUpFromLine className="h-4 w-4" />
                  Outgoing Stock
                </button>
              </div>

              {/* Item Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Item *
                </label>
                <div className="space-y-3">
                  <select
                    value={selectedItem?.itemid || "0"}
                    onChange={handleItemSelect}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="0">-- Add New Item --</option>
                    {existingItems
                      .filter((item, index, self) => 
                        index === self.findIndex(i => i.itemid === item.itemid)
                      )
                      .map(item => (
                        <option key={item.itemid} value={item.itemid}>
                          {item.item_name} (ID: #{item.itemid})
                        </option>
                      ))}
                  </select>
                  
                  {(!selectedItem || selectedItem.itemid.toString() === "0") && (
                    <div>
                      <input
                        type="text"
                        required
                        value={customItem}
                        onChange={handleCustomItemChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter new item name..."
                        disabled={isSubmitting}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This will create a new inventory item
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Stock Information */}
                {selectedItem && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className={`text-lg font-bold ${currentStock > 0 ? "text-green-600" : "text-red-600"}`}>
                          {currentStock} units
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Entries</p>
                        <p className="text-lg font-bold text-blue-600">
                          {selectedItem.count}
                        </p>
                      </div>
                    </div>
                    {formData.entry_status === "outgoing" && currentStock === 0 && (
                      <p className="mt-2 text-xs text-red-600">
                        ⚠️ This item is out of stock!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter quantity"
                      disabled={isSubmitting}
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      disabled={isSubmitting}
                    >
                      <option value="units">Units</option>
                      <option value="kg">Kilograms</option>
                      <option value="liters">Liters</option>
                      <option value="bags">Bags</option>
                      <option value="boxes">Boxes</option>
                      <option value="packs">Packs</option>
                      <option value="tons">Tons</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter total amount"
                    disabled={isSubmitting}
                  />
                  {formData.amount && formData.quantity && (
                    <p className="mt-1 text-xs text-gray-500">
                      Unit price: ₦{(parseFloat(formData.amount) / parseFloat(formData.quantity)).toFixed(2)}/{formData.unit}
                    </p>
                  )}
                </div>
              </div>

              {/* Supplier/Receiver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.entry_status === "incoming" ? "Supplier *" : "From (Source)"}
                  </label>
                  <input
                    type="text"
                    required={formData.entry_status === "incoming"}
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={formData.entry_status === "incoming" ? "Enter supplier name" : "Source location"}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.entry_status === "outgoing" ? "Receiver *" : "To (Destination)"}
                  </label>
                  <input
                    type="text"
                    required={formData.entry_status === "outgoing"}
                    value={formData.receiver}
                    onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={formData.entry_status === "outgoing" ? "Enter receiver name" : "Destination"}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Date and Transaction Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transaction Type
                  </label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="purchase">Purchase</option>
                    <option value="usage">Usage/Consumption</option>
                    <option value="transfer">Transfer</option>
                    <option value="donation">Donation</option>
                    <option value="production">Production</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter any additional notes about this transaction..."
                  disabled={isSubmitting}
                />
              </div>
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
                className={`rounded-lg px-6 py-2.5 font-medium text-white ${
                  formData.entry_status === "incoming" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {formData.entry_status === "incoming" ? (
                      <>
                        <ArrowDownToLine className="h-4 w-4" />
                        Add Incoming Stock
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="h-4 w-4" />
                        Record Outgoing Stock
                      </>
                    )}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add New Item Modal (Original - kept for adding completely new items)
const AddNewItemModal = ({ 
  isOpen, 
  onClose, 
  user,
  farmId
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: InventoryPageProps["user"];
  farmId: number;
}) => {
  const [formData, setFormData] = useState({
    item_name: "",
    initial_quantity: "",
    initial_amount: "",
    category: "",
    unit: "units",
    description: "",
    minimum_stock: "",
    supplier: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to add new inventory item
      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashId: user.dashId,
          farmId: farmId,
          ...formData,
          initial_quantity: parseFloat(formData.initial_quantity),
          initial_amount: formData.initial_amount ? parseFloat(formData.initial_amount) : 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add new inventory item');
      }

      const result = await response.json();
      
      toast.success("New inventory item added successfully!");
      onClose();
      
      // Reset form
      setFormData({
        item_name: "",
        initial_quantity: "",
        initial_amount: "",
        category: "",
        unit: "units",
        description: "",
        minimum_stock: "",
        supplier: ""
      });
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Failed to add inventory item:", error);
      toast.error("Failed to add inventory item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="rounded-t-xl bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Add New Inventory Item</h2>
                <p className="text-sm text-white/90 mt-1">
                  Create a new inventory item with initial stock
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-white/10"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Item Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter item name (e.g., NPK Fertilizer, Maize Seeds)"
                  disabled={isSubmitting}
                />
              </div>

              {/* Category and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Category</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="seeds">Seeds</option>
                    <option value="feed">Animal Feed</option>
                    <option value="pesticide">Pesticides</option>
                    <option value="equipment">Equipment</option>
                    <option value="tools">Tools</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit *
                  </label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="units">Units</option>
                    <option value="kg">Kilograms</option>
                    <option value="liters">Liters</option>
                    <option value="bags">Bags</option>
                    <option value="boxes">Boxes</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              {/* Initial Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Initial Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.initial_quantity}
                    onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter initial quantity"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Initial Amount (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initial_amount}
                    onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter total amount"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Minimum Stock and Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Set low stock alert level"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primary Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter supplier name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter item description..."
                  disabled={isSubmitting}
                />
              </div>
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
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Adding...
                  </span>
                ) : (
                  "Add New Item"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function InventoryPage({ 
  user, 
  initialInventory, 
  stats,
  farmInfo,
  searchParams 
}: InventoryPageProps) {
  console.log("🟣 CLIENT DEBUG: Inventory data received:", {
    initialInventoryCount: initialInventory?.length || 0,
    initialInventory: initialInventory,
    stats: stats,
    farmInfo: farmInfo,
    searchParams: searchParams
  });
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isAddNewItemModalOpen, setIsAddNewItemModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'inventoryId', direction: 'desc' });
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Fallback test data
  const testInventory: InventoryItem[] = [
    {
      item_name: "NPK Fertilizer",
      itemid: 1,
      entry_status: "incoming",
      inventoryId: 101,
      amount: 150000,
      quantity: 100,
      count: 5,
      current_stock: 85
    },
    {
      item_name: "Maize Seeds",
      itemid: 2,
      entry_status: "incoming",
      inventoryId: 102,
      amount: 80000,
      quantity: 50,
      count: 3,
      current_stock: 35
    },
    {
      item_name: "Animal Feed",
      itemid: 3,
      entry_status: "outgoing",
      inventoryId: 103,
      amount: 45000,
      quantity: 30,
      count: 8,
      current_stock: 15
    },
    {
      item_name: "Pesticides",
      itemid: 4,
      entry_status: "incoming",
      inventoryId: 104,
      amount: 120000,
      quantity: 40,
      count: 2,
      current_stock: 40
    }
  ];
  
  // Use initialInventory if available, otherwise use test data
  const [inventory, setInventory] = useState<InventoryItem[]>(
    (initialInventory && initialInventory.length > 0) ? initialInventory : testInventory
  );
  
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");

  // Calculate additional stats from inventory data
  const totalItems = inventory.length;
  const incomingItems = inventory.filter(item => item.entry_status === "incoming").length;
  const outgoingItems = inventory.filter(item => item.entry_status === "outgoing").length;
  
  // Calculate total stock for each item
  const inventoryWithStock = inventory.map(item => {
    // Calculate current stock for each item
    const incoming = inventory
      .filter(i => i.itemid === item.itemid && i.entry_status === "incoming")
      .reduce((sum, i) => sum + i.quantity, 0);
    
    const outgoing = inventory
      .filter(i => i.itemid === item.itemid && i.entry_status === "outgoing")
      .reduce((sum, i) => sum + i.quantity, 0);
    
    return {
      ...item,
      current_stock: incoming - outgoing
    };
  });

  const totalAmount = inventory.reduce((sum, item) => sum + item.amount, 0);
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);

  // Chart data for inventory distribution
  const inventoryChartData = [
    { name: 'Incoming', value: incomingItems, color: '#10B981' },
    { name: 'Outgoing', value: outgoingItems, color: '#EF4444' },
    { name: 'Pending', value: inventory.filter(item => item.entry_status === "pending").length, color: '#F59E0B' },
    { name: 'Completed', value: inventory.filter(item => item.entry_status === "completed").length, color: '#3B82F6' }
  ];

  // Prepare data for bar chart (top items by stock)
  const topItemsData = [...inventoryWithStock]
    .filter((item, index, self) => 
      index === self.findIndex(i => i.itemid === item.itemid)
    )
    .sort((a, b) => (b.current_stock || 0) - (a.current_stock || 0))
    .slice(0, 5)
    .map(item => ({
      name: item.item_name.length > 15 ? item.item_name.substring(0, 12) + '...' : item.item_name,
      stock: item.current_stock || 0,
      value: item.amount
    }));

  // Get unique items for dropdown
  const uniqueItems = Array.from(
    new Map(inventory.map(item => [item.itemid, item])).values()
  );

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

  // Sort inventory
  const sortedInventory = [...inventoryWithStock].sort((a, b) => {
    if (sortConfig.key === 'item_name') {
      return sortConfig.direction === 'asc' 
        ? a.item_name.localeCompare(b.item_name)
        : b.item_name.localeCompare(a.item_name);
    } else if (sortConfig.key === 'quantity') {
      return sortConfig.direction === 'asc' 
        ? a.quantity - b.quantity
        : b.quantity - a.quantity;
    } else if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc' 
        ? a.amount - b.amount
        : b.amount - a.amount;
    } else if (sortConfig.key === 'count') {
      return sortConfig.direction === 'asc' 
        ? a.count - b.count
        : b.count - a.count;
    } else if (sortConfig.key === 'inventoryId') {
      return sortConfig.direction === 'asc' 
        ? a.inventoryId - b.inventoryId
        : b.inventoryId - a.inventoryId;
    }
    return 0;
  });

  // Filter inventory based on search
  const filteredInventory = sortedInventory.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.entry_status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

  const handleDeleteItem = async (id: number) => {
    if (confirm("Are you sure you want to delete this inventory item? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dashId: user.dashId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete inventory item');
        }

        setInventory(inventory.filter(item => item.inventoryId !== id));
        toast.success("Inventory item deleted successfully");
      } catch (error) {
        console.error("Failed to delete inventory item:", error);
        toast.error("Failed to delete inventory item. Please try again.");
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to delete");
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`)) {
      setInventory(inventory.filter(item => !selectedItems.includes(item.inventoryId)));
      setSelectedItems([]);
      toast.success(`${selectedItems.length} item(s) deleted successfully`);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === paginatedInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedInventory.map(item => item.inventoryId));
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleExport = () => {
    toast.success("Exporting inventory data...");
    // Create CSV data
    const csvData = [
      ['Item Name', 'Entry Status', 'Quantity', 'Amount (₦)', 'Entries Count', 'Item ID', 'Current Stock'],
      ...inventoryWithStock.map(item => [
        item.item_name,
        item.entry_status,
        item.quantity,
        item.amount,
        item.count,
        item.itemid,
        item.current_stock || 0
      ])
    ].map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Inventory data refreshed");
    }, 1000);
  };

  const handleSort = (key: keyof InventoryItem) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof InventoryItem) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const handleViewEntries = (itemId: number) => {
    router.push(`/dashboard/inventory/entries?item=${itemId}&farm=${farmInfo.farmId}`);
  };

  if (isLoading) {
    return <InventoryLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Imported Components */}
      <Navbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Add Record Modal */}
      <AddRecordModal 
        isOpen={isAddRecordModalOpen} 
        onClose={() => setIsAddRecordModalOpen(false)}
        user={user}
        farmId={farmInfo.farmId}
        farmName={farmInfo.farmName}
        existingItems={inventory}
      />

      {/* Add New Item Modal */}
      <AddNewItemModal 
        isOpen={isAddNewItemModalOpen} 
        onClose={() => setIsAddNewItemModalOpen(false)}
        user={user}
        farmId={farmInfo.farmId}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-0' : ''} lg:ml-64`}>
        <div className="p-4 md:p-6 pt-20 lg:pt-24">
          {/* Debug Info */}
          {/* <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">Debug Info:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Initial Inventory from Server: <span className="font-bold">{initialInventory?.length || 0}</span></div>
              <div>Current Inventory Displayed: <span className="font-bold">{inventory.length}</span></div>
              <div>Filtered Inventory: <span className="font-bold">{filteredInventory.length}</span></div>
              <div>Farm Name: <span className="font-bold">{farmInfo.farmName}</span></div>
            </div>
          </div> */}

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-gray-50">
                  Farm Inventory Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track and manage inventory for {farmInfo.farmName}
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
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Resources"
              value={stats.total_items}
              change="+2"
              trend="up"
              icon={Package}
              color="primary"
              subtitle="Number of unique items"
            />
            <StatsCard
              title="Total Entries"
              value={stats.total_entries}
              change="+8"
              trend="up"
              icon={Hash}
              color="info"
              subtitle="Incoming & outgoing records"
            />
            <StatsCard
              title="Total Amount"
              value={`₦${stats.total_amount.toLocaleString()}`}
              change="+12.5%"
              trend="up"
              icon={DollarSign}
              color="success"
              subtitle="Total inventory value"
            />
            <StatsCard
              title="Total Quantity"
              value={stats.total_quantity.toLocaleString()}
              change="-5"
              trend="down"
              icon={Scale}
              color="warning"
              subtitle="Total units in inventory"
            />
          </div>

          {/* Charts Section */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Inventory Distribution Chart */}
            <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Inventory Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {inventoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'items']}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Items Chart */}
            <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Top Items by Stock</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={topItemsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'stock') return [value, 'units in stock'];
                        if (name === 'value') return [`₦${Number(value).toLocaleString()}`, 'value'];
                        return [value, name];
                      }}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                    />
                    <Bar 
                      dataKey="stock" 
                      name="Stock" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mb-6 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Bulk Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === paginatedInventory.length && paginatedInventory.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete Selected ({selectedItems.length})
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
                    placeholder="Search inventory items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    title="Grid View"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
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
                <div className="relative group">
                  <button
                    onClick={() => setIsAddNewItemModalOpen(true)}
                    className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </button>
                  <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800 z-10">
                    <button 
                      onClick={() => setIsAddNewItemModalOpen(true)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <PackageOpen className="h-4 w-4" />
                      Add New Item
                    </button>
                    <button 
                      onClick={() => setIsAddRecordModalOpen(true)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Add Record
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddRecordModalOpen(true)}
                  className="flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  Add Record
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Content */}
          {viewMode === "grid" ? (
            // Grid View
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedInventory.map((item) => (
                <div key={item.inventoryId} className="rounded-xl border bg-white p-4 transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {/* Item Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">{item.item_name}</h3>
                        <StatusBadge status={item.entry_status} />
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">ID: #{item.itemid}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.count} entries</span>
                      </div>
                    </div>
                    <div className="relative group">
                      <button className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800 z-10">
                        <button 
                          onClick={() => handleViewEntries(item.itemid)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                          View Entries
                        </button>
                        <button 
                          onClick={() => {
                            toast.info("Edit feature coming soon!");
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Item
                        </button>
                        <div className="border-t dark:border-gray-700 my-1"></div>
                        <button 
                          onClick={() => handleDeleteItem(item.inventoryId)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-4">
                    {/* Stock Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Current Stock:
                        </span>
                      </div>
                      <span className={`font-bold ${(item.current_stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.current_stock || 0} units
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        This Entry: <span className="font-medium">{item.quantity} units</span>
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Amount: <span className="font-medium">₦{item.amount.toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          // Quick add incoming
                          toast.info(`Quick add for ${item.item_name} coming soon!`);
                        }}
                        className="flex-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                      >
                        + Add Stock
                      </button>
                      <button
                        onClick={() => {
                          // Quick use outgoing
                          toast.info(`Quick use for ${item.item_name} coming soon!`);
                        }}
                        className="flex-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        - Use Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View (Table)
            <div className="rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-800">
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === paginatedInventory.length && paginatedInventory.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('item_name')}
                          className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          Item Name {getSortIcon('item_name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Entry Status
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('quantity')}
                          className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          Qty {getSortIcon('quantity')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          Amount (₦) {getSortIcon('amount')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('count')}
                          className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          Entries {getSortIcon('count')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Quick Actions
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {paginatedInventory.map((item) => (
                      <tr key={item.inventoryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.inventoryId)}
                            onChange={() => handleSelectItem(item.inventoryId)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.item_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">ID: #{item.itemid}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.entry_status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-white">₦{item.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Box className={`h-4 w-4 ${(item.current_stock || 0) > 0 ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`font-medium ${(item.current_stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.current_stock || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{item.count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                // Quick add incoming
                                toast.info(`Quick add for ${item.item_name} coming soon!`);
                              }}
                              className="rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                              title="Quick Add Stock"
                            >
                              +
                            </button>
                            <button
                              onClick={() => {
                                // Quick use outgoing
                                toast.info(`Quick use for ${item.item_name} coming soon!`);
                              }}
                              className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                              title="Quick Use Stock"
                            >
                              -
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewEntries(item.itemid)}
                              className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="View Entries"
                            >
                              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => {
                                toast.info("Edit feature coming soon!");
                              }}
                              className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.inventoryId)}
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
              </div>

              {/* Empty State */}
              {paginatedInventory.length === 0 && (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    {inventory.length === 0 ? "No inventory items found" : "No matching items"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {inventory.length === 0 
                      ? "Get started by adding your first inventory item" 
                      : "Try adjusting your search"}
                  </p>
                  {inventory.length === 0 && (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setIsAddNewItemModalOpen(true)}
                        className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Item
                      </button>
                      <button
                        onClick={() => setIsAddRecordModalOpen(true)}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Add Record
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {paginatedInventory.length > 0 && (
                <div className="flex items-center justify-between border-t px-6 py-4 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredInventory.length)}</span> of{' '}
                    <span className="font-medium">{filteredInventory.length}</span> items
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
          )}
        </div>
      </main>
    </div>
  );
}