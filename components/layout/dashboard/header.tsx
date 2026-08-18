"use client";

import { ThemeToggleButton } from "../toggle-theme";
import type { Session } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import logo from "@/public/ccislsg_logo.png";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";
import NavUser from "@/components/layout/dashboard/nav-user";
import Link from "next/link";
export default function DashboardHeader({ user }: { user: Session["user"] }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden block hover:bg-transparent"
          onClick={() => toggleSidebar()}
        >
          <Menu />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2 font-medium">
          <div className="flex size-12 items-center justify-center rounded-md">
            <Image src={logo} alt="CCISLSG Logo" />
          </div>
          <div className="flex flex-col -space-y-3">
            <h1 className="font-black text-primary text-lg">CCISLSG</h1>
            <h1 className="font-black text-foreground text-lg">HUB</h1>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-4 px-4">
        <ThemeToggleButton className="size-6" />
        <NavUser user={user} />
      </div>
    </header>
  );
}
