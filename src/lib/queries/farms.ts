import "server-only";
import { db } from "../db";

export interface Farm {
  // Fields from f_farm table
  farm_id: number;
  farmer_id: number;
  farm_name: string;
  farm_location?: string;
  farm_area?: number;
  crop_type?: string;
  livestock_type?: string;
  farm_status?: string;
  
  // Fields from farmers_data table (joined)
  dash_id: number;
  f_surname: string;
  first_name: string;
  f_email?: string;
  f_phone?: string;
  gender?: string;
  reg_date?: Date;
  state?: string;
  lga?: string;
  enterprise_name?: string;
  state_batch?: string;
  adopted?: number;
  f_loc?: string;
  
  // Computed fields
  owner_name?: string;
  farm_type?: "crop" | "livestock" | "mixed";
}

/**
 * Fetches all farms for a dashboard admin with farmer details
 */
export async function getFarms(dashId: number): Promise<Farm[]> {
  try {
    console.log("Querying farms for dash_id:", dashId);
    
    const farms = await db.query<Farm>(
      `SELECT 
         f.farm_id,
         f.farmer_id,
         f.farm_name,
         f.farm_loc,
         f.land_size,
         f.livestock_type,
         fd.dash_id,
         fd.f_surname,
         fd.first_name,
         fd.f_email,
         fd.f_phone,
         fd.gender,
         fd.reg_date,
         fd.state,
         fd.enterprise,
         fd.state_batch,
         fd.adopted,
         CONCAT(fd.f_surname, ' ', fd.first_name) as owner_name,
         CASE 
           WHEN f.livestock_type IS NOT NULL THEN 'livestock'
           ELSE NULL
         END as farm_type
       FROM f_farm as f
       INNER JOIN farmers_data as fd ON f.farmer_id = fd.farmer_id
       WHERE fd.verified = 1
       ORDER BY f.farm_id DESC`,
      [dashId]
    );
    
    console.log("Query result count:", farms?.length || 0);
    return farms || [];
  } catch (error) {
    console.error("Failed to fetch farms:", error);
    return [];
  }
}

/**
 * Get farms with search and filtering
 */
export async function getFarmsWithFilters(
  dashId: number,
  filters?: {
    search?: string;
    state?: string;
    farm_status?: string;
    farm_type?: string;
  }
): Promise<Farm[]> {
  try {
    let query = `
      SELECT 
        f.farm_id,
        f.farmer_id,
        f.farm_name,
        f.farm_loc,
        f.land_size,
        f.livestock_type,
        fd.dash_id,
        fd.f_surname,
        fd.first_name,
        fd.f_email,
        fd.f_phone,
        fd.gender,
        fd.reg_date,
        fd.state,
        fd.enterprise,
        fd.state_batch,
        fd.adopted,
        CONCAT(fd.f_surname, ' ', fd.first_name) as owner_name,
        CASE 
          WHEN f.livestock_type IS NOT NULL THEN 'livestock'
          ELSE NULL
        END as farm_type
      FROM f_farm as f
      INNER JOIN farmers_data as fd ON f.farmer_id = fd.farmer_id
      WHERE fd.verified = 1
    `;
    
    const params: any[] = [dashId];
    
    if (filters?.search) {
      query += ` AND (
        f.farm_name LIKE ? OR 
        fd.f_surname LIKE ? OR 
        fd.first_name LIKE ? OR 
        f.farm_loc LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (filters?.state) {
      query += ` AND fd.state = ?`;
      params.push(filters.state);
    }
    
    if (filters?.farm_status) {
      query += ` AND f.farm_status = ?`;
      params.push(filters.farm_status);
    }
    
    if (filters?.farm_type) {
      if (filters.farm_type === 'livestock') {
        query += ` AND f.livestock_type IS NOT NULL`;
      } else if (filters.farm_type === 'crop' || filters.farm_type === 'mixed') {
        query += ` AND 1=0`; // Always false since crop_type is removed
      }
    }
    
    query += ` ORDER BY f.farm_id DESC`;
    
    const farms = await db.query<Farm>(query, params);
    return farms || [];
  } catch (error) {
    console.error("Failed to fetch farms with filters:", error);
    return [];
  }
}

/**
 * Get farm by ID with full details
 */
export async function getFarmById(farmId: number, dashId: number): Promise<Farm | null> {
  try {
    const farms = await db.query<Farm>(
      `SELECT 
         f.farm_id,
         f.farmer_id,
         f.farm_name,
         f.farm_loc,
         f.land_size,
         f.livestock_type,
         fd.dash_id,
         fd.f_surname,
         fd.first_name,
         fd.f_email,
         fd.f_phone,
         fd.gender,
         fd.reg_date,
         fd.state,
         fd.enterprise,
         fd.state_batch,
         fd.adopted,
         CONCAT(fd.f_surname, ' ', fd.first_name) as owner_name,
         CASE 
           WHEN f.livestock_type IS NOT NULL THEN 'livestock'
           ELSE NULL
         END as farm_type
       FROM f_farm as f
       INNER JOIN farmers_data as fd ON f.farmer_id = fd.farmer_id
       WHERE f.farm_id = ? AND fd.verified = 1
       LIMIT 1`,
      [farmId, dashId]
    );
    
    return farms?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch farm by ID:", error);
    return null;
  }
}

/**
 * Get farm statistics for dashboard
 */
export async function getFarmStatistics(dashId: number): Promise<{
  totalFarms: number;
  totalArea: number;
  cropFarms: number;
  livestockFarms: number;
  mixedFarms: number;
  activeFarms: number;
}> {
  try {
    const farms = await getFarms(dashId);
    
    const totalFarms = farms.length;
    const totalArea = farms.reduce((sum, farm) => sum + (farm.farm_area || 0), 0);
    const cropFarms = 0; // crop_type is removed
    const livestockFarms = farms.filter(farm => farm.farm_type === 'livestock').length;
    const mixedFarms = 0; // crop_type is removed
    const activeFarms = farms.filter(farm => farm.farm_status === 'active').length;
    
    return {
      totalFarms,
      totalArea,
      cropFarms,
      livestockFarms,
      mixedFarms,
      activeFarms
    };
  } catch (error) {
    console.error("Failed to fetch farm statistics:", error);
    return {
      totalFarms: 0,
      totalArea: 0,
      cropFarms: 0,
      livestockFarms: 0,
      mixedFarms: 0,
      activeFarms: 0
    };
  }
}