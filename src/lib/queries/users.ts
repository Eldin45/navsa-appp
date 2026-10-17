import "server-only";

import { db } from "../db";

/**
 * Fetches the number of businesses for a user.
 * @param userId - The ID of the user.
 * @returns The count of businesses or null if error.
 */
//farmers
interface FarmersByState {
  state: string;
  farmer_count: number;
  registration_date: string;
}

// Get ALL registered farmers by state (no admin filtering)
// Get ALL registered farmers by state (no admin filtering) - CASE INSENSITIVE
export async function getFarmersByState(): Promise<FarmersByState[]> {
  try {
    const farmersByState = await db.query<FarmersByState>(
      `SELECT 
         TRIM(UCASE(state)) as state,  -- Convert to uppercase and trim
         COUNT(*) as farmer_count,
         DATE_FORMAT(MIN(reg_date), '%Y-%m') as registration_date
       FROM farmers_data
       WHERE state IS NOT NULL 
         AND state != ''
       GROUP BY TRIM(UCASE(state))  -- Group by uppercase version
       ORDER BY farmer_count DESC`
    );
    
    // Transform to proper case for display (optional)
    const formattedData = (farmersByState || []).map(item => ({
      ...item,
      state: item.state.charAt(0).toUpperCase() + 
             item.state.slice(1).toLowerCase()
    }));
    
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch farmers by state:", error);
    return [];
  }
}

// Get ALL registered farmers count (no admin filtering)
export async function getAllFarmersCount(): Promise<number> {
  try {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM farmers_data`
      // No parameters needed - counting all farmers
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to fetch all farmers count:", error);
    return 0;
  }
}

// Get ALL farms count (no admin filtering)
export async function getAllFarmsCount(): Promise<number> {
  try {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM f_farm`
      // No parameters needed - counting all farms
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to fetch all farms count:", error);
    return 0;
  }
}

// Get ALL approved suppliers count (no admin filtering)
export async function getAllSuppliersCount(): Promise<number> {
  try {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM supply_comp WHERE approve_stat = 1`
      // No parameters needed - counting all approved suppliers
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to fetch all suppliers count:", error);
    return 0;
  }
}

// Update existing functions to remove admin filtering
export async function getNumberOfBuss(): Promise<number> {
  try {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM farmers_data`
      // Removed userId parameter and WHERE clause
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to fetch number of farmers:", error);
    return 0;
  }
}

export async function getFarmData(): Promise<number> {
  try {
    const farms = await db.queryOne<{ total_count: number }>(
      `SELECT COUNT(*) AS total_count 
       FROM f_farm`
      // Removed WHERE condition and parameters
    );
    
    return farms?.total_count || 0;
  } catch (error) {
    console.error("Failed to fetch farm data:", error);
    return 0;
  }
}

export async function getSupplyData(): Promise<number> {
  try {
    const result = await db.queryOne<{ total_count: number }>(
      `SELECT COUNT(*) AS total_count 
       FROM supply_comp 
       WHERE approve_stat = 1`
      // No parameters needed
    );
    
    return result?.total_count || 0;
  } catch (error) {
    console.error("Failed to fetch supply data:", error);
    return 0;
  }
}

/**
 * Fetches the number of orders for a user.
 * @param userId - The ID of the user.
 * @returns The count of orders or null if error.
 */
export async function getNumberOfOrder(userId: string): Promise<number | null> {
  try {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM \`order\` WHERE user_id = ?`,
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to fetch number of orders:", error);
    return null;
  }
}

/**
 * Fetches the number of active users.
 * @returns The count of active users or null if error.
 */
