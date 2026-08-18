import Link from "next/link";
import { Button } from "@/components/ui/button";
import LostSprite from "@/public/sprite/lost.png";
import Image from "next/image";
import { AnimatedGridPattern } from "@/components/ui/background/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function NotFound() {
  const { user } = await checkPermission();

  return (
    <div className="flex h-screen flex-col items-center overflow-hidden justify-center bg-background px-4 text-center relative">
      <div className="space-y-4 max-w-md z-1">
        {/* Status Code / Accent */}

        <div className="w-full flex justify-center">
          <Image src={LostSprite} alt="Lost Sprite" className="size-64" />
        </div>

        <p className="text-6xl font-extrabold tracking-tight text-primary">
          404
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-sm sm:text-base">
          Sorry, we couldn’t find the page you’re looking for. It might have
          been moved, deleted, or never existed.
        </p>

        {/* Action Button */}
        <div className="pt-4 flex gap-4 justify-center">
          <Button variant="default" size="lg" className="py-6 px-12">
            <Link href="/">Return to Home</Link>
          </Button>
          {user && (
            <Button variant="outline" size="lg" className="py-6 px-12">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="absolute top-0 left-0 size-full z-0">
        <AnimatedGridPattern
          numSquares={15}
          width={60}
          height={60}
          maxOpacity={0.2}
          duration={3}
          repeatDelay={1}
          className={cn(
            "mask-[radial-gradient(800px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%]",
          )}
        />
      </div>
    </div>
  );
}
