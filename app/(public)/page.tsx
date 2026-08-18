import { Button } from "@/components/ui/button";
import HeroSection from "@/features/home/components/hero-section";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-screen space-y-0">
      <HeroSection />
      <div className="w-full mt-4 min-h-screen">
        <div className="flex flex-col max-w-7xl w-full mx-auto p-4">
          <p className="text-sm font-bold tracking-wide text-primary">
            CCISLSG HUB
          </p>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-lg font-regular text-muted-foreground mt-2">
            Stay informed with the latest posts from your student government.
          </p>
        </div>
        <div className="flex max-w-7xl w-full mx-auto p-4 gap-4">
          <div className="w-[70%] h-[calc(100svh-10rem)] bg-accent"></div>
          <div className="w-[30%] h-[calc(100svh-10rem)] border border-border flex flex-col gap-4">
            <div className="flex flex-col bg-card rounded-xl h-64 p-4">
              <div className="flex justify-between w-full items-center">
                <p className="text-sm font-bold tracking-wide text-muted-foreground">
                  UPCOMING EVENTS
                </p>
                <Button variant="link">
                  <Link href="/events">
                    <div className="flex gap-2 items-center">
                      <p>View All</p>
                      <ExternalLink className="size-4" />
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col bg-card rounded-xl h-64 p-4">
              <div className="flex justify-between w-full items-center">
                <p className="text-sm font-bold tracking-wide text-muted-foreground">
                  BULLETIN BOARD
                </p>
                <Button variant="link">
                  <Link href="/events">
                    <div className="flex gap-2 items-center">
                      <p>View All</p>
                      <ExternalLink className="size-4" />
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
