"use client";

import * as React from "react";
import {
  ChevronRight,
  Boxes,
  Calendars,
  Folders,
  LayoutDashboard,
  LucideIcon,
  Megaphone,
  MessageSquareText,
  OctagonX,
  Pin,
  ScrollText,
  ShieldUser,
  SidebarIcon,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/lib/auth-client";

interface SidebarItem {
  label: string;
  icon?: LucideIcon;
  url?: string;
  permissions?: string[];
  items?: SidebarItem[];
}

interface SidebarCategory {
  label: string;
  permissions?: string[];
  items: SidebarItem[];
}

const SidebarItemsData: SidebarCategory[] = [
  {
    label: "General",
    permissions: [],
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        url: "/dashboard",
        permissions: [],
      },
      {
        label: "Profile",
        icon: User,
        url: "/dashboard/profile",
        permissions: [],
      },
    ],
  },
  {
    label: "Operations & Finance",
    permissions: [],
    items: [
      {
        label: "Payments",
        icon: Wallet,
        permissions: ["payment:read", "item:read", "payment:collect"],
        items: [
          {
            label: "Items",
            url: "/dashboard/payments/items",
            permissions: ["item:read"],
          },
          {
            label: "Transactions",
            url: "/dashboard/payments/transactions",
            permissions: ["payment:read", "payment:collect"],
          },
          {
            label: "Analytics",
            url: "/dashboard/payments/analytics",
            permissions: ["payment:read"],
          },
          {
            label: "Logs",
            url: "/dashboard/payments/logs",
            permissions: ["payment:read"],
          },
        ],
      },
      {
        label: "Inventory",
        icon: Boxes,
        permissions: ["inventory:read", "lost-found:read", "auditlog:read"],
        items: [
          {
            label: "Items",
            url: "/dashboard/inventory/items",
            permissions: ["inventory:read"],
          },
          {
            label: "Item Categories",
            url: "/dashboard/inventory/categories",
            permissions: ["inventory:read"],
          },
          {
            label: "Borrows",
            url: "/dashboard/inventory/borrows",
            permissions: ["inventory:read"],
          },
          {
            label: "Lost & Found",
            url: "/dashboard/inventory/lost-found",
            permissions: ["lost-found:read"],
          },
          {
            label: "Logs",
            url: "/dashboard/inventory/logs",
            permissions: ["auditlog:read"],
          },
        ],
      },
    ],
  },
  {
    label: "Student Services",
    permissions: [],
    items: [
      {
        label: "Student Master List",
        icon: Users,
        url: "/dashboard/master-list",
        permissions: ["students:read"],
      },
      {
        label: "Attendance",
        icon: ScrollText,
        permissions: ["attendance:manage", "attendance:scan", "auditlog:read"],
        items: [
          {
            label: "Events",
            url: "/dashboard/attendance/events",
            permissions: ["attendance:manage"],
          },
          {
            label: "Scan",
            url: "/dashboard/attendance/scan",
            permissions: ["attendance:scan"],
          },
          {
            label: "Logs",
            url: "/dashboard/attendance/logs",
            permissions: ["auditlog:read"],
          },
        ],
      },
      {
        label: "Clearance",
        icon: OctagonX,
        permissions: ["clearance:read"],
        items: [
          {
            label: "List",
            url: "/dashboard/clearance/list",
            permissions: ["clearance:read"],
          },
          {
            label: "Sanctions",
            url: "/dashboard/clearance/sanctions",
            permissions: ["clearance:read"],
          },
        ],
      },
      {
        label: "Feedback",
        icon: MessageSquareText,
        permissions: ["feedback:view"],
        url: "/dashboard/feedback",
      },
    ],
  },
  {
    label: "CMS",
    permissions: [],
    items: [
      {
        label: "Announcements",
        icon: Megaphone,
        permissions: ["post:read"],
        url: "/dashboard/announcements",
      },
      {
        label: "Events",
        icon: Calendars,
        permissions: ["post:read"],
        url: "/dashboard/events",
      },
      {
        label: "Projects",
        icon: Folders,
        permissions: ["post:read"],
        url: "/dashboard/projects",
      },
      {
        label: "Bulletin Board",
        icon: Pin,
        permissions: ["post:read"],
        url: "/dashboard/bulletin",
      },
    ],
  },
  {
    label: "Admin",
    permissions: [],
    items: [
      {
        label: "Users",
        icon: Users,
        url: "/dashboard/users",
        permissions: ["users:read"],
      },
      {
        label: "Roles & Permissions",
        icon: ShieldUser,
        url: "/dashboard/roles",
        permissions: ["roles:manage"],
      },
      {
        label: "Audit Logs",
        icon: ScrollText,
        url: "/dashboard/audit-logs",
        permissions: ["auditlog:read"],
      },
    ],
  },
];

