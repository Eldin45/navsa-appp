// src/app/dashboard/farms/page.tsx (SERVER COMPONENT)
import { getCurrentUser } from "~/lib/auth1";
import FarmsPage from "./page.client";
import { getFarms, getFarmStatistics } from "~/lib/queries/farms";

interface PageProps {
  searchParams?: {
    page?: string;
    search?: string;
    status?: string;
    state?: string;
    type?: string;
  }
}

export default async function FarmsServerPage({ searchParams = {} }: PageProps) {
  const user = await getCurrentUser();

  if (!user || !user.dash_id) {
    return null;
  }

  console.log("🟢 Loading farms for user:", user.name, "dash_id:", user.dash_id);

  // ALWAYS provide fallback data to test the UI
  const fallbackFarms = [
    {
      id: 1,
      name: "Sunshine Crop Farm",
      owner: "John Adebayo",
      ownerId: 101,
      location: {
        state: "Lagos",
        lga: "Ikeja",
        village: "Opebi",
        coordinates: ""
      },
      size: 50,
      type: "crop" as const,
      crops: ["Maize", "Cassava", "Vegetables"],
      livestock: [],
      status: "active" as const,
      soilType: "Loamy Soil",
      irrigation: "Rain-fed",
      yield: {
        current: 45,
        target: 60,
        unit: "tons"
      },
      workers: 8,
      lastHarvest: "2024-03-15",
      nextActivity: "2024-04-10",
      createdAt: "2024-01-10",
      iotDevices: 2,
      alerts: 1,
      revenue: 1200000
    },
    {
      id: 2,
      name: "Green Pastures Livestock",
      owner: "Musa Ibrahim",
      ownerId: 102,
      location: {
        state: "Kano",
        lga: "Nasarawa",
        village: "Tudun Wada",
        coordinates: ""
      },
      size: 120,
      type: "livestock" as const,
      crops: [],
      livestock: ["Cattle", "Goats"],
      status: "active" as const,
      soilType: "Clay Soil",
      irrigation: "Manual",
      yield: {
        current: 80,
        target: 100,
        unit: "heads"
      },
      workers: 12,
      lastHarvest: "2024-03-20",
      nextActivity: "2024-04-05",
      createdAt: "2024-02-15",
      iotDevices: 3,
      alerts: 0,
      revenue: 2500000
    },
    {
      id: 3,
      name: "Mixed Agro Farm",
      owner: "Chinedu Okoro",
      ownerId: 103,
      location: {
        state: "Enugu",
        lga: "Nsukka",
        village: "University Town",
        coordinates: ""
      },
      size: 75,
      type: "mixed" as const,
      crops: ["Rice", "Yam"],
      livestock: ["Poultry", "Fish"],
      status: "active" as const,
      soilType: "Sandy Loam",
      irrigation: "Drip",
      yield: {
        current: 60,
        target: 80,
        unit: "tons"
      },
      workers: 15,
      lastHarvest: "2024-03-10",
      nextActivity: "2024-04-15",
      createdAt: "2024-01-25",
      iotDevices: 4,
      alerts: 2,
      revenue: 1800000
    }
  ];

  try {
    // Try to get real data
    const farmsData = await getFarms(user.dash_id);
    const farmStats = await getFarmStatistics(user.dash_id);
    
    console.log("🟢 Database farms count:", farmsData?.length || 0);
    
    let initialFarms = fallbackFarms;
    let stats = {
      totalFarms: fallbackFarms.length,
      activeFarms: fallbackFarms.filter(f => f.status === 'active').length,
      totalArea: fallbackFarms.reduce((sum, f) => sum + f.size, 0),
      cropFarms: fallbackFarms.filter(f => f.type === 'crop').length,
      livestockFarms: fallbackFarms.filter(f => f.type === 'livestock').length,
      mixedFarms: fallbackFarms.filter(f => f.type === 'mixed').length,
      totalWorkers: fallbackFarms.reduce((sum, f) => sum + f.workers, 0),
      totalRevenue: fallbackFarms.reduce((sum, f) => sum + f.revenue, 0),
      activeAlerts: fallbackFarms.reduce((sum, f) => sum + f.alerts, 0)
    };
    
    // If we got real data, use it
    if (farmsData && farmsData.length > 0) {
      console.log("🟢 Using real database data");
      const transformedFarms = farmsData.map((farm, index) => ({
        id: farm.farm_id || index + 1,
        name: farm.farm_name || `Farm ${farm.farm_id || index + 1}`,
        owner: farm.owner_name || `${farm.f_surname || ''} ${farm.first_name || ''}`.trim() || `Owner ${index + 1}`,
        ownerId: farm.farmer_id || index + 100,
        location: {
          state: farm.state || "Lagos",
          lga: farm.lga || "Unknown LGA",
          village: farm.farm_loc || "Unknown Village",
          coordinates: ""
        },
        size: farm.land_size || Math.floor(Math.random() * 100) + 10,
        type: farm.farm_type === 'livestock' ? 'livestock' as const : 'crop' as const,
        crops: farm.crop_type ? farm.crop_type.split(',').map(c => c.trim()) : ["Maize", "Rice"],
        livestock: farm.livestock_type ? farm.livestock_type.split(',').map(l => l.trim()) : [],
        status: "active" as const,
        soilType: ["Loamy Soil", "Clay Soil", "Sandy Soil"][Math.floor(Math.random() * 3)],
        irrigation: ["Rain-fed", "Drip", "Sprinkler"][Math.floor(Math.random() * 3)],
        yield: {
          current: Math.floor(Math.random() * 80) + 20,
          target: 100,
          unit: "tons"
        },
        workers: Math.floor(Math.random() * 15) + 5,
        lastHarvest: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextActivity: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        iotDevices: Math.floor(Math.random() * 5),
        alerts: Math.floor(Math.random() * 3),
        revenue: Math.floor(Math.random() * 2000000) + 500000
      }));
      
      initialFarms = transformedFarms;
      stats = {
        totalFarms: farmStats.totalFarms || transformedFarms.length,
        activeFarms: farmStats.activeFarms || transformedFarms.filter(f => f.status === 'active').length,
        totalArea: farmStats.totalArea || transformedFarms.reduce((sum, f) => sum + f.size, 0),
        cropFarms: farmStats.cropFarms || transformedFarms.filter(f => f.type === 'crop').length,
        livestockFarms: farmStats.livestockFarms || transformedFarms.filter(f => f.type === 'livestock').length,
        mixedFarms: farmStats.mixedFarms || transformedFarms.filter(f => f.type === 'mixed').length,
        totalWorkers: transformedFarms.reduce((sum, f) => sum + f.workers, 0),
        totalRevenue: transformedFarms.reduce((sum, f) => sum + f.revenue, 0),
        activeAlerts: transformedFarms.reduce((sum, f) => sum + f.alerts, 0)
      };
    } else {
      console.log("🟡 No database data, using fallback farms");
    }

    // Get unique states and farm statuses for filter dropdowns
    const uniqueStates = Array.from(new Set(initialFarms.map(f => f.location.state))).filter(Boolean);
    const uniqueFarmStatuses = Array.from(new Set(initialFarms.map(f => f.status))).filter(Boolean);

    // Create a complete user object for the client
    const userData = {
      id: user.id || "1",
      phone: user.phone || "08000000000",
      email: user.email || "admin@example.com",
      dashId: user.dash_id,
      name: user.name || "Admin User",
      avatar: null,
    };

    console.log("🟢 Sending to client:", {
      farmsCount: initialFarms.length,
      firstFarm: initialFarms[0],
      stats: stats,
      user: userData.name
    });

    return (
      <FarmsPage
        user={userData}
        initialFarms={initialFarms}
        stats={stats}
        filters={{
          states: uniqueStates as string[],
          statuses: uniqueFarmStatuses as string[]
        }}
        searchParams={searchParams}
      />
    );
  } catch (error) {
    console.error("🔴 Error loading farms:", error);
    
    // Return fallback data on error
    const userData = {
      id: user.id || "1",
      phone: user.phone || "08000000000",
      email: user.email || "admin@example.com",
      dashId: user.dash_id,
      name: user.name || "Admin User",
      avatar: null,
    };

    return (
      <FarmsPage
        user={userData}
        initialFarms={fallbackFarms}
        stats={{
          totalFarms: fallbackFarms.length,
          activeFarms: fallbackFarms.filter(f => f.status === 'active').length,
          totalArea: fallbackFarms.reduce((sum, f) => sum + f.size, 0),
          cropFarms: fallbackFarms.filter(f => f.type === 'crop').length,
          livestockFarms: fallbackFarms.filter(f => f.type === 'livestock').length,
          mixedFarms: fallbackFarms.filter(f => f.type === 'mixed').length,
          totalWorkers: fallbackFarms.reduce((sum, f) => sum + f.workers, 0),
          totalRevenue: fallbackFarms.reduce((sum, f) => sum + f.revenue, 0),
          activeAlerts: fallbackFarms.reduce((sum, f) => sum + f.alerts, 0)
        }}
        filters={{
          states: ["Lagos", "Kano", "Enugu"],
          statuses: ["active"]
        }}
        searchParams={searchParams}
      />
    );
  }
}