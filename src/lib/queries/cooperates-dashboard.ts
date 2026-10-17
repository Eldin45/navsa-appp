// ~/lib/queries/cooperates-dashboard.ts
import "server-only";
import { db } from "../db";

export interface CooperatesDashboard {
  cooperate_id: number;
  cooperate_name?: string;
  dash_id: number;
  admin_fullname?: string;
  admin_phone?: string;
  admin_email?: string;
  status?: number;
  location?: string;
  add_date?: Date;
}

/**
 * Fetches cooperates linked to active dashboard admins
 */
export async function getCooperatesDashboard(): Promise<CooperatesDashboard[]> {
  try {
    console.log("=== DATABASE QUERY DEBUG ===");
    
    // Test individual tables first
    const cooperatesCount = await db.query(
      "SELECT COUNT(*) as count FROM cooperates"
    );
    console.log("Cooperates table count:", cooperatesCount?.[0]?.count || 0);
    
    const dashboardCount = await db.query(
      "SELECT COUNT(*) as count FROM dashboard_admin WHERE status = 1"
    );
    console.log("Active dashboard_admin count:", dashboardCount?.[0]?.count || 0);
    
    // Test the exact join with debug output
    const testJoin = await db.query(
      `SELECT 
         a.cooperate_id,
         a.cooperate_name,
         b.dash_id,
         b.admin_fullname,
         b.admin_phone,
         b.admin_email,
         b.status,
         b.location,
         b.add_date,
         'JOIN_TEST' as debug
       FROM cooperates as a
       INNER JOIN dashboard_admin as b ON a.cooperate_id = b.dash_id
       WHERE b.status = 1
       ORDER BY b.add_date DESC
       LIMIT 3`
    );
    
    console.log("Join test results:", testJoin);
    console.log("Join test count:", testJoin?.length || 0);
    
    // Main query
    const cooperates = await db.query<CooperatesDashboard>(
      `SELECT 
         a.cooperate_id,
         a.cooperate_name,
         b.dash_id,
         b.admin_fullname,
         b.admin_phone,
         b.admin_email,
         b.status,
         b.location,
         b.add_date
       FROM cooperates as a
       INNER JOIN dashboard_admin as b ON a.cooperate_id = b.dash_id
       WHERE b.status = 1
       ORDER BY b.add_date DESC, b.admin_fullname ASC`
    );
    
    console.log("Main query result count:", cooperates?.length || 0);
    console.log("Sample result:", cooperates?.[0]);
    
    if (cooperates && cooperates.length > 0) {
      console.log("First record structure:");
      Object.entries(cooperates[0]).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (type: ${typeof value})`);
      });
    }
    
    return cooperates || [];
  } catch (error) {
    console.error("Failed to fetch cooperates dashboard data:", error);
    return [];
  }
}

/**
 * Get statistics for cooperates with active dashboard admins
 */
export async function getCooperatesDashboardStats(): Promise<{
  total: number;
  byState: Record<string, number>;
  byStatus: Record<string, number>;
  recentRegistrations: number;
}> {
  try {
    // Get total count and recent registrations
    const totals = await db.query<{
      total: number;
      recent: number;
    }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN b.add_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent
       FROM cooperates as a
       INNER JOIN dashboard_admin as b ON a.cooperate_id = b.dash_id
       WHERE b.status = 1`
    );

    const total = totals?.[0]?.total || 0;
    const recentRegistrations = totals?.[0]?.recent || 0;

    // Get location distribution
    const locations = await db.query<{
      location: string;
      count: number;
    }>(
      `SELECT 
         b.location,
         COUNT(*) as count
       FROM cooperates as a
       INNER JOIN dashboard_admin as b ON a.cooperate_id = b.dash_id
       WHERE b.status = 1
         AND b.location IS NOT NULL
         AND b.location != ''
       GROUP BY b.location
       ORDER BY count DESC`
    );

    // Get status distribution
    const statuses = await db.query<{
      status: number;
      count: number;
    }>(
      `SELECT 
         b.status,
         COUNT(*) as count
       FROM cooperates as a
       INNER JOIN dashboard_admin as b ON a.cooperate_id = b.dash_id
       WHERE b.status = 1
       GROUP BY b.status
       ORDER BY b.status`
    );

    const byState: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    locations?.forEach(stat => {
      if (stat.location) {
        byState[stat.location] = stat.count;
      }
    });

    statuses?.forEach(stat => {
      const statusKey = stat.status === 1 ? 'Active' : 'Inactive';
      byStatus[statusKey] = stat.count;
    });

    console.log("Stats calculated:", {
      total,
      recentRegistrations,
      byState,
      byStatus
    });

    return {
      total,
      byState,
      byStatus,
      recentRegistrations
    };
  } catch (error) {
    console.error("Failed to fetch cooperates dashboard stats:", error);
    return {
      total: 0,
      byState: {},
      byStatus: {},
      recentRegistrations: 0
    };
  }
}

/**
 * Get cooperates dashboard data with filtering options
 */
export async function getCooperatesDashboardFiltered(filters: {
  location?: string;
  role?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  status?: number;
} = {}): Promise<CooperatesDashboard[]> {
  try {
    const { location, role, startDate, endDate, search, status } = filters;
    const conditions: string[] = ["b.status = 1"];
    const params: any[] = [];

    if (location) {
      conditions.push("b.location = ?");
      params.push(location);
    }



    if (status !== undefined) {
      conditions.push("b.status = ?");
      params.push(status);
    }

    if (startDate) {
      conditions.push("b.add_date >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("b.add_date <= ?");
      params.push(endDate);
    }

    if (search) {
      conditions.push("(a.cooperate_name LIKE ? OR b.admin_fullname LIKE ? OR b.admin_email LIKE ? OR b.admin_phone LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const cooperates = await db.query<CooperatesDashboard>(
      `SELECT 
         a.cooperate_id,
         a.cooperate_name,
         b.dash_id,
         b.admin_fullname,
         b.admin_phone,
         b.admin_email,
         b.status,
         b.location,
         b.dash_role,
         b.add_date
       FROM cooperates as a
       INNER JOIN dashboard_admin as b ON a.cooperate_id = b.dash_id
       ${whereClause}
       ORDER BY b.add_date DESC`,
      params
    );
    
    console.log("Filtered query result count:", cooperates?.length || 0);
    return cooperates || [];
  } catch (error) {
    console.error("Failed to fetch filtered cooperates dashboard data:", error);
    return [];
  }
}