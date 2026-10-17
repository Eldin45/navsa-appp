// ~/lib/queries/cooperates-dashboard.ts
import "server-only";
import { db } from "../db";

export interface CooperatesDashboard {
  admin_id: number;
  fullname?: string;
  admin_email?: string;
  admin_phone?: string;
  privilege?: string;
  status?: number;
  active?: number;
  verification_pin?: string;
  password?: string;
  // Additional fields for UI compatibility
  cooperate_name?: string;
  location?: string;
  dash_role?: string;
  registration_date?: Date;
}

/**
 * Fetches cooperates (app_admin users) with active status
 */
export async function getCooperatesDashboard(): Promise<CooperatesDashboard[]> {
  try {
    console.log("=== DATABASE QUERY DEBUG ===");
    
    // Test table first
    const adminCount = await db.query(
      "SELECT COUNT(*) as count FROM app_admin"
    );
    console.log("app_admin table count:", adminCount?.[0]?.count || 0);
    
    const activeCount = await db.query(
      "SELECT COUNT(*) as count FROM app_admin WHERE status = 1"
    );
    console.log("Active app_admin count:", activeCount?.[0]?.count || 0);
    
    // Test the exact query with debug output
    const testQuery = await db.query(
      `SELECT 
         admin_id,
         fullname,
         admin_email,
         admin_phone,
         privilege,
         status,
         active,
         verification_pin,
         password,
         'DEBUG_ROW' as debug
       FROM app_admin
       WHERE status = 1
       ORDER BY admin_id DESC
       LIMIT 3`
    );
    
    console.log("Test query results:", testQuery);
    console.log("Test query count:", testQuery?.length || 0);
    
    // Main query - using only app_admin table
    const cooperates = await db.query<CooperatesDashboard>(
      `SELECT 
         admin_id,
         fullname,
         admin_email,
         admin_phone,
         privilege,
         status,
         active,
         verification_pin,
         password
       FROM app_admin
       WHERE status = 1
       ORDER BY admin_id DESC, fullname ASC`
    );
    
    console.log("Main query result count:", cooperates?.length || 0);
    console.log("Sample result:", cooperates?.[0]);
    
    if (cooperates && cooperates.length > 0) {
      console.log("First record structure:");
      Object.entries(cooperates[0]).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (type: ${typeof value})`);
      });
    }
    
    // Map to expected interface format
    const mappedCooperates = (cooperates || []).map(admin => ({
      ...admin,
      cooperate_name: admin.fullname, // Map fullname to cooperate_name for UI compatibility
      location: admin.privilege, // Map privilege to location for UI compatibility
      dash_role: admin.privilege, // Use privilege as role
      registration_date: new Date() // Default date since not in table
    }));
    
    return mappedCooperates;
  } catch (error) {
    console.error("Failed to fetch app_admin data:", error);
    return [];
  }
}

/**
 * Get statistics for app_admin users with active status
 */
export async function getCooperatesDashboardStats(): Promise<{
  total: number;
  byState: Record<string, number>;
  byStatus: Record<string, number>;
  recentRegistrations: number;
  byPrivilege: Record<string, number>;
  activeAdmins: number;
  inactiveAdmins: number;
}> {
  try {
    // Get total count and recent registrations
    const totals = await db.query<{
      total: number;
      active: number;
      inactive: number;
    }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive
       FROM app_admin`
    );

    const total = totals?.[0]?.total || 0;
    const activeAdmins = totals?.[0]?.active || 0;
    const inactiveAdmins = totals?.[0]?.inactive || 0;
    const recentRegistrations = 0; // Not tracked in table

    // Get privilege distribution
    const privileges = await db.query<{
      privilege: string;
      count: number;
    }>(
      `SELECT 
         privilege,
         COUNT(*) as count
       FROM app_admin
       WHERE privilege IS NOT NULL
         AND privilege != ''
       GROUP BY privilege
       ORDER BY count DESC`
    );

    // Get status distribution
    const statuses = await db.query<{
      status: number;
      count: number;
    }>(
      `SELECT 
         status,
         COUNT(*) as count
       FROM app_admin
       GROUP BY status
       ORDER BY status`
    );

    const byPrivilege: Record<string, number> = {};
    const byState: Record<string, number> = {}; // For UI compatibility
    const byStatus: Record<string, number> = {};

    privileges?.forEach(stat => {
      if (stat.privilege) {
        byPrivilege[stat.privilege] = stat.count;
        byState[stat.privilege] = stat.count; // Map privilege to state for UI
      }
    });

    statuses?.forEach(stat => {
      const statusKey = stat.status === 1 ? 'Active' : 'Inactive';
      byStatus[statusKey] = stat.count;
    });

    console.log("Stats calculated:", {
      total,
      activeAdmins,
      inactiveAdmins,
      recentRegistrations,
      byPrivilege,
      byState,
      byStatus
    });

    return {
      total,
      byState,
      byStatus,
      recentRegistrations,
      byPrivilege,
      activeAdmins,
      inactiveAdmins
    };
  } catch (error) {
    console.error("Failed to fetch app_admin stats:", error);
    return {
      total: 0,
      byState: {},
      byStatus: {},
      recentRegistrations: 0,
      byPrivilege: {},
      activeAdmins: 0,
      inactiveAdmins: 0
    };
  }
}

