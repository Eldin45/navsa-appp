// ~/lib/actions/supplier-actions.ts
"use server";

import { db } from "~/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Approve a supplier by setting approve_stat to 1
 * @param ins_id - The supplier ID to approve
 * @returns Object with success status and message
 */
export async function approveSupplier(ins_id: number) {
  try {
    // Check if supplier exists
    const supplier = await db.queryOne<{ ins_id: number }>(
      `SELECT ins_id FROM supply_comp WHERE ins_id = ? LIMIT 1`,
      [ins_id]
    );

    if (!supplier) {
      return {
        success: false,
        message: "Supplier not found"
      };
    }

    // Update supplier approval status to 1 (approved)
    await db.update(
      `UPDATE supply_comp 
       SET approve_stat = 1
       WHERE ins_id = ?`,
      [ins_id]
    );

    // Revalidate the suppliers page to show updated data
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      message: "Supplier approved successfully"
    };
  } catch (error) {
    console.error("Failed to approve supplier:", error);
    return {
      success: false,
      message: "Failed to approve supplier"
    };
  }
}

/**
 * Reject a supplier by setting approve_stat to 2
 * @param ins_id - The supplier ID to reject
 * @returns Object with success status and message
 */
export async function rejectSupplier(ins_id: number) {
  try {
    // Check if supplier exists
    const supplier = await db.queryOne<{ ins_id: number }>(
      `SELECT ins_id FROM supply_comp WHERE ins_id = ? LIMIT 1`,
      [ins_id]
    );

    if (!supplier) {
      return {
        success: false,
        message: "Supplier not found"
      };
    }

    // Update supplier approval status to 2 (rejected)
    await db.update(
      `UPDATE supply_comp 
       SET approve_stat = 2
       WHERE ins_id = ?`,
      [ins_id]
    );

    // Revalidate the suppliers page to show updated data
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      message: "Supplier rejected successfully"
    };
  } catch (error) {
    console.error("Failed to reject supplier:", error);
    return {
      success: false,
      message: "Failed to reject supplier"
    };
  }
}

/**
 * Update supplier approval status to pending (0)
 * @param ins_id - The supplier ID to set as pending
 * @returns Object with success status and message
 */
export async function pendingSupplier(ins_id: number) {
  try {
    // Check if supplier exists
    const supplier = await db.queryOne<{ ins_id: number }>(
      `SELECT ins_id FROM supply_comp WHERE ins_id = ? LIMIT 1`,
      [ins_id]
    );

    if (!supplier) {
      return {
        success: false,
        message: "Supplier not found"
      };
    }

    // Update supplier approval status to 0 (pending)
    await db.update(
      `UPDATE supply_comp 
       SET approve_stat = 0
       WHERE ins_id = ?`,
      [ins_id]
    );

    // Revalidate the suppliers page to show updated data
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      message: "Supplier status set to pending"
    };
  } catch (error) {
    console.error("Failed to update supplier status:", error);
    return {
      success: false,
      message: "Failed to update supplier status"
    };
  }
}

/**
 * Update supplier approval status with custom value
 * @param ins_id - The supplier ID
 * @param approve_stat - The status value (0=pending, 1=approved, 2=rejected)
 * @returns Object with success status and message
 */
export async function updateSupplierStatus(ins_id: number, approve_stat: number) {
  try {
    // Validate status value
    if (![0, 1, 2].includes(approve_stat)) {
      return {
        success: false,
        message: "Invalid status value. Must be 0 (pending), 1 (approved), or 2 (rejected)"
      };
    }

    // Check if supplier exists
    const supplier = await db.queryOne<{ ins_id: number }>(
      `SELECT ins_id FROM supply_comp WHERE ins_id = ? LIMIT 1`,
      [ins_id]
    );

    if (!supplier) {
      return {
        success: false,
        message: "Supplier not found"
      };
    }

    // Update supplier approval status
    await db.update(
      `UPDATE supply_comp 
       SET approve_stat = ?
       WHERE ins_id = ?`,
      [approve_stat, ins_id]
    );

    // Get status text for message
    const statusText = approve_stat === 0 ? 'pending' : approve_stat === 1 ? 'approved' : 'rejected';

    // Revalidate the suppliers page to show updated data
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      message: `Supplier ${statusText} successfully`
    };
  } catch (error) {
    console.error("Failed to update supplier status:", error);
    return {
      success: false,
      message: "Failed to update supplier status"
    };
  }
}

/**
 * Bulk approve multiple suppliers
 * @param supplierIds - Array of supplier IDs to approve
 * @returns Object with success status and message
 */
export async function bulkApproveSuppliers(supplierIds: number[]) {
  try {
    if (supplierIds.length === 0) {
      return {
        success: false,
        message: "No suppliers selected"
      };
    }

    const placeholders = supplierIds.map(() => '?').join(',');
    const params = [1, ...supplierIds];

    await db.update(
      `UPDATE supply_comp 
       SET approve_stat = ?
       WHERE ins_id IN (${placeholders})`,
      params
    );

    // Revalidate the suppliers page to show updated data
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      message: `${supplierIds.length} suppliers approved successfully`
    };
  } catch (error) {
    console.error("Failed to bulk approve suppliers:", error);
    return {
      success: false,
      message: "Failed to approve suppliers"
    };
  }
}

/**
 * Bulk reject multiple suppliers
 * @param supplierIds - Array of supplier IDs to reject
 * @returns Object with success status and message
 */
export async function bulkRejectSuppliers(supplierIds: number[]) {
  try {
    if (supplierIds.length === 0) {
      return {
        success: false,
        message: "No suppliers selected"
      };
    }

    const placeholders = supplierIds.map(() => '?').join(',');
    const params = [2, ...supplierIds];

    await db.update(
      `UPDATE supply_comp 
       SET approve_stat = ?
       WHERE ins_id IN (${placeholders})`,
      params
    );

    // Revalidate the suppliers page to show updated data
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      message: `${supplierIds.length} suppliers rejected successfully`
    };
  } catch (error) {
    console.error("Failed to bulk reject suppliers:", error);
    return {
      success: false,
      message: "Failed to reject suppliers"
    };
  }
}