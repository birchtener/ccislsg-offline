"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/public/ccislsg_logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Calendars,
  FolderOpen,
  Home,
  Info,
  Menu,
  UsersRound,
} from "lucide-react";
import { ThemeToggleButton, MobileThemeToggleButton } from "../toggle-theme";
import { motion } from "framer-motion";

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: <Home /> },
    { href: "/about", label: "About", icon: <Info /> },
    { href: "/projects", label: "Projects", icon: <FolderOpen /> },
    { href: "/events", label: "Events", icon: <Calendars /> },
  ];

  const path = usePathname();
  return (
    <header
      className={`fixed top-0 left-0 right-0 border-b border-border flex-col z-30 transition-all bg-background duration-300 backdrop-blur-xs ${
        openMenu ? "h-svh overflow-hidden" : "h-16"
      }`}
    >
      <div className="mx-auto h-16 flex justify-between items-center max-w-7xl w-full px-4">
        <div className="flex items-center gap-2">
          <Image src={logo} alt="CCISLSG Logo" width={40} height={40} />
          <div className="flex flex-col -space-y-3">
            <h1 className="font-black text-primary text-lg">CCISLSG</h1>
            <h1 className="font-black text-foreground text-lg">HUB</h1>
          </div>
        </div>
        <div className="block md:hidden">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpenMenu(!openMenu)}
            className="relative h-10 w-8 hover:bg-transparent bg-transparent"
            aria-label="Toggle Menu"
          >
            <div className="absolute left-1/2 top-1/2 w-8 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1.5 text-foreground">
              <motion.span
                animate={openMenu ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.4 }}
                className="h-0.5 w-full bg-current origin-center"
              />
              <motion.span
                animate={
                  openMenu ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.4 }}
                className="h-0.5 w-full bg-current origin-center"
              />
            </div>
          </Button>
        </div>
        <div className="gap-6 items-center hidden md:flex">
          <nav>
            <ul className="flex gap-8 text-md font-medium text-foreground">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "transition-colors",
                      path === link.href
                        ? "text-primary"
                        : "hover:text-primary",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggleButton className="size-6 ml-6" />
          <div>
            <Button size="lg">
              <Link href="student-hub">Student Hub</Link>
            </Button>
          </div>
        </div>
      </div>
      {openMenu && (
        <div className="flex flex-col md:hidden p-4 h-[calc(100svh-4rem)] justify-between">
          <div className="flex flex-col">
            <div className="text-muted-foreground tracking-widest text-sm">
              NAVIGATION
            </div>
            <nav>
              <ul className="flex flex-col mt-4 gap-4 font-medium text-foreground">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "transition-colors text-lg font-medium",
                        path === link.href ? "text-primary" : "",
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                          "w-full justify-start py-6 px-4",
                          path === link.href
                            ? "bg-primary/10 border-primary"
                            : "",
                        )}
                        onClick={() => setOpenMenu(false)}
                      >
                        <div className="flex items-center gap-2">
                          {link.icon}
                          {link.label}
                        </div>
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="text-muted-foreground tracking-widest text-sm mt-4">
              SYSTEM
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium w-full justify-between px-4">
              Toggle Dark Mode
              <MobileThemeToggleButton />
            </div>
          </div>
          <div className="w-full flex flex-col">
            <Link href="student-hub">
              <Button size="lg" className="w-full py-6">
                <div className="flex gap-2 items-center">
                  <UsersRound />
                  Student Hub
                </div>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
