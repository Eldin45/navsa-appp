// src/app/dashboard/admin/page.tsx
import { getCurrentUser } from "~/lib/auth1";
import AdminPage from "./page.client";
import { 
  getCooperatesDashboard, 
  getCooperatesDashboardStats,
  getCooperatesDashboardFiltered,
  createAdmin  // 👈 ADD THIS IMPORT
} from "~/lib/queries/cooperates-dashboard";
import { db } from "~/lib/db"; // 👈 ADD THIS IMPORT for the test connection

interface PageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    status?: string;
    privilege?: string;
    active?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

export default async function AdminServerPage(props: PageProps) {
  // Await searchParams first
  const searchParams = await props.searchParams;
  
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please log in to view this page</p>
        </div>
      </div>
    );
  }

  console.log("=== ADMIN SERVER PAGE DEBUG ===");
  console.log("Loading app_admin for admin ID:", user.id);
  console.log("Search params:", searchParams);

  let adminsData;
  
  try {
    // Use filtered query if search params are provided
    if (searchParams?.search || searchParams?.privilege || searchParams?.status || searchParams?.active) {
      const filters: any = {};
      
      if (searchParams.search) {
        filters.search = searchParams.search;
      }
      if (searchParams.privilege) {
        filters.privilege = searchParams.privilege;
      }
      if (searchParams.status) {
        filters.status = searchParams.status === '1' ? 1 : searchParams.status === '0' ? 0 : undefined;
      }
      if (searchParams.active) {
        filters.active = searchParams.active === '1' ? 1 : searchParams.active === '0' ? 0 : undefined;
      }
      
      console.log("Using filtered query with:", filters);
      adminsData = await getCooperatesDashboardFiltered(filters);
    } else {
      console.log("Using default query");
      adminsData = await getCooperatesDashboard();
    }
  } catch (error) {
    console.error("Error fetching admin data:", error);
    adminsData = [];
  }

  console.log("=== RAW DATA FROM DATABASE ===");
  console.log("Total records from DB:", adminsData?.length || 0);
  
  if (adminsData && adminsData.length > 0) {
    console.log("First 3 records from DB:", adminsData.slice(0, 3));
    console.log("First record structure:");
    Object.entries(adminsData[0]).forEach(([key, value]) => {
      console.log(`  ${key}: ${value} (type: ${typeof value})`);
    });
  } else {
    console.log("⚠️ WARNING: No data returned from database!");
    // Check if database connection is working
    try {
      const testConnection = await db.query("SELECT 1 as test");
      console.log("Database connection test:", testConnection);
    } catch (dbError) {
      console.error("Database connection error:", dbError);
    }
  }
  
  // Get statistics
  let statsData;
  try {
    statsData = await getCooperatesDashboardStats();
  } catch (error) {
    console.error("Error fetching stats:", error);
    statsData = {
      total: 0,
      byState: {},
      byStatus: {},
      recentRegistrations: 0,
      byPrivilege: {},
      activeAdmins: 0,
      inactiveAdmins: 0
    };
  }
  
  console.log("=== STATISTICS DATA ===");
  console.log("Stats:", JSON.stringify(statsData, null, 2));

  // Ensure adminsData is an array
  const safeAdminsData = Array.isArray(adminsData) ? adminsData : [];
  
  // Calculate stats from the data
  const activeAdmins = safeAdminsData.filter(a => a.status === 1).length || 0;
  const inactiveAdmins = safeAdminsData.filter(a => a.status === 0).length || 0;
  
  // Get unique privileges from the data
  const uniquePrivileges = Array.from(
    new Set(
      safeAdminsData
        .map(a => a.privilege)
        .filter((privilege): privilege is string => 
          privilege !== undefined && privilege !== null && privilege !== ''
        )
    )
  ).map(priv => priv.trim());

  console.log("=== TRANSFORMING DATA ===");
  console.log("Unique privileges found:", uniquePrivileges);
  
  const transformedAdmins = safeAdminsData.map((admin, index) => {
    // Get full name
    const fullname = admin.fullname || "";
    const nameParts = fullname.trim().split(/\s+/);
    const d_firstname = nameParts[0] || "";
    const d_surname = nameParts.slice(1).join(" ") || "";
    
    // Get privilege/role
    const privilege = admin.privilege || "admin";
    
    // Create transformed object
    const transformed = {
      // Base admin fields
      id: admin.admin_id,
      dash_id: admin.admin_id,
      name: admin.fullname || `Admin ${admin.admin_id}`,
      email: admin.admin_email || "",
      phone: admin.admin_phone || "",
      address: "",
      privilege: privilege,
      state: admin.privilege ? admin.privilege.trim() : "Unknown",
      verification_pin: admin.verification_pin || "",
      registration_date: admin.registration_date || new Date(),
      status: admin.status !== undefined ? admin.status : 0,
      active: admin.active !== undefined ? admin.active : 0,
      created_at: new Date(),
      updated_at: new Date(),
      
      // Dashboard admin fields
      admin_fullname: admin.fullname || "",
      d_firstname: d_firstname,
      d_surname: d_surname,
      d_phone: admin.admin_phone || "",
      d_email: admin.admin_email || "",
      d_status: admin.status !== undefined ? admin.status : 0,
      d_state: admin.privilege ? admin.privilege.trim() : "Unknown",
      dash_role: privilege,
      dash_company: admin.fullname || "",
      created_at_dash: new Date(),
      updated_at_dash: new Date(),
    };
    
    if (index < 3) {
      console.log(`Transformation ${index + 1}:`);
      console.log("  Input:", {
        admin_id: admin.admin_id,
        fullname: admin.fullname,
        privilege: admin.privilege,
        status: admin.status
      });
      console.log("  Output:", {
        id: transformed.id,
        name: transformed.name,
        privilege: transformed.privilege,
        status: transformed.status
      });
    }
    
    return transformed;
  });

  console.log("=== TRANSFORMATION COMPLETE ===");
  console.log("Total transformed admins:", transformedAdmins.length);
  console.log("Sample transformed admin:", transformedAdmins[0]);

  // Apply sorting if specified
  let sortedAdmins = [...transformedAdmins];
  if (searchParams?.sort) {
    sortedAdmins.sort((a, b) => {
      const aVal = a[searchParams.sort as keyof typeof a];
      const bVal = b[searchParams.sort as keyof typeof b];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return searchParams.order === 'desc' 
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return searchParams.order === 'desc'
          ? bVal.getTime() - aVal.getTime()
          : aVal.getTime() - bVal.getTime();
      }
      
      return 0;
    });
  }

  // Create user data
  const userData = {
    id: user.id || "",
    phone: user.phone || "",
    email: user.email || "",
    dash_id: parseInt(user.id) || 0,
    name: user.name || "Admin",
    avatar: null,
  };

  console.log("=== PASSING TO CLIENT ===");
  console.log("Total admins to client:", sortedAdmins.length);
  console.log("User data:", userData);
  
  return (
    <AdminPage
      user={userData}
      initialAdmins={sortedAdmins}
      stats={{
        totalAdmins: transformedAdmins.length,
        activeAdmins: activeAdmins,
        inactiveAdmins: inactiveAdmins,
        recentRegistrations: statsData.recentRegistrations || 0,
        byPrivilege: statsData.byPrivilege || {},
        byStatus: {
          active: activeAdmins,
          inactive: inactiveAdmins
        },
        totalRevenue: 0,
        activeAlerts: 0,
      }}
      filters={{
        privileges: uniquePrivileges,
        roles: uniquePrivileges,
        statuses: [
          { value: '1', label: 'Active', count: activeAdmins },
          { value: '0', label: 'Inactive', count: inactiveAdmins }
        ],
        years: []
      }}
      searchParams={searchParams || {}}
    />
  );
}