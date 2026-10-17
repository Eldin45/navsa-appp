// app/api/user/route.ts
import type { NextRequest } from "next/server";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import * as z from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

import { authOptions } from "~/lib/auth";
import { db } from "~/lib/db";
import { uploadImage } from "~/lib/upload-image";

// Remove the deprecated config export and use individual exports instead
export const maxDuration = 30; // Maximum duration for this API route
export const dynamic = "force-dynamic"; // Ensure dynamic rendering

// Schemas
const userSchema = z.object({
  address: z.string().min(1, "Address is required"),
  businessName: z.string().min(1, "Business name is required"),
  referal: z.string().optional(),
  storeUrl: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  name: z.string().min(1, "Name is required").max(500),
  aboutBusiness: z.string().min(1, "About business is required").max(3000),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long"),
  phone: z.string().min(1, "Phone number is required").max(20),
  type: z.string().min(1, "Type is required"),
  whatsapp: z.string().min(1, "WhatsApp number is required"),
});

// Helper function
const cleanPhone = (phone: string) => phone.replace(/\D/g, "");

// GET: Fetch user by phone number
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required as a query parameter" },
        { status: 400 },
      );
    }

    const cleanedPhone = cleanPhone(phone);
    
    // Fetch user with their business information
    const user = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string;
      pkey: string;
      rf_link: string;
      referal: string;
      created_at: Date;
      business_id: number;
      business_name: string;
      address: string;
      business_id_code: string;
      link: string;
      about_business: string;
      link_name: string;
      mplink: string;
      type: string;
      logo: string | null;
      logo_public_id: string | null;
      whatsapp: string;
    }>(
      `SELECT 
        u.id, u.email, u.name, u.phone, u.pkey, u.rf_link, u.referal, u.created_at,
        b.id as business_id, b.bussines_name as business_name, b.address, 
        b.bussinesId as business_id_code, b.link, b.aboutBusiness as about_business,
        b.link_name, b.mplink, b.type, b.logo, b.logo_public_id, b.whatsapp
       FROM users u
       LEFT JOIN bussiness b ON u.id = b.user_id
       WHERE u.phone = ? OR u.phone LIKE ? OR u.phone = ?
       LIMIT 1`,
      [phone, cleanedPhone, cleanedPhone]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format response
    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      pkey: user.pkey,
      rf_link: user.rf_link,
      referal: user.referal,
      createdAt: user.created_at,
      bussiness: user.business_id ? {
        id: user.business_id,
        bussines_name: user.business_name,
        address: user.address,
        bussinesId: user.business_id_code,
        link: user.link,
        aboutBusiness: user.about_business,
        link_name: user.link_name,
        mplink: user.mplink,
        type: user.type,
        logo: user.logo,
        logo_public_id: user.logo_public_id,
        whatsapp: user.whatsapp
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

// POST: Create new user with business
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const formDataObj = Object.fromEntries(formData.entries());

    // Validate input using Zod
    const {
      address,
      businessName,
      email,
      aboutBusiness,
      name,
      referal,
      password,
      storeUrl,
      phone,
      type,
      whatsapp,
    } = userSchema.parse(formDataObj);

    const cleanedPhone = cleanPhone(phone);

    // Check for existing email
    const existingByEmail = await db.queryOne<{ id: number }>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }

    // Check for existing phone
    const existingByPhone = await db.queryOne<{ id: number }>(
      `SELECT id FROM users WHERE phone = ? OR phone = ?`,
      [phone, cleanedPhone]
    );
    if (existingByPhone) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 409 },
      );
    }

    // Check for existing business name
    const existingBusiness = await db.queryOne<{ id: number }>(
      `SELECT id FROM bussiness WHERE bussines_name = ?`,
      [businessName]
    );
    if (existingBusiness) {
      return NextResponse.json(
        { error: "Business name already exists" },
        { status: 409 },
      );
    }

    // Generate and check store URL
    const generatedLinkName = storeUrl === "" 
      ? businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : storeUrl;

    const existingLinkName = await db.queryOne<{ id: number }>(
      'SELECT id FROM bussiness WHERE link_name = ?',
      [generatedLinkName]
    );
    if (existingLinkName) {
      return NextResponse.json(
        { error: "Store URL already exists" },
        { status: 409 },
      );
    }

    // Handle logo upload
    const logoFile = formData.get("logo") as File | null;
    let logoUrl = null;
    let logoPublicId = null;

    if (logoFile && logoFile.size > 0) {
      const uploadResult = await uploadImage(logoFile, "logos");
      
      if (uploadResult?.secure_url && uploadResult?.public_id) {
        logoUrl = uploadResult.secure_url;
        logoPublicId = uploadResult.public_id;
      } else {
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 },
        );
      }
    }

    // Generate unique identifiers
    const businessId = generateBusinessId();
    const prdkey = generatePRDKey();
    const businessLink = generateBusinessLink(generatedLinkName);
    const mproductLink = generateProdLink(businessId);
    const referralLink = generateReferal(prdkey);
    
    // Set expiration date for subscription (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Start transaction for data consistency
    const result = await db.transaction(async (connection) => {
      // 1. Create user
      const [userResult] = await connection.execute(
        `INSERT INTO users (email, name, phone, pkey, rf_link, referal, password, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          email,
          name,
          cleanedPhone,
          prdkey,
          referralLink,
          referal || "",
          await hash(password, 10)
        ]
      );

      const userId = (userResult as any).insertId;

      // 2. Create business
      const [businessResult] = await connection.execute(
        `INSERT INTO bussiness (
          user_id, address, bussines_name, bussinesId, link, aboutBusiness, 
          link_name, mplink, type, logo, logo_public_id, whatsapp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          address,
          businessName,
          businessId,
          businessLink,
          aboutBusiness,
          generatedLinkName,
          mproductLink,
          type,
          logoUrl,
          logoPublicId,
          whatsapp
        ]
      );

      const businessIdNum = (businessResult as any).insertId;

      // 3. Create subscription (default plan ID 1)
      const [subscriptionResult] = await connection.execute(
        `INSERT INTO subscriptions (
          planId, userId, planType, expiresAt, status, created_at
        ) VALUES (?, ?, ?, ?, 'active', NOW())`,
        [
          1, // Default plan ID
          cleanedPhone,
          "Monthly",
          expiresAt
        ]
      );

      const subscriptionId = (subscriptionResult as any).insertId;

      // 4. Create subscription history
      await connection.execute(
        `INSERT INTO subscription_history (
          subscription_id, planId, userId, planType, changeReason, 
          expiresAt, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          subscriptionId,
          1, // Default plan ID
          cleanedPhone,
          "Monthly",
          "New account",
          expiresAt
        ]
      );

      return { userId, businessId: businessIdNum, subscriptionId };
    });

    // Fetch created user without password
    const newUser = await db.queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string;
      pkey: string;
      rf_link: string;
      referal: string;
      created_at: Date;
    }>(
      `SELECT id, email, name, phone, pkey, rf_link, referal, created_at 
       FROM users WHERE id = ?`,
      [result.userId]
    );

    // Fetch created business
    const newBusiness = await db.queryOne<{
      id: number;
      bussines_name: string;
      address: string;
      bussinesId: string;
      link: string;
      aboutBusiness: string;
      link_name: string;
      mplink: string;
      type: string;
      logo: string | null;
      logo_public_id: string | null;
      whatsapp: string;
      created_at: Date;
    }>(
      `SELECT id, bussines_name, address, bussinesId, link, aboutBusiness, 
              link_name, mplink, type, logo, logo_public_id, whatsapp, created_at
       FROM bussiness WHERE id = ?`,
      [result.businessId]
    );

    return NextResponse.json(
      {
        business: newBusiness,
        message: "Registration successful",
        user: newUser,
      },
      { status: 201 },
    );

  } catch (error) {
    console.error("Registration error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || "Invalid data";

      return NextResponse.json(
        {
          error: errorMessage,
          details: error.errors,
        },
        { status: 400 },
      );
    }

    // Handle database constraint errors
    if ((error as any).code === 'ER_DUP_ENTRY') {
      const errorMessage = (error as any).sqlMessage?.includes('email') 
        ? "Email already exists" 
        : (error as any).sqlMessage?.includes('phone')
          ? "Phone number already exists"
          : "Unique constraint violation";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 },
      );
    }

    // Generic error response
    return NextResponse.json({ 
      error: "Registration failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// PUT: Update user and business
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate user exists
    const existingUser = await db.queryOne<{ id: number; email: string; phone: string }>(
      'SELECT id, email, phone FROM users WHERE id = ?',
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
    const userFields = ['email', 'name', 'phone', 'referal'];
    const businessFields = ['address', 'businessName', 'aboutBusiness', 'type', 'whatsapp', 'storeUrl'];

    userFields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        updates[field] = value;
      }
    });

    businessFields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        updates[field] = value;
      }
    });

    // Handle logo upload
    const logoFile = formData.get("logo") as File;
    if (logoFile && logoFile.size > 0) {
      const uploadResult = await uploadImage(logoFile, "logos");
      
      if (uploadResult?.secure_url && uploadResult?.public_id) {
        updates.logo = uploadResult.secure_url;
        updates.logoPublicId = uploadResult.public_id;
      } else {
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 },
        );
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

    // Validate phone if being updated
    if (updates.phone) {
      const cleanedPhone = cleanPhone(updates.phone);
      const phoneCheck = await db.queryOne<{ id: number }>(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [cleanedPhone, parseInt(userId)]
      );

      if (phoneCheck) {
        return NextResponse.json(
          { error: "Phone number already taken by another user" },
          { status: 409 }
        );
      }
      updates.phone = cleanedPhone;
    }

    // Handle store URL/business link name validation
    if (updates.storeUrl) {
      const businessCheck = await db.queryOne<{ id: number }>(
        `SELECT id FROM bussiness WHERE link_name = ? AND user_id != ?`,
        [updates.storeUrl, parseInt(userId)]
      );

      if (businessCheck) {
        return NextResponse.json(
          { error: "Store URL already taken by another business" },
          { status: 409 }
        );
      }
    }

    // Handle business name validation
    if (updates.businessName) {
      const businessNameCheck = await db.queryOne<{ id: number }>(
        `SELECT id FROM bussiness WHERE bussines_name = ? AND user_id != ?`,
        [updates.businessName, parseInt(userId)]
      );

      if (businessNameCheck) {
        return NextResponse.json(
          { error: "Business name already taken by another business" },
          { status: 409 }
        );
      }
    }

    // Start transaction for updates
    await db.transaction(async (connection) => {
      // Update user
      const userSetClauses: string[] = [];
      const userParams: any[] = [];

      if (updates.email) {
        userSetClauses.push('email = ?');
        userParams.push(updates.email);
      }

      if (updates.name) {
        userSetClauses.push('name = ?');
        userParams.push(updates.name);
      }

      if (updates.phone) {
        userSetClauses.push('phone = ?');
        userParams.push(updates.phone);
      }

      if (updates.referal) {
        userSetClauses.push('referal = ?');
        userParams.push(updates.referal);
      }

      if (userSetClauses.length > 0) {
        userSetClauses.push('updated_at = NOW()');
        userParams.push(parseInt(userId));
        
        await connection.execute(
          `UPDATE users SET ${userSetClauses.join(', ')} WHERE id = ?`,
          userParams
        );
      }

      // Update business
      const businessSetClauses: string[] = [];
      const businessParams: any[] = [];

      if (updates.address) {
        businessSetClauses.push('address = ?');
        businessParams.push(updates.address);
      }

      if (updates.businessName) {
        businessSetClauses.push('bussines_name = ?');
        businessParams.push(updates.businessName);
      }

      if (updates.aboutBusiness) {
        businessSetClauses.push('aboutBusiness = ?');
        businessParams.push(updates.aboutBusiness);
      }

      if (updates.type) {
        businessSetClauses.push('type = ?');
        businessParams.push(updates.type);
      }

      if (updates.whatsapp) {
        businessSetClauses.push('whatsapp = ?');
        businessParams.push(updates.whatsapp);
      }

      if (updates.storeUrl) {
        businessSetClauses.push('link_name = ?');
        businessParams.push(updates.storeUrl);
      }

      if (updates.logo) {
        businessSetClauses.push('logo = ?, logo_public_id = ?');
        businessParams.push(updates.logo, updates.logoPublicId);
      }

      if (businessSetClauses.length > 0) {
        businessSetClauses.push('updated_at = NOW()');
        businessParams.push(parseInt(userId));
        
        await connection.execute(
          `UPDATE bussiness SET ${businessSetClauses.join(', ')} WHERE user_id = ?`,
          businessParams
        );
      }
    });

    // Fetch updated data
    const updatedData = await db.queryOne<{
      user_id: number;
      user_email: string;
      user_name: string;
      user_phone: string;
      user_referal: string;
      business_id: number;
      business_name: string;
      business_address: string;
      business_about: string;
      business_type: string;
      business_whatsapp: string;
      business_logo: string | null;
      business_link_name: string;
    }>(
      `SELECT 
        u.id as user_id, u.email as user_email, u.name as user_name, 
        u.phone as user_phone, u.referal as user_referal,
        b.id as business_id, b.bussines_name as business_name, 
        b.address as business_address, b.aboutBusiness as business_about,
        b.type as business_type, b.whatsapp as business_whatsapp,
        b.logo as business_logo, b.link_name as business_link_name
       FROM users u
       LEFT JOIN bussiness b ON u.id = b.user_id
       WHERE u.id = ?`,
      [parseInt(userId)]
    );

    return NextResponse.json({
      success: true,
      message: "User and business updated successfully",
      data: {
        user: {
          id: updatedData!.user_id,
          email: updatedData!.user_email,
          name: updatedData!.user_name,
          phone: updatedData!.user_phone,
          referal: updatedData!.user_referal,
        },
        business: {
          id: updatedData!.business_id,
          bussines_name: updatedData!.business_name,
          address: updatedData!.business_address,
          aboutBusiness: updatedData!.business_about,
          type: updatedData!.business_type,
          whatsapp: updatedData!.business_whatsapp,
          logo: updatedData!.business_logo,
          link_name: updatedData!.business_link_name,
        }
      }
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper functions
function generateBusinessId(): string {
  return `biz-${Math.random().toString(36).substring(2, 10)}`;
}

function generateBusinessLink(businessId: string): string {
  const slug = businessId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `https://www.myqreta.com/${slug}`;
}

function generatePRDKey(): string {
  return `pkv-${Math.random().toString(36).substring(2, 10)}`;
}

function generateProdLink(businessId: string): string {
  const slug = businessId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `https://www.myqreta.com/mproduct?prod=${slug}`;
}

function generateReferal(unique: string): string {
  return `https://www.myqreta.com/auth/sign-up?ref=${unique}`;
}