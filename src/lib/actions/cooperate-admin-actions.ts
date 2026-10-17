// ~/lib/actions/cooperate-admin-actions.ts
"use server";

import { db } from "~/lib/db";

export async function createCooperateAdmin(adminData: {
  cooperate_name: string;
  location: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
}) {
  const errors: Record<string, string> = {};
  const { cooperate_name, location, fullname, email, phone, password } = adminData;

  try {
    // Check if email already exists in dashboard_admin
    const existingAdmin = await db.queryOne<{ admin_id: number }>(
      `SELECT dadmin_id FROM dashboard_admin WHERE admin_email = ? LIMIT 1`,
      [email]
    );

    if (existingAdmin) {
      errors['email'] = "Email already exists";
      return {
        success: false,
        errors,
        cooperateId: null,
        adminId: null
      };
    }

    // If no errors, proceed with insertion
    if (Object.keys(errors).length === 0) {
      // Start a transaction since we're inserting into two tables
      // Note: You'll need to ensure your db client supports transactions
      // If not, you might need to handle this differently
      
      // First insert into cooperates table
      const cooperateId = await db.insert(
        `INSERT INTO cooperates (cooperate_name, location) 
         VALUES (?, ?)`,
        [cooperate_name, location]
      );

      if (!cooperateId) {
        throw new Error("Failed to insert into cooperates table");
      }

      // Then insert into dashboard_admin table with the cooperate_id as dash_id
      const adminId = await db.insert(
        `INSERT INTO dashboard_admin (dash_id, admin_fullname, admin_email, admin_phone, admin_password) 
         VALUES (?, ?, ?, ?, ?)`,
        [cooperateId, fullname, email, phone, password]
      );

      return {
        success: true,
        errors: null,
        cooperateId,
        adminId
      };
    }

    return {
      success: false,
      errors,
      cooperateId: null,
      adminId: null
    };

  } catch (error) {
    console.error("Failed to create cooperate admin:", error);
    return {
      success: false,
      errors: { general: "Failed to create cooperate admin" },
      cooperateId: null,
      adminId: null
    };
  }
}