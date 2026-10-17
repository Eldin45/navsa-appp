// src/components/dashboard/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  TreePine,
  Building2,
  Truck,
  FileText,
  ClipboardList,
  Wifi,
  Brain,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingCart,
  Shield,
  HelpCircle,
  Activity,
  Target,
  Settings,
  Calendar,
  Wallet,
  HandCoins,
  Briefcase,
  Store,
  Cpu,
  UserCog,
  FileText as FileTextIcon,
  UsersRound,
  Leaf,
  Sprout,
  Droplets,
  Tractor,
  Coins,
  Banknote,
 

  Flame as FlameIcon,
  Fan,
  Lightbulb,
  
  Target as TargetIcon,
 
  Diamond as DiamondIcon,
  

  HandCoins as HandCoinsIcon,
  
  HandMetal as HandMetalIcon,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  subItems?: SubItem[];
}

interface SubItem {
  title: string;
  href: string;
  icon?: any;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Initialize expanded menus based on current path and localStorage
  useEffect(() => {
    const findParentMenuForCurrentPath = (): string[] => {
      const expanded: string[] = [];
      
      // Map of menu titles to their subpaths
      const menuPaths: Record<string, string[]> = {
        "Central Wallet": ["/dashboard/adopted-farmers", "/dashboard/farms"],
        "Cooperate account": ["/dashboard/cooperatives"],
        "Inventory Management": ["/dashboard/inventories"],
        "IoT & Controls": ["/dashboard/iot-controls", "/dashboard/iot-monitoring"],
        "NAVSA AI": ["/dashboard/farm-assistant", "/dashboard/learn"],
      };

      // Check which menu should be expanded based on current path
      for (const [menu, paths] of Object.entries(menuPaths)) {
        if (paths.some(path => pathname.startsWith(path))) {
          expanded.push(menu);
        }
      }

      // Always keep Dashboard expanded if we're on dashboard root
      if (pathname === "/dashboard" || pathname === "/dashboard/") {
        expanded.push("Dashboard");
      }

      return expanded;
    };

    // Load saved expanded menus from localStorage
    const loadExpandedMenus = () => {
      try {
        const saved = localStorage.getItem('sidebar_expandedMenus');
        if (saved) {
          const savedMenus = JSON.parse(saved);
          const pathBasedMenus = findParentMenuForCurrentPath();
          
          // Merge saved preferences with current path-based expansion
          // Priority: path-based expansion first, then saved preferences
          const allMenus = [...pathBasedMenus];
          savedMenus.forEach((menu: string) => {
            if (!allMenus.includes(menu)) {
              allMenus.push(menu);
            }
          });
          
          return allMenus;
        }
      } catch (error) {
        console.error("Failed to load sidebar state:", error);
      }
      
      // Default to path-based expansion if no saved state
      return findParentMenuForCurrentPath();
    };

    setExpandedMenus(loadExpandedMenus());
  }, [pathname]);

