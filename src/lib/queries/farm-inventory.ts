// ~/lib/queries/farm-inventory.ts
import "server-only";
import { db } from "../db";

export interface FarmInventoryItem {
  item_name: string;
  itemid: number;
  entry_status: string;
  inventoryId: number;
  amount: number;
  quantity: number;
  count: number;
}

export interface FarmInventoryStats {
  total_items: number;
  total_entries: number;
  total_amount: number;
  total_quantity: number;
  recent_items: FarmInventoryItem[];
}

/**
 * Fetches recent farm inventory items for a specific farm
 * Query: SELECT item_name, itemid, entry_status, inventoryId, amount, quantity, count(entry_status) as count 
 *        FROM farm_inventory 
 *        WHERE farmId = $farmId  
 *        GROUP BY item_name 
 *        ORDER BY inventoryId DESC 
 *        LIMIT 5
 */
export async function getFarmInventoryRecent(farmId: number): Promise<FarmInventoryItem[]> {
  try {
    console.log("Querying recent farm inventory for farm:", farmId);
    
    const items = await db.query<FarmInventoryItem>(
      `SELECT 
         item_name,
         itemid,
         entry_status,
         inventoryId,
         amount,
         quantity,
         COUNT(entry_status) as count
       FROM farm_inventory 
       WHERE farmId = ?
       GROUP BY item_name 
       ORDER BY inventoryId DESC 
       LIMIT 5`,
      [farmId]
    );
    
    console.log("Recent inventory items count:", items?.length || 0);
    console.log("Sample inventory item:", items?.[0]);
    return items || [];
  } catch (error) {
    console.error("Failed to fetch farm inventory recent items:", error);
    return [];
  }
}

/**
 * Get farm inventory statistics
 * Combines all the individual queries into one function
 */
export async function getFarmInventoryStats(farmId: number, adminId: number): Promise<FarmInventoryStats> {
  try {
    console.log("Querying farm inventory stats for farm:", farmId, "admin:", adminId);
    
    // Get all stats in parallel for better performance
    const [
      recentItems,
      totalResources,
      totalEntries,
      totalAmount,
      totalQuantity
    ] = await Promise.all([
      getFarmInventoryRecent(farmId),
      
      // Query: SELECT COUNT(*) AS total_count FROM inventory_item WHERE adminId = $adminUser
      db.query<{ total_count: number }>(
        `SELECT COUNT(*) AS total_count 
         FROM inventory_item 
         WHERE adminId = ?`,
        [adminId]
      ),
      
      // Query: SELECT COUNT(*) AS total_count FROM farm_inventory WHERE farmId = $farmId
      db.query<{ total_count: number }>(
        `SELECT COUNT(*) AS total_count 
         FROM farm_inventory 
         WHERE farmId = ?`,
        [farmId]
      ),
      
      // Query: SELECT SUM(amount) AS inSum FROM farm_inventory WHERE farmId = $farmId
      db.query<{ inSum: number }>(
        `SELECT SUM(amount) AS inSum 
         FROM farm_inventory 
         WHERE farmId = ?`,
        [farmId]
      ),
      
      // Query: SELECT SUM(quantity) AS inSum FROM farm_inventory WHERE farmId = $farmId
      db.query<{ inSum: number }>(
        `SELECT SUM(quantity) AS inSum 
         FROM farm_inventory 
         WHERE farmId = ?`,
        [farmId]
      )
    ]);
    
    const all_resources = totalResources?.[0]?.total_count || 0;
    const all_resourcesEntries = totalEntries?.[0]?.total_count || 0;
    const totalInvi = totalAmount?.[0]?.inSum || 0;
    const totalInvQ = totalQuantity?.[0]?.inSum || 0;
    
    console.log("Farm inventory stats:", {
      all_resources,
      all_resourcesEntries,
      totalInvi,
      totalInvQ,
      recentItemsCount: recentItems.length
    });
    
    return {
      total_items: all_resources,
      total_entries: all_resourcesEntries,
      total_amount: totalInvi,
      total_quantity: totalInvQ,
      recent_items: recentItems
    };
  } catch (error) {
    console.error("Failed to fetch farm inventory stats:", error);
    return {
      total_items: 0,
      total_entries: 0,
      total_amount: 0,
      total_quantity: 0,
      recent_items: []
    };
  }
}