export default function SidebarItems() {
  const { data: session } = authClient.useSession();
  const userPermissions = session?.user?.permissions ?? [];

  const checkItemVisibility = (item: SidebarItem): boolean => {
    if (item.items) {
      const visibleChildren: SidebarItem[] = item.items.filter((child) =>
        checkItemVisibility(child),
      );
      return visibleChildren.length > 0;
    }
    if (item.permissions && item.permissions.length > 0) {
      return item.permissions.some((p) => userPermissions.includes(p));
    }
    return true;
  };

  const checkCategoryVisibility = (category: SidebarCategory) => {
    if (category.permissions && category.permissions.length > 0) {
      if (!category.permissions.some((p) => userPermissions.includes(p))) {
        return false;
      }
    }
    const visibleItems = category.items.filter((item) =>
      checkItemVisibility(item),
    );
    return visibleItems.length > 0;
  };

  return (
    <div>
      {SidebarItemsData.filter(checkCategoryVisibility).map(
        (category, index) => {
          return (
            <SidebarGroup key={index}>
              <SidebarGroupLabel>{category.label}</SidebarGroupLabel>
              <SidebarMenu className="space-y-2">
                {category.items.filter(checkItemVisibility).map((item) => (
                  <SidebarItem
                    key={item.url || item.label}
                    item={item}
                    category={category}
                    userPermissions={userPermissions}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          );
        },
      )}
    </div>
  );
}

function SidebarItem({
  item,
  category,
  userPermissions,
}: {
  item: SidebarItem;
  category: SidebarCategory;
  userPermissions: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  if (item.items) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <SidebarMenuItem>
          <CollapsibleTrigger
            className="w-full"
            render={
              <SidebarMenuButton
                id={`sidebar-${category.label}-${item.label}`}
                tooltip={item.label}
                isActive={open}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
              >
                {item.icon && <item.icon />}
                <span>{item.label}</span>
                <ChevronRight
                  className={cn(
                    "ml-auto transition-transform duration-200",
                    open && "rotate-90",
                  )}
                />
              </SidebarMenuButton>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub className="me-0 pe-0">
              {item.items
                .filter((child) => {
                  if (child.permissions && child.permissions.length > 0) {
                    return child.permissions.some((p) =>
                      userPermissions.includes(p),
                    );
                  }
                  return true;
                })
                .map((child, id) => {
                  return (
                    <SidebarMenuSubItem
                      key={child.url || child.label || id}
                      className="w-full"
                    >
                      <SidebarMenuSubButton
                        id={`sidebar-sub-${category.label}-${item.label}-${child.label}`}
                        className={cn(
                          "w-full rounded-md transition-colors",
                          pathname.includes(child.url!) &&
                            child.url !== "/dashboard"
                            ? "bg-primary! text-foreground!"
                            : "",
                        )}
                        isActive={
                          pathname.includes(child.url!) &&
                          child.url !== "/dashboard"
                        }
                        onClick={() => {
                          router.push(child.url!);
                        }}
                        render={<span>{child.label}</span>}
                      />
                    </SidebarMenuSubItem>
                  );
                })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        id={`sidebar-${category.label}-${item.label}`}
        tooltip={item.label}
        isActive={
          (pathname.includes(item.url!) && item.url !== "/dashboard") ||
          (item.url === "/dashboard" && pathname === "/dashboard")
        }
        onClick={() => router.push(item.url!)}
        className={cn(
          "rounded-md text-sm font-medium px-3 py-2.5 h-10 transition-colors cursor-pointer",
          pathname.includes(item.url!) && item.url !== "/dashboard"
            ? "bg-primary! text-foreground!"
            : "",
          item.url === "/dashboard" && pathname === "/dashboard"
            ? "bg-primary! text-foreground!"
            : "",
        )}
      >
        {item.icon && <item.icon />}
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
