// ~/lib/queries/adopted-farmers.ts
import "server-only";
import { db } from "../db";

export interface AdoptedFarmer {
  // Fields from farmers_data table only
  farmer_id: number;
  dash_id: number;
  f_surname: string;
  first_name: string;
  f_email: string;
  f_phone: string;
  gender: string;
  reg_date: Date;
  state: string;
  local_govt: string;
  ents_id: number;
  state_batch: string;
  adopted: number;
}

/**
 * Fetches all adopted farmers where adopted = 1
 */
export async function getAdoptedFarmers(): Promise<AdoptedFarmer[]> {
  try {
    console.log("Querying all adopted farmers...");
    
    const farmers = await db.query<AdoptedFarmer>(
      `SELECT 
         farmer_id,
         dash_id,
         f_surname,
         first_name,
         f_email,
         f_phone,
         gender,
         reg_date,
         state,
        local_govt,
         ents_id,
         state_batch,
         adopted
       FROM farmers_data
       ORDER BY reg_date DESC`
    );
    
    return farmers || [];
  } catch (error) {
    console.error("Failed to fetch adopted farmers:", error);
    return [];
  }
}

/**
 * Get adopted farmers statistics from farmers_data only
 */
export async function getAdoptedFarmersStats(): Promise<{
  total: number;
  byState: Record<string, number>;
}> {
  try {
    // Get total count of adopted farmers
    const totals = await db.query<{ total: number }>(
      `SELECT COUNT(*) as total
       FROM farmers_data
       WHERE adopted = 1`
    );

    const total = totals?.[0]?.total || 0;

    // Get state distribution for adopted farmers
    const states = await db.query<{
      state: string;
      count: number;
    }>(
      `SELECT 
         state,
         COUNT(*) as count
       FROM farmers_data
       GROUP BY state
       ORDER BY count DESC`
    );

    const byState: Record<string, number> = {};

    states?.forEach(stat => {
      if (stat.state) {
        byState[stat.state] = stat.count;
      }
    });

    return {
      total,
      byState
    };
  } catch (error) {
    console.error("Failed to fetch adopted farmers stats:", error);
    return {
      total: 0,
      byState: {}
    };
  }
}