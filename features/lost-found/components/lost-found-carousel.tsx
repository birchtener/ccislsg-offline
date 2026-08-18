"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Image as ImageIcon } from "lucide-react";

interface LostFoundCarouselProps {
  images: { id?: string; image_url: string }[];
  title?: string;
  className?: string;
}

export function LostFoundCarousel({
  images,
  title = "Item image",
  className,
}: LostFoundCarouselProps) {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi.scrollTo(index);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, onSelect]);

  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          "w-full aspect-video bg-muted/50 rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2 p-6",
          className
        )}
      >
        <ImageIcon className="w-10 h-10 opacity-40" />
        <span className="text-xs font-medium">No images uploaded</span>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Main Image Viewport */}
      <Carousel setApi={setMainApi} className="w-full relative group">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={img.id || index}>
              <div className="bg-black/90 relative aspect-video overflow-hidden rounded-xl border border-border flex items-center justify-center">
                <img
                  src={img.image_url}
                  alt={`${title} - image ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </Carousel>

      {/* Thumbnail Navigation Bar */}
      {images.length > 1 && (
        <Carousel
          setApi={setThumbApi}
          opts={{
            containScroll: "keepSnaps",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 flex-row">
            {images.map((img, index) => (
              <CarouselItem
                key={img.id || index}
                className="basis-1/4 cursor-pointer pl-2 sm:basis-1/5 md:basis-1/6"
                onClick={() => onThumbClick(index)}
              >
                <div
                  className={cn(
                    "relative aspect-video overflow-hidden rounded-md border-2 transition-all bg-black/60",
                    index === selectedIndex
                      ? "border-primary opacity-100 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  <img
                    src={img.image_url}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  );
}
