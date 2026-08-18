"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCw, ZoomIn, ZoomOut, Crop, Move } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number; // width / height ratio, default 16/9
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageSrc(null);
    }
  }, [imageFile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = useCallback(() => {
    if (!imageRef.current || !imageFile) return;

    const img = imageRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Target output dimensions (1280x720 for 16:9)
    const targetWidth = 1280;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    
    // Fill canvas background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();
    // Center of canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Scaling factor from crop preview container to export canvas
    const scaleFactor = targetWidth / containerRect.width;

    // Apply translation from user pan adjusted by scaleFactor
    ctx.translate(position.x * scaleFactor, position.y * scaleFactor);

    // Draw scaled image
    const drawnWidth = containerRect.width * zoom * scaleFactor;
    const drawnHeight = (containerRect.width / (img.naturalWidth / img.naturalHeight)) * zoom * scaleFactor;

    ctx.drawImage(
      img,
      -drawnWidth / 2,
      -drawnHeight / 2,
      drawnWidth,
      drawnHeight
    );

    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File(
        [blob],
        imageFile.name.replace(/\.[^/.]+$/, "") + "_cropped.jpg",
        { type: "image/jpeg" }
      );
      onCropComplete(croppedFile);
      onClose();
    }, "image/jpeg", 0.92);
  }, [imageFile, aspectRatio, rotation, position, zoom, onCropComplete, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[95vw] rounded-xl p-4 sm:p-6 bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Crop className="w-5 h-5 text-primary" />
            Adjust & Crop Image (16:9 Ratio)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Crop Container */}
          <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black/90 rounded-lg overflow-hidden cursor-move flex items-center justify-center border border-border select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="absolute transition-transform duration-75 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none h-auto object-contain pointer-events-none"
                style={{ width: "100%", maxHeight: "100%" }}
              />
            </div>

            {/* Overlay grid lines for crop guide */}
            <div className="absolute inset-0 pointer-events-none border-2 border-primary/60 rounded-lg">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>

            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-xs pointer-events-none">
              <Move className="w-3 h-3" /> Drag to adjust position
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3 bg-muted/30 p-3 rounded-lg border">
            {/* Zoom Range Input */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono w-10 text-right">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Rotation Button */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Orientation</span>
              <Button
                type="button"
                variant="outline"
                onClick={handleRotate}
                className="h-13.5 px-4 gap-1.5 text-xs font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate 90° ({rotation}°)
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="h-13.5 px-4 text-sm">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="h-13.5 px-4 text-sm gap-1.5 font-semibold">
            <Crop className="w-4 h-4" />
            Apply & Crop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