  // Save expanded menus to localStorage when they change
  useEffect(() => {
    if (expandedMenus.length > 0) {
      try {
        localStorage.setItem('sidebar_expandedMenus', JSON.stringify(expandedMenus));
      } catch (error) {
        console.error("Failed to save sidebar state:", error);
      }
    }
  }, [expandedMenus]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newExpanded = prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId];
      return newExpanded;
    });
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Adopted Farmers",
      icon: UsersRound,
      subItems: [
        { title: "Farmers", href: "/dashboard/adopted-farmers", icon: Users },
        { title: "Farms", href: "/dashboard/farms", icon: Tractor },
        { title: "Inputs Request", href: "/dashboard/inputs", icon: Package },
      ],
    },
    {
      title: "Central Wallet",
      icon: Wallet,
      subItems: [
        { title: "Account Info", href: "/dashboard/account", icon: Banknote },
        // { title: "Fund Cooperate Account", href: "/dashboard/farms", icon: HandCoins },
      ],
    },
    {
      title: "Cooperate account",
      icon: Briefcase,
      subItems: [
        { title: "Cooperatives", href: "/dashboard/cooperatives", icon: Building2 },
      ],
    },
    {
      title: "Suppliers",
      icon: Store,
      subItems: [
        { title: "Inputs Suppliers", href: "/dashboard/suppliers", icon: Truck },
      ],
    },
    {
      title: "IoT & Controls",
      icon: Cpu,
      subItems: [
        { title: "Smart Farms", href: "/dashboard/smart-farms", icon: Wifi },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-gray-200 bg-white pt-16 transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="h-full overflow-y-auto px-3 pb-4">
          <div className="mb-6 mt-6">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400">
              Main Navigation
            </h2>
          </div>
          
          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.title);
              const isItemActive = item.href ? isActive(item.href) : false;
              const hasActiveChild = item.subItems?.some(subItem => isActive(subItem.href));
              const Icon = item.icon;

              return (
                <li key={item.title}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        onMouseEnter={() => setHoveredItem(item.title)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isExpanded || hasActiveChild
                            ? "bg-[#2e7d32]/10 text-[#2e7d32]"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        } ${
                          hoveredItem === item.title && !isExpanded && !hasActiveChild
                            ? "transform -translate-y-0.5 shadow-sm" 
                            : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                            isExpanded || hasActiveChild ? "text-[#2e7d32]" : "text-gray-700 dark:text-gray-400 group-hover:text-[#2e7d32]"
                          }`} />
                          <span>{item.title}</span>
                        </div>
                        {hasSubItems && (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-700" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-700" />
                          )
                        )}
                      </button>
                      
                      {isExpanded && (
                        <ul className="mt-1 space-y-1 pl-11">
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const active = isActive(subItem.href);
                            
                            return (
                              <li key={subItem.title}>
                                <Link
                                  href={subItem.href}
                                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 group ${
                                    active
                                      ? "bg-[#2e7d32]/10 text-[#2e7d32] font-medium"
                                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
                                  } ${
                                    !active && hoveredItem === `${item.title}-${subItem.title}` 
                                      ? "transform -translate-y-0.5" 
                                      : ""
                                  }`}
                                  onMouseEnter={() => setHoveredItem(`${item.title}-${subItem.title}`)}
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  {SubIcon && (
                                    <SubIcon className={`mr-2 h-4 w-4 transition-colors duration-200 ${
                                      active 
                                        ? 'text-[#2e7d32]' 
                                        : 'text-gray-400 group-hover:text-[#2e7d32]'
                                    }`} />
                                  )}
                                  {subItem.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      onMouseEnter={() => setHoveredItem(item.title)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                        isItemActive
                          ? "bg-[#2e7d32]/10 text-[#2e7d32]"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                      } ${
                        hoveredItem === item.title && !isItemActive 
                          ? "transform -translate-y-0.5 shadow-sm" 
                          : ""
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                        isItemActive ? "text-[#2e7d32]" : "text-gray-700 dark:text-gray-400 group-hover:text-[#2e7d32]"
                      }`} />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Settings Section */}
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
            <div className="mb-4 px-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400">
                Settings
              </h2>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/users"
                  onMouseEnter={() => setHoveredItem('help')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 group"
                >
                  <UserCog className="mr-3 h-5 w-5 text-gray-700 transition-colors duration-200 dark:text-gray-400 group-hover:text-[#2e7d32]" />
                  Admin Users
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/documentation"
                  onMouseEnter={() => setHoveredItem('documentation')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 group"
                >
                  <BookOpen className="mr-3 h-5 w-5 text-gray-700 transition-colors duration-200 dark:text-gray-400 group-hover:text-[#2e7d32]" />
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    );
  }

  // Mobile Sidebar
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 transition-opacity duration-200 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white pt-16 transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto px-3 pb-4">
          <div className="mb-6 mt-6">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400">
              Main Navigation
            </h2>
          </div>
          
          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.title);
              const isItemActive = item.href ? isActive(item.href) : false;
              const hasActiveChild = item.subItems?.some(subItem => isActive(subItem.href));
              const Icon = item.icon;

              return (
                <li key={item.title}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                          isExpanded || hasActiveChild
                            ? "bg-[#2e7d32]/10 text-[#2e7d32]"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`mr-3 h-5 w-5 ${
                            isExpanded || hasActiveChild ? "text-[#2e7d32]" : "text-gray-700 dark:text-gray-400"
                          }`} />
                          <span>{item.title}</span>
                        </div>
                        {hasSubItems && (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-700" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-700" />
                          )
                        )}
                      </button>
                      
                      {isExpanded && (
                        <ul className="mt-1 space-y-1 pl-11">
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const active = isActive(subItem.href);
                            
                            return (
                              <li key={subItem.title}>
                                <Link
                                  href={subItem.href}
                                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                                    active
                                      ? "bg-[#2e7d32]/10 text-[#2e7d32] font-medium"
                                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
                                  }`}
                                  onClick={onClose}
                                >
                                  {SubIcon && (
                                    <SubIcon className={`mr-2 h-4 w-4 ${
                                      active ? 'text-[#2e7d32]' : 'text-gray-400'
                                    }`} />
                                  )}
                                  {subItem.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                        isItemActive
                          ? "bg-[#2e7d32]/10 text-[#2e7d32]"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={onClose}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${
                        isItemActive ? "text-[#2e7d32]" : "text-gray-700 dark:text-gray-400"
                      }`} />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Settings Section for Mobile */}
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
            <div className="mb-4 px-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400">
                Settings
              </h2>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/users"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                  onClick={onClose}
                >
                  <UserCog className="mr-3 h-5 w-5 text-gray-700 dark:text-gray-400" />
                  Admin Users
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/documentation"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                  onClick={onClose}
                >
                  <BookOpen className="mr-3 h-5 w-5 text-gray-700 dark:text-gray-400" />
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}