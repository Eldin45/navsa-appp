// ~/lib/queries/input-requests.ts
import "server-only";
import { db } from "../db";

export interface InputRequestJoin {
  // Fields from input_request
  request_id: number;
  supplier_id: number;
  farmerId: number;
  status: number;
  approoveStat: number;
  created_at?: Date;
  updated_at?: Date;
  
  // Fields from supply_comp
  ins_id: number;
  company_name?: string;
  company_email?: string;
  phone?: string;
  
  // Fields from farmers_data
  farmer_id: number;
  dash_id: number;
  f_surname: string;
  first_name: string;
  f_email: string;
  f_phone: string;
  gender: string;
  reg_date: Date;
  state: string;
  lga: string;
  farm_name: string;
  farm_size: number;
  f_loc: string;
  ents_id: number;
  state_batch: string;
  
  // Fields from enterprise
  ent_id: number;
  enterprise_name?: string;
  enterprise_type?: string;
}

/**
 * Fetches all pending input requests for a specific admin and batch
 * where status=1 and approoveStat=0
 */
export async function getPendingInputRequests(
  adminUser: number,
  batch: string
): Promise<InputRequestJoin[]> {
  try {
    const requests = await db.query<InputRequestJoin>(
      `SELECT 
         a.*,
         b.*,
         c.*,
         d.*
       FROM input_request as a
       INNER JOIN supply_comp as b ON a.supplier_id = b.ins_id
       INNER JOIN farmers_data as c ON a.farmerId = c.farmer_id
       INNER JOIN enterprise as d ON c.ents_id = d.ent_id
       WHERE c.dash_id = ? 
         AND c.state_batch = ?
         AND a.approoveStat = 0  -- Only pending (not approved or rejected)
       ORDER BY a.request_id DESC`,
      [adminUser, batch]
    );
    
    return requests || [];
  } catch (error) {
    console.error("Failed to fetch pending input requests:", error);
    return [];
  }
}

/**
 * Fetches only the recent pending input requests (with limit)
 */
export async function getRecentPendingInputRequests(
  adminUser: number,
  batch: string,
  limit: number = 10
): Promise<InputRequestJoin[]> {
  try {
    const requests = await db.query<InputRequestJoin>(
      `SELECT 
         a.*,
         b.*,
         c.*,
         d.*
       FROM input_request as a
       INNER JOIN supply_comp as b ON a.supplier_id = b.ins_id
       INNER JOIN farmers_data as c ON a.farmerId = c.farmer_id
       INNER JOIN enterprise as d ON c.ents_id = d.ent_id
       WHERE c.dash_id = ? 
         AND c.state_batch = ?
         AND a.approoveStat = 0  -- Only pending (not approved or rejected)
       ORDER BY a.request_id DESC
       LIMIT ?`,
      [adminUser, batch, limit]
    );
    
    return requests || [];
  } catch (error) {
    console.error("Failed to fetch recent pending input requests:", error);
    return [];
  }
}

/**
 * Get all input requests for a specific admin and batch
 * (including approved and rejected)
 */
export async function getAllInputRequests(
  adminUser: number,
  batch: string
): Promise<InputRequestJoin[]> {
  try {
    const requests = await db.query<InputRequestJoin>(
      `SELECT 
         a.*,
         b.*,
         c.*,
         d.*
       FROM input_request as a
       INNER JOIN supply_comp as b ON a.supplier_id = b.ins_id
       INNER JOIN farmers_data as c ON a.farmerId = c.farmer_id
       INNER JOIN enterprise as d ON c.ents_id = d.ent_id
       WHERE c.dash_id = ? 
         AND c.state_batch = ?
       ORDER BY a.request_id DESC`,
      [adminUser, batch]
    );
    
    return requests || [];
  } catch (error) {
    console.error("Failed to fetch all input requests:", error);
    return [];
  }
}

/**
 * Get approved input requests
 */
export async function getApprovedInputRequests(
  adminUser: number,
  batch: string
): Promise<InputRequestJoin[]> {
  try {
    const requests = await db.query<InputRequestJoin>(
      `SELECT 
         a.*,
         b.*,
         c.*,
         d.*
       FROM input_request as a
       INNER JOIN supply_comp as b ON a.supplier_id = b.ins_id
       INNER JOIN farmers_data as c ON a.farmerId = c.farmer_id
       INNER JOIN enterprise as d ON c.ents_id = d.ent_id
       WHERE c.dash_id = ? 
         AND c.state_batch = ?
         AND a.approoveStat = 1  -- Approved
       ORDER BY a.request_id DESC`,
      [adminUser, batch]
    );
    
    return requests || [];
  } catch (error) {
    console.error("Failed to fetch approved input requests:", error);
    return [];
  }
}

/**
 * Get rejected input requests
 */
export async function getRejectedInputRequests(
  adminUser: number,
  batch: string
): Promise<InputRequestJoin[]> {
  try {
    const requests = await db.query<InputRequestJoin>(
      `SELECT 
         a.*,
         b.*,
         c.*,
         d.*
       FROM input_request as a
       INNER JOIN supply_comp as b ON a.supplier_id = b.ins_id
       INNER JOIN farmers_data as c ON a.farmerId = c.farmer_id
       INNER JOIN enterprise as d ON c.ents_id = d.ent_id
       WHERE c.dash_id = ? 
         AND c.state_batch = ?
         AND a.approoveStat = 2  -- Rejected
       ORDER BY a.request_id DESC`,
      [adminUser, batch]
    );
    
    return requests || [];
  } catch (error) {
    console.error("Failed to fetch rejected input requests:", error);
    return [];
  }
}