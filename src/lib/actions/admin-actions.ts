// ~/lib/actions/admin-actions.ts
"use server";

import { db } from "~/lib/db";

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