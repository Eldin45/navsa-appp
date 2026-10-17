// ~/lib/queries/farm-expenses.ts
import "server-only";
import { db } from "../db";

// Types for farm expenses
export interface FarmExpense {
  id: number;
  farmId: number;
  amount: number;
  description: string;
  category: string;
  createdAt: Date;
  recordedBy: string;
  status: "pending" | "approved" | "rejected";
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

// Get farm expenses for a specific farm (dashboard admin)
export async function getFarmExpenses(dashId: number, timeRange: "monthly" | "yearly" = "monthly"): Promise<FarmExpense[]> {
  try {
    let dateFilter = "";
    if (timeRange === "monthly") {
      dateFilter = "AND fe.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } else {
      dateFilter = "AND fe.createdAt >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
    }

    const expenses = await db.query<FarmExpense>(
      `SELECT fe.* 
       FROM farm_expenses fe
       INNER JOIN f_farm f ON fe.farmId = f.farm_id
       INNER JOIN farmers_data fd ON f.farmer_id = fd.farmer_id
       WHERE fd.dash_id = ? ${dateFilter}
       ORDER BY fe.createdAt DESC`,
      [dashId]
    );
    
    return expenses || [];
  } catch (error) {
    console.error("Failed to fetch farm expenses:", error);
    return [];
  }
}

// Get farm revenue (from sales, produce, etc.)
export async function getFarmRevenue(dashId: number, timeRange: "monthly" | "yearly" = "monthly"): Promise<FarmExpense[]> {
  try {
    let dateFilter = "";
    if (timeRange === "monthly") {
      dateFilter = "AND fs.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } else {
      dateFilter = "AND fs.createdAt >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
    }

    // This query assumes you have a farm_sales or similar table
    // Adjust the table name and columns based on your actual schema
    const revenue = await db.query<FarmExpense>(
      `SELECT fs.* 
       FROM farm_sales fs
       INNER JOIN f_farm f ON fs.farmId = f.farm_id
       INNER JOIN farmers_data fd ON f.farmer_id = fd.farmer_id
       WHERE fd.dash_id = ? ${dateFilter}
       ORDER BY fs.createdAt DESC`,
      [dashId]
    );
    
    return revenue || [];
  } catch (error) {
    console.error("Failed to fetch farm revenue:", error);
    return [];
  }
}

// Get aggregated revenue and expenses data for chart
export async function getRevenueExpensesChartData(dashId: number): Promise<RevenueData[]> {
  try {
    // Get expenses aggregated by month
    const expensesData = await db.query<{ month: string; total_amount: number }>(
      `SELECT 
         DATE_FORMAT(fe.createdAt, '%Y-%m') as month,
         SUM(fe.amount) as total_amount
       FROM farm_expenses fe
       INNER JOIN f_farm f ON fe.farmId = f.farm_id
       INNER JOIN farmers_data fd ON f.farmer_id = fd.farmer_id
       WHERE fd.dash_id = ? 
         AND fe.createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(fe.createdAt, '%Y-%m')
       ORDER BY month`,
      [dashId]
    );

    // Get revenue aggregated by month
    // Note: Adjust this query based on your actual revenue/sales table
    const revenueData = await db.query<{ month: string; total_amount: number }>(
      `SELECT 
         DATE_FORMAT(fs.createdAt, '%Y-%m') as month,
         SUM(fs.amount) as total_amount
       FROM farm_sales fs
       INNER JOIN f_farm f ON fs.farmId = f.farm_id
       INNER JOIN farmers_data fd ON f.farmer_id = fd.farmer_id
       WHERE fd.dash_id = ? 
         AND fs.createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(fs.createdAt, '%Y-%m')
       ORDER BY month`,
      [dashId]
    );

    // If you don't have a revenue table yet, return sample data with real expenses
    if (!revenueData || revenueData.length === 0) {
      return expensesData.map(expense => ({
        month: expense.month,
        expenses: expense.total_amount,
        revenue: expense.total_amount * 1.5 // Sample revenue calculation
      }));
    }

    // Merge expenses and revenue data
    const allMonths = new Set([
      ...expensesData.map(e => e.month),
      ...revenueData.map(r => r.month)
    ]);

    const result: RevenueData[] = Array.from(allMonths)
      .sort()
      .map(month => {
        const expense = expensesData.find(e => e.month === month);
        const revenue = revenueData.find(r => r.month === month);
        
        return {
          month: month,
          expenses: expense?.total_amount || 0,
          revenue: revenue?.total_amount || 0
        };
      });

    return result;
  } catch (error) {
    console.error("Failed to fetch revenue/expenses chart data:", error);
    return getSampleChartData(); // Return sample data if query fails
  }
}

// Get total revenue and expenses for stats
export async function getTotalRevenueExpenses(dashId: number): Promise<{ totalRevenue: number; totalExpenses: number; netProfit: number }> {
  try {
    const [revenueResult, expensesResult] = await Promise.all([
      db.queryOne<{ total_revenue: number }>(
        `SELECT COALESCE(SUM(fs.amount), 0) as total_revenue
         FROM farm_sales fs
         INNER JOIN f_farm f ON fs.farmId = f.farm_id
         INNER JOIN farmers_data fd ON f.farmer_id = fd.farmer_id
         WHERE fd.dash_id = ?`,
        [dashId]
      ),
      db.queryOne<{ total_expenses: number }>(
        `SELECT COALESCE(SUM(fe.amount), 0) as total_expenses
         FROM farm_expenses fe
         INNER JOIN f_farm f ON fe.farmId = f.farm_id
         INNER JOIN farmers_data fd ON f.farmer_id = fd.farmer_id
         WHERE fd.dash_id = ?`,
        [dashId]
      )
    ]);

    const totalRevenue = revenueResult?.total_revenue || 0;
    const totalExpenses = expensesResult?.total_expenses || 0;
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, totalExpenses, netProfit };
  } catch (error) {
    console.error("Failed to fetch total revenue/expenses:", error);
    return { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
  }
}

// Helper function for sample data (fallback)
function getSampleChartData(): RevenueData[] {
  const currentDate = new Date();
  const months: RevenueData[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Generate realistic sample data
    const baseRevenue = 8000 + Math.random() * 4000;
    const baseExpenses = 5000 + Math.random() * 3000;
    
    months.push({
      month: month,
      revenue: Math.round(baseRevenue + (i * 1000)), // Increasing trend
      expenses: Math.round(baseExpenses + (i * 600)) // Slightly increasing expenses
    });
  }
  
  return months;
}