import LoginForm from "@/features/auth/components/login-form";
import { AnimatedGridPattern } from "@/components/ui/background/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { checkPermission } from "@/features/auth/lib/permissions";
import { redirect } from "next/navigation";
export default async function LoginPage() {
  const { user } = await checkPermission();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center relative">
      <div className="w-full h-screen overflow-hidden absolute top-0 left-0 z-0">
        <AnimatedGridPattern
          numSquares={15}
          width={60}
          height={60}
          maxOpacity={0.2}
          duration={3}
          repeatDelay={1}
          className={cn(
            "mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%]",
          )}
        />
      </div>
      <LoginForm />
    </div>
  );
}
