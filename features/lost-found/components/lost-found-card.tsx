"use client";

import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Image as ImageIcon, Eye } from "lucide-react";
import { LostFoundItemWithImages, LostFoundStatus } from "../types/lost-found";

interface LostFoundCardProps {
  item: LostFoundItemWithImages;
  onViewDetails: (item: LostFoundItemWithImages) => void;
}

export function LostFoundCard({ item, onViewDetails }: LostFoundCardProps) {
  const isClaimed = item.status === LostFoundStatus.CLAIMED;
  const primaryImage = item.images?.[0]?.image_url;

  return (
    <div
      onClick={() => onViewDetails(item)}
      className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col h-full"
    >
      {/* Aspect Video Image Container */}
      <div className="relative aspect-video w-full bg-black/80 overflow-hidden flex items-center justify-center">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <span className="text-[11px]">No Photo</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge
            className={
              isClaimed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                : "bg-amber-500 text-black font-bold text-[11px] shadow-xs"
            }
          >
            {isClaimed ? "CLAIMED" : "UNCLAIMED"}
          </Badge>
        </div>

        {/* Image Count Badge if multiple */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> {item.images.length} photos
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer Meta */}
        <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{item.location_found || "Location unspecified"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{item.date_found ? format(new Date(item.date_found), "MMM d, yyyy") : "N/A"}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 gap-1 text-primary group-hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(item);
              }}
            >
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
