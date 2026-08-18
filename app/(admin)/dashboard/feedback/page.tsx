import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function FeedbackPage() {
  const { authorized, user } = await checkPermission("feedback:view");

  if (!authorized || !user) {
    return redirect("/unauthorized");
  }

  return (
    <main className="w-full space-y-6 text-left">
      <PageTitle
        icon={MessageSquareText}
        title="Student Feedback"
        desc="Review student feedback submissions, complaints, and general inquiries"
      />
      <div className="border border-dashed p-12 text-center rounded-lg bg-background flex flex-col items-center justify-center">
        <MessageSquareText className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-semibold">No feedback submissions yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Submissions from the public and student hub will appear here once submitted.
        </p>
      </div>
    </main>
  );
}
