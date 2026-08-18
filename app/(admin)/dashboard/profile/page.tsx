import { auth } from "@/features/auth/lib/auth";
import { User } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfileForm from "@/features/profile/components/profile-form";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function DashboardProfile() {
  const { authorized, user } = await checkPermission();

  if (!authorized || !user) {
    return redirect("/sign-in");
  }

  return (
    <main className="w-full space-y-4">
      <PageTitle
        icon={User}
        title="Profile"
        desc="Manage your profile information and settings"
      />

      <ProfileForm user={user!} />
    </main>
  );
}
