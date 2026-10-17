// src/app/dashboard/admin/page.client.tsx
"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Shield,
  Users,
  Phone,
  Mail,
  MapPin,
  Home,
  Briefcase,
  UserCheck,
  Target,
  X,
  Key,
  User,
  Lock,
  PauseCircle,
  PlayCircle
} from "lucide-react";

// Import components
import Navbar from "~/ui/components/header/header";
import Sidebar from "~/ui/components/sidebar/sidebar";

// Import server action
import { createAdmin } from "~/lib/actions/admin-actions";

// Admin type definition
interface Admin {
  id: number;
  dash_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  privilege: string;
  verification_pin?: string;
  status: number;
  active: number;
  registration_date: Date;
  created_at: Date;
  updated_at: Date;
  
  // Additional fields for UI compatibility
   fullname: string;
  d_firstname: string;
  d_surname: string;
  d_phone: string;
  d_email: string;
  d_status: number;
  d_state: string;
  dash_role: string;
  dash_company: string;
  created_at_dash: Date;
  updated_at_dash: Date;
  
  // Smart Farms related fields (for compatibility)
  total_farms?: number;
  poultry_farms?: number;
  crop_farms?: number;
}

interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  recentRegistrations: number;
  byPrivilege: Record<string, number>;
  byStatus: Record<string, number>;
  totalRevenue: number;
  activeAlerts: number;
}

interface UserData {
  id: string;
  phone: string;
  email: string;
  dash_id: number;
  name: string;
  avatar: string | null;
}

interface FiltersData {
  privileges: string[];
  roles: string[];
  statuses: { value: string; label: string; count?: number }[];
  years: number[];
}

// Status badge component
const StatusBadge = ({ status, active }: { status: number; active?: number }) => {
  const isActive = active !== undefined ? active : status;
  
  const statusConfig = {
    1: {
      label: "Active",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle
    },
    0: {
      label: "Inactive",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: XCircle
    }
  };

  const config = statusConfig[isActive as keyof typeof statusConfig] || statusConfig[0];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Privilege badge component
const PrivilegeBadge = ({ privilege }: { privilege: string }) => {
  const privilegeConfig: Record<string, { color: string; icon: any }> = {
    "admin": { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Shield },
    "manager": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Briefcase },
    "supervisor": { color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: UserCheck },
    "agent": { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: Users },
    "coordinator": { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Target },
    "user": { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: User },
    "default": { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: Users }
  };

  const config = privilegeConfig[privilege.toLowerCase()] || privilegeConfig.default;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {privilege.charAt(0).toUpperCase() + privilege.slice(1)}
    </span>
  );
};

