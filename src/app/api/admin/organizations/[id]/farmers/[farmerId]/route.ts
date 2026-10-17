import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/session";
import { prisma } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; farmerId: string }>
      | { id: string; farmerId: string };
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id: orgId, farmerId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    if (!isSuperAdmin && user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        image: true,
        status: true,
        role: true,
        organizationId: true,
        created_at: true,
        last_login: true,
        organization: { select: { id: true, name: true, slug: true } },
        farmerProfile: {
          select: {
            farmer_code: true,
            date_of_birth: true,
            gender: true,
            id_type: true,
            id_number: true,
            primary_crops: true,
            years_farming: true,
            total_land_ha: true,
            has_smartphone: true,
            primary_language: true,
            bank_verified: true,
          },
        },
        wallets: {
          select: {
            id: true,
            type: true,
            accountNumber: true,
            balance: true,
            availableBalance: true,
            status: true,
            palmPayAccountNumber: true,
            palmPayBankName: true,
            palmPayStatus: true,
          },
        },
      },
    });

    if (!farmer || farmer.role !== "FARMER" || farmer.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Farmer not found in this organization" },
        { status: 404 }
      );
    }

    const [
      totalFarms,
      totalFields,
      totalCropCycles,
      totalHarvests,
      totalInputRequests,
      totalInputOrders,
      totalDevices,
      harvestAgg,
      walletAgg,
    ] = await Promise.all([
      prisma.farm.count({ where: { userId: farmer.id } }),
      prisma.farmField.count({ where: { farm: { userId: farmer.id } } }),
      prisma.cropCycle.count({
        where: { field: { farm: { userId: farmer.id } } },
      }),
      prisma.harvest.count({
        where: { cycle: { field: { farm: { userId: farmer.id } } } },
      }),
      prisma.inputRequest.count({ where: { farmerId: farmer.id } }),
      prisma.inputOrder.count({ where: { farmerId: farmer.id } }),
      prisma.ioTDevice.count({ where: { farm: { userId: farmer.id } } }),
      prisma.harvest.aggregate({
        _sum: { quantity: true },
        where: { cycle: { field: { farm: { userId: farmer.id } } } },
      }),
      prisma.wallet.aggregate({
        _sum: { balance: true, availableBalance: true },
        where: { userId: farmer.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        farmer: {
          id: farmer.id,
          name: farmer.full_name,
          email: farmer.email,
          phone: farmer.phone,
          image: farmer.image,
          status: farmer.status,
          role: farmer.role,
          createdAt: farmer.created_at.toISOString(),
          lastLoginAt: farmer.last_login
            ? farmer.last_login.toISOString()
            : null,
          organization: farmer.organization,
          profile: farmer.farmerProfile
            ? {
                farmerCode: farmer.farmerProfile.farmer_code,
                dateOfBirth: farmer.farmerProfile.date_of_birth
                  ? farmer.farmerProfile.date_of_birth.toISOString()
                  : null,
                gender: farmer.farmerProfile.gender,
                idType: farmer.farmerProfile.id_type,
                idNumber: farmer.farmerProfile.id_number,
                primaryCrops: farmer.farmerProfile.primary_crops,
                yearsFarming: farmer.farmerProfile.years_farming,
                totalLandHa: farmer.farmerProfile.total_land_ha,
                hasSmartphone: farmer.farmerProfile.has_smartphone,
                primaryLanguage: farmer.farmerProfile.primary_language,
                bankVerified: farmer.farmerProfile.bank_verified,
              }
            : null,
          wallets: farmer.wallets.map((w) => ({
            id: w.id,
            type: w.type,
            accountNumber: w.accountNumber,
            balance: Number(w.balance),
            availableBalance: Number(w.availableBalance),
            status: w.status,
            palmPayAccountNumber: w.palmPayAccountNumber,
            palmPayBankName: w.palmPayBankName,
            palmPayStatus: w.palmPayStatus,
          })),
        },
        summary: {
          totalFarms,
          totalFields,
          totalCropCycles,
          totalHarvests,
          totalInputRequests,
          totalInputOrders,
          totalDevices,
          totalHarvestQuantity: Number(harvestAgg._sum.quantity ?? 0),
          walletBalance: Number(walletAgg._sum.balance ?? 0),
          walletAvailable: Number(walletAgg._sum.availableBalance ?? 0),
        },
      },
    });
  } catch (err: any) {
    console.error("[admin/organizations/:id/farmers/:farmerId]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}