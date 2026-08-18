import { Button } from "@/components/ui/button";
import { checkPermission } from "@/features/auth/lib/permissions";
import HeroSection from "@/features/home/components/hero-section";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const { user } = await checkPermission();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}