// Stats card component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon,
  color = "primary",
  subtitle = ""
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  color?: "primary" | "success" | "warning" | "info" | "danger" | "purple";
  subtitle?: string;
}) => {
  const colorClasses = {
    primary: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    success: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    warning: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    info: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20",
    danger: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
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

// View Modal Component
const ViewModal = ({ 
  admin, 
  isOpen, 
  onClose 
}: { 
  admin: Admin | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  if (!admin || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Modal Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Admin Details
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Admin Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{admin.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {admin.id}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={admin.status} active={admin.active} />
                <PrivilegeBadge privilege={admin.privilege} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h4>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Full Name:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium">{admin.name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>{' '}
                  <span className="text-gray-900 dark:text-white">{admin.email}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Phone:</span>{' '}
                  <span className="text-gray-900 dark:text-white">{admin.phone || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Privilege:</span>{' '}
                  <span className="text-gray-900 dark:text-white capitalize">{admin.privilege}</span>
                </p>
              </div>
            </div>

            {/* Location Information */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Information
              </h4>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">State:</span>{' '}
                  <span className="text-gray-900 dark:text-white">{admin.state || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Address:</span>{' '}
                  <span className="text-gray-900 dark:text-white">{admin.address || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Verification Information */}
            <div className="col-span-2">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Verification Information
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Verification PIN:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-mono">{admin.verification_pin || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    admin.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.active === 1 ? 'Active User' : 'Inactive User'}
                  </span>
                </p>
              </div>
            </div>

            {/* Registration Info */}
            <div className="col-span-2">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Information
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Registration Date:</span>{' '}
                  <span className="text-gray-900 dark:text-white">
                    {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>{' '}
                  <span className="text-gray-900 dark:text-white">
                    {admin.updated_at ? new Date(admin.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 border-t pt-4 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Created: {new Date(admin.created_at).toLocaleString()}</span>
              <span>Updated: {new Date(admin.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Modal Component
const EditModal = ({ 
  admin, 
  isOpen, 
  onClose 
}: { 
  admin: Admin | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",

    privilege: "",
  
    status: 1,
    active: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        address: admin.address || "",

        privilege: admin.privilege || "user",
        status: admin.status,
        active: admin.active
      });
    }
  }, [admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Admin updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!admin || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Modal Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Admin
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Privilege</label>
                <select
                  name="privilege"
                  value={formData.privilege}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="agent">Agent</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Verification PIN</label>
                <input
                  type="text"
                  name="verification_pin"
                  value={formData.verification_pin}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Account Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">User Active Status</label>
                <select
                  name="active"
                  value={formData.active}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reset Password Modal Component
const ResetPasswordModal = ({ 
  admin, 
  isOpen, 
  onClose 
}: { 
  admin: Admin | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Password reset successfully for ${admin?.name}`);
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!admin || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reset Password
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">{admin.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Suspend Modal Component (Replaces Delete)
const SuspendModal = ({ 
  admin, 
  isOpen, 
  onClose,
  onConfirm
}: { 
  admin: Admin | null; 
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [reason, setReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);

  const handleSuspend = async () => {
    setIsSuspending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfirm();
      toast.success(`${admin?.name} has been suspended`);
    } catch (error) {
      toast.error("Failed to suspend admin");
    } finally {
      setIsSuspending(false);
    }
  };

  if (!admin || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center dark:bg-yellow-900/30">
              <PauseCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Suspend Admin Account
          </h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            Are you sure you want to suspend <span className="font-medium text-gray-900 dark:text-white">{admin.name}</span>? 
            They will no longer be able to access the system.
          </p>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason for Suspension
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for suspension..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isSuspending}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSuspend}
              disabled={isSuspending || !reason.trim()}
              className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {isSuspending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Suspending...
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4" />
                  Suspend Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin card component
const AdminCard = ({ 
  admin, 
  onView, 
  onEdit, 
  onResetPassword,
  onSuspend 
}: { 
  admin: Admin; 
  onView: (admin: Admin) => void;
  onEdit: (admin: Admin) => void;
  onResetPassword: (admin: Admin) => void;
  onSuspend: (admin: Admin) => void;
}) => {
  return (
    <div className="rounded-xl border bg-white p-4 transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{admin.fullname}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={admin.status} active={admin.active} />
            <PrivilegeBadge privilege={admin.privilege} />
          </div>
        </div>
        <div className="relative group">
          <button className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical className="h-4 w-4" />
          </button>
          <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800 z-10">
            <button 
              onClick={() => onView(admin)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <button 
              onClick={() => onEdit(admin)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
              Edit Admin
            </button>
            <button 
              onClick={() => onResetPassword(admin)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Key className="h-4 w-4" />
              Reset Password
            </button>
            <div className="border-t dark:border-gray-700 my-1"></div>
            <button 
              onClick={() => onSuspend(admin)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
            >
              <PauseCircle className="h-4 w-4" />
              Suspend Admin
            </button>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{admin.phone || "No phone"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {admin.state || "N/A"}
          </span>
        </div>
      </div>

      {/* Verification Status */}
      {admin.verification_pin && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Verification</div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                PIN: {admin.verification_pin}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Verification code</div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Date */}
      <div className="flex items-center justify-between border-t pt-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Registered: {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : "N/A"}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

// Debug View Component
const DataDebugView = ({ admins }: { admins: Admin[] }) => {
  if (!admins || admins.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
        <div className="flex items-start">
          <div className="mr-3 mt-0.5">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-red-700 dark:text-red-300">⚠️ No Admin Data Available</h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              The admin list is empty. Check the following:
            </p>
            <ul className="mt-2 ml-4 list-disc text-sm text-red-600 dark:text-red-400 space-y-1">
              <li>Check browser console for server logs</li>
              <li>Verify database has records in app_admin table</li>
              <li>Verify app_admin has records with status = 1</li>
              <li>Check the database connection</li>
            </ul>
            <div className="mt-3 p-2 bg-white rounded border">
              <code className="text-xs">
                SELECT admin_id, fullname FROM app_admin LIMIT 5;
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Add Admin Modal Component (with createAdmin integration)
const AddAdminModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    // Admin Information
    fullname: "",
    admin_email: "",
    admin_phone: "",
    verification_pin: "",
    status: "1",
    active: "1",
    
    // Password Information
    password: "",
    confirm_password: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Validate required fields
    // if (!formData.fullname || !formData.admin_email || !formData.password) {
    //   toast.error("Please fill in all required fields");
    //   return;
    // }

    setIsSubmitting(true);
    
    try {
      // Call the server action to create admin
      const result = await createAdmin({
        fullname: formData.fullname,
        email: formData.admin_email,
        phone: formData.admin_phone,
        password: formData.password
      });
      
      if (result.success) {
        toast.success("Admin account created successfully!");
        onClose();
        
        // Reset form
        setFormData({
          fullname: "",
          admin_email: "",
          admin_phone: "",
          address: "",
          state: "",
          privilege: "admin",
          verification_pin: "",
          status: "1",
          active: "1",
          password: "",
          confirm_password: ""
        });
        
        // Refresh the page to show new admin
        window.location.reload();
      } else {
        // Display validation errors
        if (result.errors) {
          if (result.errors.email) {
            toast.error(result.errors.email);
          } else if (result.errors.general) {
            toast.error(result.errors.general);
          } else {
            toast.error("Failed to create admin account. Please try again.");
          }
        }
      }
      
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error("Failed to create admin account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create New Admin Account
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add a new administrator with appropriate privileges
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
          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
            <div className="space-y-8">
              {/* Admin Information Section */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Admin Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullname"
                      required
                      value={formData.fullname}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter admin full name"
                    />
                  </div>

                  {/* Admin Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="admin_email"
                      required
                      value={formData.admin_email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Admin Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="admin_phone"
                      value={formData.admin_phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Privilege */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Privilege Level
                    </label>
                    <select
                      name="privilege"
                      value={formData.privilege}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="agent">Agent</option>
                      <option value="user">User</option>
                    </select>
                  </div>

                  {/* State */}
                 

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter address"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Account Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>

                  {/* Active */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      User Active Status
                    </label>
                    <select
                      name="active"
                      value={formData.active}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Information Section */}
           
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Admin Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface AdminPageProps {
  user: UserData;
  initialAdmins: Admin[];
  stats: AdminStats;
  filters: FiltersData;
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    privilege?: string;
    active?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

export default function AdminPage({
  user,
  initialAdmins,
  stats,
  filters,
  searchParams
}: AdminPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins || []);
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.status || "all");
  const [privilegeFilter, setPrivilegeFilter] = useState<string>(searchParams?.privilege || "all");
  const [activeFilter, setActiveFilter] = useState<string>(searchParams?.active || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Log received data
  useEffect(() => {
    console.log("=== CLIENT PAGE DEBUG ===");
    console.log("Initial admins received:", initialAdmins?.length || 0);
    console.log("First admin:", initialAdmins?.[0]);
    console.log("Stats received:", stats);
    console.log("Search params:", searchParams);
  }, [initialAdmins, stats, searchParams]);

  // Update admins when initial data changes
  useEffect(() => {
    setAdmins(initialAdmins || []);
  }, [initialAdmins]);

  // Modal handlers
  const handleViewClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleResetPasswordClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsResetPasswordModalOpen(true);
  };

  const handleSuspendClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsSuspendModalOpen(true);
  };

  const handleSuspendConfirm = () => {
    if (selectedAdmin) {
      // Update admin status to suspended (inactive)
      setAdmins(prev => prev.map(admin => 
        admin.id === selectedAdmin.id 
          ? { ...admin, active: 0, status: 0 }
          : admin
      ));
      setIsSuspendModalOpen(false);
      setSelectedAdmin(null);
    }
  };

  const closeModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsResetPasswordModalOpen(false);
    setIsSuspendModalOpen(false);
    setSelectedAdmin(null);
  };

  // Filter admins based on current filters - FIXED WITH NULL CHECK
  const filteredAdmins = (admins || []).filter(admin => {
    if (!admin) return false;
    
    const matchesSearch = 
      searchQuery === "" ||
      (admin.name && admin.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (admin.email && admin.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (admin.phone && admin.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (admin.privilege && admin.privilege.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "1" && admin.status === 1) ||
      (statusFilter === "0" && admin.status === 0);
    
    const matchesActive = activeFilter === "all" || 
      (activeFilter === "1" && admin.active === 1) ||
      (activeFilter === "0" && admin.active === 0);
    
    const matchesPrivilege = privilegeFilter === "all" || admin.privilege === privilegeFilter;
    
    return matchesSearch && matchesStatus && matchesActive && matchesPrivilege;
  });

  console.log("Filtered admins count:", filteredAdmins.length);

  // Chart data with null checks
  const statusData = [
    { name: 'Active', value: stats?.activeAdmins || 0, color: '#10B981' },
    { name: 'Inactive', value: stats?.inactiveAdmins || 0, color: '#EF4444' },
  ];

  const privilegeData = Object.entries(stats?.byPrivilege || {}).map(([privilege, count]) => ({
    name: privilege,
    value: count
  })).slice(0, 10);

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

      {/* Modals */}
      <AddAdminModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <ViewModal 
        admin={selectedAdmin}
        isOpen={isViewModalOpen}
        onClose={closeModals}
      />

      <EditModal 
        admin={selectedAdmin}
        isOpen={isEditModalOpen}
        onClose={closeModals}
      />

      <ResetPasswordModal 
        admin={selectedAdmin}
        isOpen={isResetPasswordModalOpen}
        onClose={closeModals}
      />

      <SuspendModal 
        admin={selectedAdmin}
        isOpen={isSuspendModalOpen}
        onClose={closeModals}
        onConfirm={handleSuspendConfirm}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-0' : ''} lg:ml-64`}>
        <div className="p-4 md:p-6 pt-20 lg:pt-24">
          {/* Debug View */}
          <DataDebugView admins={initialAdmins || []} />

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-gray-50 flex items-center gap-2">
                  <Shield className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  Admin Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage administrator accounts and their privileges
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Admins"
              value={stats?.totalAdmins || 0}
              icon={Users}
              color="primary"
            />
            <StatsCard
              title="Active Admins"
              value={stats?.activeAdmins || 0}
              icon={CheckCircle}
              color="success"
            />
            <StatsCard
              title="Inactive Admins"
              value={stats?.inactiveAdmins || 0}
              icon={XCircle}
              color="danger"
            />
            <StatsCard
              title="Recent Registrations"
              value={stats?.recentRegistrations || 0}
              icon={Calendar}
              color="info"
            />
          </div>

          {/* Action Bar */}
          <div className="mb-6 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search and Filters */}
              <div className="flex flex-1 flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or privilege..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    title="Grid View"
                  >
                    <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
                      <div className="rounded-sm bg-gray-600 dark:bg-gray-400"></div>
                      <div className="rounded-sm bg-gray-600 dark:bg-gray-400"></div>
                      <div className="rounded-sm bg-gray-600 dark:bg-gray-400"></div>
                      <div className="rounded-sm bg-gray-600 dark:bg-gray-400"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    title="List View"
                  >
                    <div className="h-4 w-4 space-y-1">
                      <div className="h-0.5 w-full bg-gray-600 dark:bg-gray-400"></div>
                      <div className="h-0.5 w-full bg-gray-600 dark:bg-gray-400"></div>
                      <div className="h-0.5 w-full bg-gray-600 dark:bg-gray-400"></div>
                    </div>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>

                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">All Active</option>
                    <option value="1">Active User</option>
                    <option value="0">Inactive User</option>
                  </select>

                  {filters?.privileges && filters.privileges.length > 0 && (
                    <select
                      value={privilegeFilter}
                      onChange={(e) => setPrivilegeFilter(e.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="all">All Privileges</option>
                      {filters.privileges.map(privilege => (
                        <option key={privilege} value={privilege}>{privilege}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success("Export feature coming soon")}
                  className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Admin
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAdmins.length} of {admins?.length || 0} admins
              {searchQuery && ` for "${searchQuery}"`}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {statusFilter !== 'all' && `Status: ${statusFilter === '1' ? 'Active' : 'Inactive'} • `}
              {activeFilter !== 'all' && `Active: ${activeFilter === '1' ? 'Yes' : 'No'} • `}
              {privilegeFilter !== 'all' && `Privilege: ${privilegeFilter}`}
            </div>
          </div>

          {/* Admins Content */}
          {viewMode === "grid" ? (
            // Grid View
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAdmins.map((admin) => (
                <AdminCard 
                  key={admin.id} 
                  admin={admin} 
                  onView={handleViewClick}
                  onEdit={handleEditClick}
                  onResetPassword={handleResetPasswordClick}
                  onSuspend={handleSuspendClick}
                />
              ))}
            </div>
          ) : (
            // List View
            <div className="rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-800">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Contact Info
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Privilege
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Registration Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{admin.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{admin.phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{admin.state || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <PrivilegeBadge privilege={admin.privilege} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <StatusBadge status={admin.status} active={admin.active} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {admin.verification_pin ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <Key className="mr-1 h-3 w-3" />
                              PIN: {admin.verification_pin}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">No PIN</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              }) : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewClick(admin)}
                              className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(admin)}
                              className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResetPasswordClick(admin)}
                              className="rounded-lg bg-purple-600 p-1.5 text-white hover:bg-purple-700"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredAdmins.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <Shield className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No admins found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {searchQuery ? "Try adjusting your search or filters" : "No admin accounts available"}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Admin
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View Toggle Empty State for Grid View */}
          {viewMode === "grid" && filteredAdmins.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No admins found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery ? "Try adjusting your search or filters" : "No admin accounts available"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Admin
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredAdmins.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredAdmins.length} of {admins?.length || 0} admins
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                  Previous
                </button>
                <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                  1
                </button>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                  2
                </button>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}