export async function getNumberOfActiveUsers(): Promise<number | null> {
  try {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE is_active = true`
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to fetch number of active users:", error);
    return null;
  }
}

/**
 * Fetches a user from the database by their ID.
 * @param userId - The ID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserById(userId: string) {
  try {
    const user = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string | null;
      role: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, email, name, phone, role, is_active, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    return user || null;
  } catch (error) {
    console.error("Failed to fetch user by ID:", error);
    return null;
  }
}

/**
 * Fetches a user from the database by their email.
 * @param email - The email of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string | null;
      password: string;
      role: string;
      is_active: boolean;
      created_at: Date;
    }>(
      `SELECT id, email, name, phone, password, role, is_active, created_at 
       FROM users WHERE email = ?`,
      [email]
    );
    return user || null;
  } catch (error) {
    console.error("Failed to fetch user by email:", error);
    return null;
  }
}

/**
 * Fetches all businesses for a user with pagination.
 * @param userId - The ID of the user.
 * @param page - Page number (1-indexed).
 * @param pageSize - Number of items per page.
 * @returns Array of businesses and total count.
 */
export async function getBusinessesByUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countResult = await db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM bussiness WHERE user_id = ?`,
      [userId]
    );
    
    // Get paginated businesses
    const businesses = await db.query<{
      id: number;
      name: string;
      description: string | null;
      industry: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, name, description, industry, created_at, updated_at 
       FROM bussiness 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    
    return {
      businesses: businesses || [],
      total: countResult?.total || 0,
      page,
      pageSize,
      totalPages: Math.ceil((countResult?.total || 0) / pageSize)
    };
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    return { businesses: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Fetches all customers for a user with pagination.
 * @param userId - The ID of the user.
 * @param page - Page number (1-indexed).
 * @param pageSize - Number of items per page.
 * @returns Array of customers and total count.
 */
export async function getCustomersByUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countResult = await db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM customer WHERE user_id = ?`,
      [userId]
    );
    
    // Get paginated customers
    const customers = await db.query<{
      id: number;
      name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      created_at: Date;
    }>(
      `SELECT id, name, email, phone, address, created_at 
       FROM customer 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    
    return {
      customers: customers || [],
      total: countResult?.total || 0,
      page,
      pageSize,
      totalPages: Math.ceil((countResult?.total || 0) / pageSize)
    };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return { customers: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Fetches all orders for a user with pagination.
 * @param userId - The ID of the user.
 * @param page - Page number (1-indexed).
 * @param pageSize - Number of items per page.
 * @returns Array of orders and total count.
 */
export async function getOrdersByUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countResult = await db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM \`order\` WHERE user_id = ?`,
      [userId]
    );
    
    // Get paginated orders
    const orders = await db.query<{
      id: number;
      order_number: string;
      customer_id: number;
      total_amount: number;
      status: string;
      created_at: Date;
      customer_name?: string;
    }>(
      `SELECT o.id, o.order_number, o.customer_id, o.total_amount, 
              o.status, o.created_at, c.name as customer_name
       FROM \`order\` o
       LEFT JOIN customer c ON o.customer_id = c.id
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    
    return {
      orders: orders || [],
      total: countResult?.total || 0,
      page,
      pageSize,
      totalPages: Math.ceil((countResult?.total || 0) / pageSize)
    };
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return { orders: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Creates a new business for a user.
 * @param userId - The ID of the user.
 * @param businessData - Business data to create.
 * @returns The created business ID or null if error.
 */
export async function createBusiness(
  userId: string,
  businessData: {
    name: string;
    description?: string;
    industry: string;
  }
) {
  try {
    const insertId = await db.insert(
      `INSERT INTO bussiness (user_id, name, description, industry, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        businessData.name,
        businessData.description || null,
        businessData.industry
      ]
    );
    
    return insertId;
  } catch (error) {
    console.error("Failed to create business:", error);
    return null;
  }
}

/**
 * Updates a business.
 * @param businessId - The ID of the business to update.
 * @param updateData - Data to update.
 * @returns Number of affected rows or null if error.
 */
export async function updateBusiness(
  businessId: number,
  updateData: {
    name?: string;
    description?: string;
    industry?: string;
  }
) {
  try {
    const updates = [];
    const params = [];
    
    if (updateData.name !== undefined) {
      updates.push('name = ?');
      params.push(updateData.name);
    }
    
    if (updateData.description !== undefined) {
      updates.push('description = ?');
      params.push(updateData.description);
    }
    
    if (updateData.industry !== undefined) {
      updates.push('industry = ?');
      params.push(updateData.industry);
    }
    
    if (updates.length === 0) {
      return 0;
    }
    
    updates.push('updated_at = NOW()');
    params.push(businessId);
    
    const affectedRows = await db.update(
      `UPDATE bussiness SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    return affectedRows;
  } catch (error) {
    console.error("Failed to update business:", error);
    return null;
  }
}

/**
 * Deletes a business.
 * @param businessId - The ID of the business to delete.
 * @returns Number of affected rows or null if error.
 */
export async function deleteBusiness(businessId: number) {
  try {
    const affectedRows = await db.delete(
      'DELETE FROM bussiness WHERE id = ?',
      [businessId]
    );
    
    return affectedRows;
  } catch (error) {
    console.error("Failed to delete business:", error);
    return null;
  }
}

/**
 * Gets dashboard statistics for a user.
 * @param userId - The ID of the user.
 * @returns Dashboard statistics or null if error.
 */
export async function getDashboardStats(userId: string) {
  try {
    // Get counts in parallel
    const [businessCount, customerCount, orderCount, recentOrders] = await Promise.all([
      getNumberOfBuss(userId),
      getNumberOfCus(userId),
      getNumberOfOrder(userId),
      db.query<{
        id: number;
        order_number: string;
        customer_name: string;
        total_amount: number;
        status: string;
        created_at: Date;
      }>(
        `SELECT o.id, o.order_number, c.name as customer_name, 
                o.total_amount, o.status, o.created_at
         FROM \`order\` o
         LEFT JOIN customer c ON o.customer_id = c.id
         WHERE o.user_id = ? 
         ORDER BY o.created_at DESC 
         LIMIT 5`,
        [userId]
      )
    ]);
    
    // Get total revenue
    const revenueResult = await db.queryOne<{ total_revenue: number }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue 
       FROM \`order\` 
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    
    return {
      businessCount: businessCount || 0,
      customerCount: customerCount || 0,
      orderCount: orderCount || 0,
      totalRevenue: revenueResult?.total_revenue || 0,
      recentOrders: recentOrders || []
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
}

/**
 * Searches across user data.
 * @param userId - The ID of the user.
 * @param searchTerm - The search term.
 * @returns Search results.
 */
export async function searchUserData(userId: string, searchTerm: string) {
  try {
    const searchPattern = `%${searchTerm}%`;
    
    const [businesses, customers, orders] = await Promise.all([
      db.query<{
        id: number;
        name: string;
        type: string;
        created_at: Date;
      }>(
        `SELECT id, name, 'business' as type, created_at 
         FROM bussiness 
         WHERE user_id = ? AND name LIKE ? 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId, searchPattern]
      ),
      db.query<{
        id: number;
        name: string;
        type: string;
        created_at: Date;
      }>(
        `SELECT id, name, 'customer' as type, created_at 
         FROM customer 
         WHERE user_id = ? AND name LIKE ? 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId, searchPattern]
      ),
      db.query<{
        id: number;
        order_number: string;
        type: string;
        customer_name: string;
        created_at: Date;
      }>(
        `SELECT o.id, o.order_number, 'order' as type, c.name as customer_name, o.created_at
         FROM \`order\` o
         LEFT JOIN customer c ON o.customer_id = c.id
         WHERE o.user_id = ? AND (o.order_number LIKE ? OR c.name LIKE ?)
         ORDER BY o.created_at DESC 
         LIMIT 5`,
        [userId, searchPattern, searchPattern]
      )
    ]);
    
    return {
      businesses: businesses || [],
      customers: customers || [],
      orders: orders || []
    };
  } catch (error) {
    console.error("Failed to search data:", error);
    return { businesses: [], customers: [], orders: [] };
  }
}

// ADD THIS NEW FUNCTION HERE - Admin user creation with email validation
export async function createAdmin(adminData: {
  fullname: string;
  email: string;
  phone: string;
  password: string;
}) {
  const errors: Record<string, string> = {};
  const { fullname, email, phone, password } = adminData;

  try {
    // Check if email already exists
    const existingAdmin = await db.queryOne<{ admin_id: number }>(
      `SELECT admin_id FROM app_admin WHERE admin_email = ? LIMIT 1`,
      [email]
    );

    if (existingAdmin) {
      errors['email'] = "Email already exists";
      return {
        success: false,
        errors,
        adminId: null
      };
    }

    // If no errors, proceed with insertion
    if (Object.keys(errors).length === 0) {
      const insertId = await db.insert(
        `INSERT INTO app_admin (fullname, admin_email, admin_phone, password) 
         VALUES (?, ?, ?, ?)`,
        [fullname, email, phone, password]
      );

      return {
        success: true,
        errors: null,
        adminId: insertId
      };
    }

    return {
      success: false,
      errors,
      adminId: null
    };

  } catch (error) {
    console.error("Failed to create admin:", error);
    return {
      success: false,
      errors: { general: "Failed to create admin user" },
      adminId: null
    };
  }
}