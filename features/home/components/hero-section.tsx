import Aurora from "@/components/ui/background/aurora";
import { AnimatedGridPattern } from "@/components/ui/background/animated-grid-pattern";
import { cn } from "@/lib/utils";
export default function HeroSection() {
  return (
    <section className="w-full h-screen relative overflow-hidden">
      {/* <div className="absolute top-0 left-0 size-full z-0">
        <Aurora
          colorStops={["#F47920", "#FBC623", "#F79816"]}
          blend={0.5}
          amplitude={0.8}
          speed={0.5}
        />
      </div> */}
      <div className="absolute top-0 left-0 size-full z-1">
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
      <div className="max-w-7xl mx-auto p-4 relative h-full"></div>
    </section>
  );
}
