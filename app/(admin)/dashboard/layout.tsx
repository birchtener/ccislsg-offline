import DashboardHeader from "@/components/layout/dashboard/header";
import DashboardSidebar from "@/components/layout/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { checkPermission } from "@/features/auth/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await checkPermission();

  if (!user) {
    redirect("/sign-in");
    return null;
  }

  return (
    <div className="[--header-height:calc(--spacing(16))]">
      <SidebarProvider className="flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar />
          <SidebarInset className="max-w-6xl w-full mx-auto p-4 md:pt-12">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
