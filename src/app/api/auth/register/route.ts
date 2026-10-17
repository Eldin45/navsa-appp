// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/db";
import {
  registerSystemUser,
  registrationSchema,
} from "~/lib/services/registration.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📝 [REGISTER] Request:", {
      email: body.email,
      role: body.role,
      hasPhone: !!body.phone,
    });

    // Validate input
    const validated = registrationSchema.parse(body);

    // Block public self-registration as SUPER_ADMIN (defense in depth)
    if ((validated as any).role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Super admin accounts cannot be self-registered" },
        { status: 403 }
      );
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.trim().toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check phone
    if (validated.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: validated.phone },
      });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "Phone number already in use" },
          { status: 409 }
        );
      }
    }

    // Register
    const result = await registerSystemUser(validated, request);

    console.log("✅ [REGISTER] Success:", {
      userId: result.user.id,
      role: result.role,
      wallets: result.wallets.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        data: {
          user: result.user,
          role: result.role,
          organizationId: result.organizationId,
          wallets: result.wallets,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ [REGISTER] Error:", {
      name: error.name,
      message: error.message,
    });

    // Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Prisma unique constraint
    if (error.code === "P2002") {
      const target = error.meta?.target;
      if (Array.isArray(target)) {
        if (target.includes("email")) {
          return NextResponse.json(
            { success: false, error: "Email already exists" },
            { status: 409 }
          );
        }
        if (target.includes("slug")) {
          return NextResponse.json(
            { success: false, error: "Slug collision — please retry" },
            { status: 500 }
          );
        }
        if (target.includes("account_number")) {
          return NextResponse.json(
            { success: false, error: "Account number collision — please retry" },
            { status: 500 }
          );
        }
      }
      return NextResponse.json(
        { success: false, error: "Record already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}