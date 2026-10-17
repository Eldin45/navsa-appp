// app/api/user/route.ts
import type { NextRequest } from "next/server";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import * as z from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

import { authOptions } from "~/lib/auth";
import { db } from "~/lib/db";

// Define schemas for validation
const businessInfoSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  employees: z.number().optional(),
  founded: z.string().optional(),
  revenue: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

const userSchema = z.object({
  address: z.string().min(1, "Address is required"),
  businessName: z.string().min(1, "Business name is required"),
  businessInfo: businessInfoSchema.optional(),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  name: z.string().min(1, "Name is required").max(500),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long"),
  phone: z.string().min(1, "Phone number is required").max(20),
  type: z.string().min(1, "Type is required"),
  whatsapp: z.string().min(1, "WhatsApp number is required"),
  profileImage: z.string().optional(),
});

// Helper function
const cleanPhone = (phone: string) => phone.replace(/\D/g, "");

// GET: Fetch user by phone number
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required as a query parameter" },
        { status: 400 },
      );
    }

    const cleanedPhone = cleanPhone(phone);
    
    // Query user with subscription and plan information
    const user = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string;
      address: string;
      business_name: string;
      type: string;
      whatsapp: string;
      profile_image: string | null;
      subscription_id: number | null;
      plan_id: number | null;
      plan_name: string | null;
      plan_price: number | null;
      plan_duration: string | null;
      subscription_status: string | null;
      subscription_start_date: Date | null;
      subscription_end_date: Date | null;
    }>(
      `SELECT 
        u.id, u.email, u.name, u.phone, u.address, 
        u.business_name, u.type, u.whatsapp, u.profile_image,
        s.id as subscription_id, s.plan_id, s.status as subscription_status,
        s.start_date as subscription_start_date, s.end_date as subscription_end_date,
        p.name as plan_name, p.price as plan_price, p.duration as plan_duration
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE u.phone = ? OR u.phone LIKE ?
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [`${cleanedPhone}`, `%${cleanedPhone}%`]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format response to match expected structure
    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      businessName: user.business_name,
      type: user.type,
      whatsapp: user.whatsapp,
      profileImage: user.profile_image,
      subscription: user.subscription_id ? {
        id: user.subscription_id,
        userId: user.id,
        planId: user.plan_id,
        status: user.subscription_status,
        startDate: user.subscription_start_date,
        endDate: user.subscription_end_date,
        plan: user.plan_id ? {
          id: user.plan_id,
          name: user.plan_name,
          price: user.plan_price,
          duration: user.plan_duration
        } : null
      } : null
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated (if required)
    // if (!session) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const formData = await request.formData();
    
    // Extract form data
    const address = formData.get("address") as string;
    const businessName = formData.get("businessName") as string;
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const type = formData.get("type") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const profileImage = formData.get("profileImage") as File | null;
    const businessInfoJson = formData.get("businessInfo") as string;

    // Parse business info if provided
    let businessInfo;
    try {
      businessInfo = businessInfoJson ? JSON.parse(businessInfoJson) : {};
    } catch {
      businessInfo = {};
    }

    // Validate input
    const validationResult = userSchema.safeParse({
      address,
      businessName,
      businessInfo,
      email,
      name,
      password,
      phone,
      type,
      whatsapp,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 },
      );
    }

    const cleanedPhone = cleanPhone(phone);
    const cleanedWhatsapp = cleanPhone(whatsapp);

    // Check if user already exists
    const existingUser = await db.queryOne<{ id: number }>(
      `SELECT id FROM users WHERE email = ? OR phone = ?`,
      [email, cleanedPhone]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Handle profile image upload
    let profileImageUrl = null;
    if (profileImage && profileImage.size > 0) {
      try {
        // Convert file to buffer
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public/uploads/profiles");
        await mkdir(uploadDir, { recursive: true });
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${profileImage.name.replace(/\s+/g, '-')}`;
        const filepath = path.join(uploadDir, filename);
        
        // Save file
        await writeFile(filepath, buffer);
        
        // Set URL for database
        profileImageUrl = `/uploads/profiles/${filename}`;
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        // Continue without image if upload fails
      }
    }

    // Start transaction for user creation
    const result = await db.transaction(async (connection) => {
      // Insert user
      const [userResult] = await connection.execute(
        `INSERT INTO users (
          email, name, phone, password, address, 
          business_name, type, whatsapp, profile_image,
          business_info, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          email,
          name,
          cleanedPhone,
          hashedPassword,
          address,
          businessName,
          type,
          cleanedWhatsapp,
          profileImageUrl,
          JSON.stringify(businessInfo),
        ]
      );

      const userId = (userResult as any).insertId;

      // Create default subscription if needed (free plan)
      const freePlan = await db.queryOne<{ id: number }>(
        'SELECT id FROM plans WHERE price = 0 AND is_active = true ORDER BY created_at LIMIT 1'
      );

      if (freePlan) {
        await connection.execute(
          `INSERT INTO subscriptions (
            user_id, plan_id, status, start_date, end_date, created_at
          ) VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
          [userId, freePlan.id]
        );
      }

      // Create user settings
      await connection.execute(
        `INSERT INTO user_settings (user_id, created_at, updated_at) 
         VALUES (?, NOW(), NOW())`,
        [userId]
      );

      return userId;
    });

    // Fetch created user
    const newUser = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string;
      address: string;
      business_name: string;
      type: string;
      whatsapp: string;
      profile_image: string | null;
      created_at: Date;
    }>(
      `SELECT id, email, name, phone, address, business_name, 
              type, whatsapp, profile_image, created_at
       FROM users WHERE id = ?`,
      [result]
    );

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: newUser!.id,
          email: newUser!.email,
          name: newUser!.name,
          phone: newUser!.phone,
          address: newUser!.address,
          businessName: newUser!.business_name,
          type: newUser!.type,
          whatsapp: newUser!.whatsapp,
          profileImage: newUser!.profile_image,
          createdAt: newUser!.created_at,
        },
      },
      { status: 201 },
    );

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT: Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists and belongs to the session user
    const existingUser = await db.queryOne<{ id: number }>(
      'SELECT id FROM users WHERE id = ?',
      [parseInt(userId)]
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Extract update data
    const updates: { [key: string]: any } = {};
    const fields = [
      'address', 'businessName', 'email', 'name', 'phone', 
      'type', 'whatsapp', 'profileImage'
    ];

    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        updates[field] = value;
      }
    });

    // Handle business info separately
    const businessInfoJson = formData.get("businessInfo") as string;
    if (businessInfoJson) {
      try {
        updates.businessInfo = JSON.parse(businessInfoJson);
      } catch {
        updates.businessInfo = {};
      }
    }

    // Validate email if being updated
    if (updates.email) {
      const emailSchema = z.string().email("Invalid email");
      const emailResult = emailSchema.safeParse(updates.email);
      if (!emailResult.success) {
        return NextResponse.json(
          { error: emailResult.error.errors[0].message },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const emailCheck = await db.queryOne<{ id: number }>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [updates.email, parseInt(userId)]
      );

      if (emailCheck) {
        return NextResponse.json(
          { error: "Email already taken by another user" },
          { status: 409 }
        );
      }
    }

    // Handle profile image upload if provided
    const profileImage = formData.get("profileImage") as File;
    if (profileImage && profileImage.size > 0) {
      try {
        // Convert file to buffer
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public/uploads/profiles");
        await mkdir(uploadDir, { recursive: true });
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${profileImage.name.replace(/\s+/g, '-')}`;
        const filepath = path.join(uploadDir, filename);
        
        // Save file
        await writeFile(filepath, buffer);
        
        // Update profile image URL
        updates.profileImage = `/uploads/profiles/${filename}`;
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        // Don't fail the whole update if image upload fails
        delete updates.profileImage;
      }
    }

    // Build update query
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.address) {
      setClauses.push('address = ?');
      params.push(updates.address);
    }

    if (updates.businessName) {
      setClauses.push('business_name = ?');
      params.push(updates.businessName);
    }

    if (updates.email) {
      setClauses.push('email = ?');
      params.push(updates.email);
    }

    if (updates.name) {
      setClauses.push('name = ?');
      params.push(updates.name);
    }

    if (updates.phone) {
      const cleanedPhone = cleanPhone(updates.phone);
      setClauses.push('phone = ?');
      params.push(cleanedPhone);
    }

    if (updates.type) {
      setClauses.push('type = ?');
      params.push(updates.type);
    }

    if (updates.whatsapp) {
      const cleanedWhatsapp = cleanPhone(updates.whatsapp);
      setClauses.push('whatsapp = ?');
      params.push(cleanedWhatsapp);
    }

    if (updates.profileImage) {
      setClauses.push('profile_image = ?');
      params.push(updates.profileImage);
    }

    if (updates.businessInfo) {
      setClauses.push('business_info = ?');
      params.push(JSON.stringify(updates.businessInfo));
    }

    // Add updated_at timestamp
    setClauses.push('updated_at = NOW()');

    // Add user ID to params
    params.push(parseInt(userId));

    // Execute update
    const affectedRows = await db.update(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    if (affectedRows === 0) {
      return NextResponse.json(
        { error: "No changes were made" },
        { status: 400 }
      );
    }

    // Fetch updated user
    const updatedUser = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string;
      address: string;
      business_name: string;
      type: string;
      whatsapp: string;
      profile_image: string | null;
      business_info: any;
      updated_at: Date;
    }>(
      `SELECT id, email, name, phone, address, business_name, 
              type, whatsapp, profile_image, business_info, updated_at
       FROM users WHERE id = ?`,
      [parseInt(userId)]
    );

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        phone: updatedUser!.phone,
        address: updatedUser!.address,
        businessName: updatedUser!.business_name,
        type: updatedUser!.type,
        whatsapp: updatedUser!.whatsapp,
        profileImage: updatedUser!.profile_image,
        businessInfo: updatedUser!.business_info,
        updatedAt: updatedUser!.updated_at,
      },
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.queryOne<{ id: number }>(
      'SELECT id FROM users WHERE id = ?',
      [parseInt(userId)]
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Use transaction for deletion to maintain data integrity
    await db.transaction(async (connection) => {
      // Delete related records first (depending on foreign key constraints)
      await connection.execute('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM user_settings WHERE user_id = ?', [userId]);
      
      // Delete user
      await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}