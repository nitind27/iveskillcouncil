"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  title?: string;
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

// Default title mapping for common paths
const pathTitleMap: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  products: "Products",
  orders: "Orders",
  settings: "Settings",
  analytics: "Analytics",
  pages: "Pages",
  notifications: "Notifications",
  messages: "Messages",
  calendar: "Calendar",
  demo: "Component Demo",
  roles: "Roles & Permissions",
  categories: "Categories",
  general: "General Settings",
  security: "Security Settings",
  permissions: "Permissions",
  plans: "Subscription Plans",
  subscription: "Subscription",
  events: "Events",
  blogs: "Blogs",
  gallery: "Gallery",
  reports: "Reports",
  "my-course": "My Course",
  "my-fees": "My Fees",
  certificate: "Certificate",
  "assigned-students": "Assigned Students",
};

export default function Breadcrumb({
  items,
  title,
  className,
  showHome = true,
  separator,
}: BreadcrumbProps) {
  const pathname = usePathname();
  const pn = pathname || "";

  // Generate breadcrumb items from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = pn.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({
        label: "Home",
        href: "/",
        icon: <Home className="w-4 h-4" />,
      });
    }

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: pathTitleMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();
  const displayTitle = title || breadcrumbItems[breadcrumbItems.length - 1]?.label || "Page";

  const defaultSeparator = (
    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
  );

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700",
        "px-4 sm:px-6 py-4 mb-6",
        className
      )}
    >
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm mb-3 overflow-x-auto scrollbar-thin">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Separator = separator || defaultSeparator;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                  {Separator}
                </span>
              )}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                {item.icon && (
                  <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
                )}
                {isLast ? (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {displayTitle}
        </h1>
      </div>
    </div>
  );
}