/**
 * Alternative: Get all stats in a single optimized query
 * This reduces the number of database calls
 */
export async function getFarmInventoryStatsOptimized(farmId: number, adminId: number): Promise<FarmInventoryStats> {
  try {
    console.log("Querying optimized farm inventory stats for farm:", farmId, "admin:", adminId);
    
    // Get all stats in one query
    const stats = await db.query<{
      total_items: number;
      total_entries: number;
      total_amount: number;
      total_quantity: number;
    }>(
      `SELECT 
         -- Total items for admin
         (SELECT COUNT(*) FROM inventory_item WHERE adminId = ?) as total_items,
         
         -- Total entries for farm
         (SELECT COUNT(*) FROM farm_inventory WHERE farmId = ?) as total_entries,
         
         -- Total amount for farm
         (SELECT COALESCE(SUM(amount), 0) FROM farm_inventory WHERE farmId = ?) as total_amount,
         
         -- Total quantity for farm
         (SELECT COALESCE(SUM(quantity), 0) FROM farm_inventory WHERE farmId = ?) as total_quantity`,
      [adminId, farmId, farmId, farmId]
    );
    
    // Get recent items separately (has different grouping)
    const recentItems = await getFarmInventoryRecent(farmId);
    
    const result = stats?.[0] || {
      total_items: 0,
      total_entries: 0,
      total_amount: 0,
      total_quantity: 0
    };
    
    console.log("Optimized farm inventory stats:", result);
    
    return {
      total_items: result.total_items,
      total_entries: result.total_entries,
      total_amount: result.total_amount,
      total_quantity: result.total_quantity,
      recent_items: recentItems
    };
  } catch (error) {
    console.error("Failed to fetch optimized farm inventory stats:", error);
    return {
      total_items: 0,
      total_entries: 0,
      total_amount: 0,
      total_quantity: 0,
      recent_items: []
    };
  }
}

/**
 * Get detailed farm inventory with pagination
 */
export async function getFarmInventory(
  farmId: number, 
  page: number = 1, 
  limit: number = 10
): Promise<{
  items: FarmInventoryItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const offset = (page - 1) * limit;
    
    // Get total count
    const totalResult = await db.query<{ total: number }>(
      `SELECT COUNT(DISTINCT item_name) as total 
       FROM farm_inventory 
       WHERE farmId = ?`,
      [farmId]
    );
    
    const total = totalResult?.[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated items
    const items = await db.query<FarmInventoryItem>(
      `SELECT 
         item_name,
         itemid,
         entry_status,
         inventoryId,
         amount,
         quantity,
         COUNT(entry_status) as count
       FROM farm_inventory 
       WHERE farmId = ?
       GROUP BY item_name 
       ORDER BY inventoryId DESC 
       LIMIT ? OFFSET ?`,
      [farmId, limit, offset]
    );
    
    return {
      items: items || [],
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error("Failed to fetch farm inventory:", error);
    return {
      items: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }
}

/**
 * Get inventory items by status
 */
export async function getInventoryByStatus(farmId: number, status: string): Promise<FarmInventoryItem[]> {
  try {
    const items = await db.query<FarmInventoryItem>(
      `SELECT 
         item_name,
         itemid,
         entry_status,
         inventoryId,
         amount,
         quantity,
         COUNT(entry_status) as count
       FROM farm_inventory 
       WHERE farmId = ? 
         AND entry_status = ?
       GROUP BY item_name 
       ORDER BY inventoryId DESC`,
      [farmId, status]
    );
    
    return items || [];
  } catch (error) {
    console.error(`Failed to fetch inventory items with status ${status}:`, error);
    return [];
  }
}