"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/public/ccislsg_logo.png";
import Image from "next/image";
import SidebarItems from "./sidebar-items";
import { SidebarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader className="md:hidden flex justify-between">
        <div className="flex w-full items-center justify-between rounded-md">
          <div className="flex items-center gap-2">
            <Image src={logo} alt="CCISLSG Logo" className="size-12" />
            <div className="flex flex-col -space-y-3">
              <h1 className="font-black text-primary text-lg">CCISLSG</h1>
              <h1 className="font-black text-foreground text-lg">HUB</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <SidebarIcon />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full pr-2">
          <SidebarItems />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="hidden md:block">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              className="cursor-pointer"
            >
              <SidebarIcon className="size-4!" />
              <span>Collapse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