/**
 * Get app_admin data with filtering options
 */
export async function getCooperatesDashboardFiltered(filters: {
  privilege?: string;
  status?: number;
  active?: number;
  search?: string;
} = {}): Promise<CooperatesDashboard[]> {
  try {
    const { privilege, status, active, search } = filters;
    const conditions: string[] = [];
    const params: any[] = [];

    if (privilege) {
      conditions.push("privilege = ?");
      params.push(privilege);
    }

    if (status !== undefined) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (active !== undefined) {
      conditions.push("active = ?");
      params.push(active);
    }

    if (search) {
      conditions.push("(fullname LIKE ? OR admin_email LIKE ? OR admin_phone LIKE ? OR privilege LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const admins = await db.query<CooperatesDashboard>(
      `SELECT 
         admin_id,
         fullname,
         admin_email,
         admin_phone,
         privilege,
         status,
         active,
         verification_pin,
         password
       FROM app_admin
       ${whereClause}
       ORDER BY admin_id DESC`,
      params
    );
    
    console.log("Filtered query result count:", admins?.length || 0);
    
    // Map to expected interface format
    const mappedAdmins = (admins || []).map(admin => ({
      ...admin,
      cooperate_name: admin.fullname, // Map fullname to cooperate_name
      location: admin.privilege, // Map privilege to location
      dash_role: admin.privilege, // Use privilege as role
      registration_date: new Date() // Default date
    }));
    
    return mappedAdmins;
  } catch (error) {
    console.error("Failed to fetch filtered app_admin data:", error);
    return [];
  }
}

/**
 * Get distinct values for filter dropdowns
 */
export async function getFilterOptions(): Promise<{
  privileges: string[];
  statuses: { value: string; label: string }[];
}> {
  try {
    // Get distinct privileges
    const privilegesResult = await db.query<{ privilege: string }>(
      `SELECT DISTINCT privilege 
       FROM app_admin 
       WHERE privilege IS NOT NULL 
         AND privilege != '' 
       ORDER BY privilege`
    );
    
    const privileges = privilegesResult?.map(p => p.privilege) || [];
    
    // Get status options
    const statuses = [
      { value: '1', label: 'Active' },
      { value: '0', label: 'Inactive' }
    ];
    
    return {
      privileges,
      statuses
    };
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
    return {
      privileges: [],
      statuses: []
    };
  }
}

/**
 * Get single admin by ID
 */
export async function getAdminById(adminId: number): Promise<CooperatesDashboard | null> {
  try {
    const admin = await db.query<CooperatesDashboard>(
      `SELECT 
         admin_id,
         fullname,
         admin_email,
         admin_phone,
         privilege,
         status,
         active,
         verification_pin,
         password
       FROM app_admin
       WHERE admin_id = ?
       LIMIT 1`,
      [adminId]
    );
    
    if (admin && admin.length > 0) {
      const adminData = admin[0];
      return {
        ...adminData,
        cooperate_name: adminData.fullname,
        location: adminData.privilege,
        dash_role: adminData.privilege,
        registration_date: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch admin by ID:", error);
    return null;
  }
}

/**
 * Update admin status
 */
export async function updateAdminStatus(adminId: number, status: number): Promise<boolean> {
  try {
    const result = await db.execute(
      `UPDATE app_admin 
       SET status = ?, 
           active = ?
       WHERE admin_id = ?`,
      [status, status, adminId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Failed to update admin status:", error);
    return false;
  }
}

/**
 * Create new admin
 */
export async function createAdmin(data: {
  fullname: string;
  admin_email: string;
  admin_phone?: string;
  privilege: string;
  password: string;
  status?: number;
  active?: number;
  verification_pin?: string;
}): Promise<number | null> {
  try {
    const result = await db.execute(
      `INSERT INTO app_admin 
       (fullname, admin_email, admin_phone, privilege, password, status, active, verification_pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.fullname,
        data.admin_email,
        data.admin_phone || null,
        data.privilege,
        data.password,
        data.status || 1,
        data.active || 1,
        data.verification_pin || null
      ]
    );
    
    return result.insertId || null;
  } catch (error) {
    console.error("Failed to create admin:", error);
    return null;
  }
}