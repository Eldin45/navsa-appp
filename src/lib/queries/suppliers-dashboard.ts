// ~/lib/queries/suppliers-dashboard.ts
import "server-only";
import { db } from "../db";

export interface SuppliersDashboard {
  // Fields from supply_comp table
  ins_id: number;
  first_name?: string;
  surname?: string;
  comp_name?: string;
  comp_email?: string;
  comp_phone?: string;
  comp_address?: string;
  approve_stat?: number; // Changed to number: 1=approved, 0=pending, 2=rejected
}

/**
 * Fetches suppliers from supply_comp table
 */
export async function getSuppliersDashboard(): Promise<SuppliersDashboard[]> {
  try {
    console.log("Querying suppliers from supply_comp table");
    
    const suppliers = await db.query<SuppliersDashboard>(
      `SELECT 
         ins_id,
         first_name,
         surname,
         comp_name,
         comp_email,
         comp_phone,
         comp_address,
         approve_stat
       FROM supply_comp
       ORDER BY ins_id DESC`
    );
    
    console.log("Query result sample:", suppliers?.[0]);
    console.log("Total records:", suppliers?.length || 0);
    return suppliers || [];
  } catch (error) {
    console.error("Failed to fetch suppliers dashboard data:", error);
    return [];
  }
}

/**
 * Get statistics for suppliers
 */
export async function getSuppliersDashboardStats(): Promise<{
  total: number;
  byApproveStat: Record<string, number>;
  recentRegistrations: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
}> {
  try {
    // Get total count and status counts using numeric values
    const totals = await db.query<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN approve_stat = 0 THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN approve_stat = 1 THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN approve_stat = 2 THEN 1 ELSE 0 END) as rejected
       FROM supply_comp`
    );

    const total = totals?.[0]?.total || 0;
    const pendingApproval = totals?.[0]?.pending || 0;
    const approved = totals?.[0]?.approved || 0;
    const rejected = totals?.[0]?.rejected || 0;

    // Get approval status distribution - convert numeric to string for display
    const approvalStats = await db.query<{
      approve_stat: number;
      count: number;
    }>(
      `SELECT 
         approve_stat,
         COUNT(*) as count
       FROM supply_comp
       WHERE approve_stat IS NOT NULL
       GROUP BY approve_stat
       ORDER BY approve_stat`
    );

    const byApproveStat: Record<string, number> = {};

    approvalStats?.forEach(stat => {
      if (stat.approve_stat !== undefined && stat.approve_stat !== null) {
        // Convert numeric status to string key
        const statusKey = String(stat.approve_stat);
        byApproveStat[statusKey] = stat.count;
      }
    });

    return {
      total,
      byApproveStat,
      recentRegistrations: 0, // Not tracking registration dates yet
      pendingApproval,
      approved,
      rejected
    };
  } catch (error) {
    console.error("Failed to fetch suppliers dashboard stats:", error);
    return {
      total: 0,
      byApproveStat: {},
      recentRegistrations: 0,
      pendingApproval: 0,
      approved: 0,
      rejected: 0
    };
  }
}

/**
 * Get suppliers data with filtering options
 */
export async function getSuppliersDashboardFiltered(filters: {
  approve_stat?: string; // String filter from UI, but we'll convert to number
  search?: string;
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<SuppliersDashboard[]> {
  try {
    const { approve_stat, search, startDate, endDate } = filters;
    const conditions: string[] = [];
    const params: any[] = [];

    // Convert string filter to numeric value for database query
    if (approve_stat) {
      let numericStatus: number | undefined;
      
      if (approve_stat === 'pending') {
        numericStatus = 0;
      } else if (approve_stat === 'approved') {
        numericStatus = 1;
      } else if (approve_stat === 'rejected') {
        numericStatus = 2;
      } else if (!isNaN(parseInt(approve_stat))) {
        numericStatus = parseInt(approve_stat);
      }
      
      if (numericStatus !== undefined) {
        conditions.push("approve_stat = ?");
        params.push(numericStatus);
      }
    }

    if (search) {
      conditions.push("(first_name LIKE ? OR surname LIKE ? OR comp_name LIKE ? OR comp_email LIKE ? OR comp_phone LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const suppliers = await db.query<SuppliersDashboard>(
      `SELECT 
         ins_id,
         first_name,
         surname,
         comp_name,
         comp_email,
         comp_phone,
         comp_address,
         approve_stat
       FROM supply_comp
       ${whereClause}
       ORDER BY ins_id DESC`,
      params
    );
    
    console.log("Filtered query result count:", suppliers?.length || 0);
    return suppliers || [];
  } catch (error) {
    console.error("Failed to fetch filtered suppliers data:", error);
    return [];
  }
}

// Test function
export async function testSuppliersQuery(): Promise<any> {
  try {
    const test = await db.query(
      `SELECT 
         ins_id,
         first_name,
         surname,
         comp_name,
         comp_email,
         comp_phone,
         comp_address,
         approve_stat,
         typeof(approve_stat) as status_type
       FROM supply_comp
       LIMIT 5`
    );
    console.log("Test query result:", test);
    return test;
  } catch (error) {
    console.error("Test query failed:", error);
    return null;
  }
}

/**
 * Update supplier approval status
 */
export async function updateSupplierApproval(
  ins_id: number, 
  approve_stat: number // Changed to number
): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE supply_comp 
       SET approve_stat = ?
       WHERE ins_id = ?`,
      [approve_stat, ins_id]
    );
    
    console.log(`Updated supplier ${ins_id} status to ${approve_stat}`);
    return true;
  } catch (error) {
    console.error("Failed to update supplier approval status:", error);
    return false;
  }
}

/**
 * Bulk update supplier approval status
 */
export async function bulkUpdateSupplierApproval(
  supplierIds: number[], 
  approve_stat: number // Changed to number
): Promise<boolean> {
  try {
    if (supplierIds.length === 0) return true;
    
    const placeholders = supplierIds.map(() => '?').join(',');
    const params = [approve_stat, ...supplierIds];
    
    const result = await db.query(
      `UPDATE supply_comp 
       SET approve_stat = ?
       WHERE ins_id IN (${placeholders})`,
      params
    );
    
    console.log(`Updated ${supplierIds.length} suppliers status to ${approve_stat}`);
    return true;
  } catch (error) {
    console.error("Failed to bulk update supplier approval status:", error);
    return false;
  }
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(ins_id: number): Promise<SuppliersDashboard | null> {
  try {
    const suppliers = await db.query<SuppliersDashboard>(
      `SELECT 
         ins_id,
         first_name,
         surname,
         comp_name,
         comp_email,
         comp_phone,
         comp_address,
         approve_stat
       FROM supply_comp
       WHERE ins_id = ?
       LIMIT 1`,
      [ins_id]
    );
    
    return suppliers?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch supplier by ID:", error);
    return null;
  }
}