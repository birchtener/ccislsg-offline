"use client";

import "@/lib/zxing-setup";
import React from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface FullScreenScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
}

export default function FullScreenScanner({
  onScan,
  onClose,
}: FullScreenScannerProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-linear-to-b from-black/80 to-transparent">
        <h2 className="text-white font-semibold text-lg">Scan QR Code</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 backdrop-blur-sm"
          >
            ✕
          </button>
        )}
      </div>

      <div className="relative w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full">
        <Scanner
          allowMultiple={true}
          scanDelay={1500}
          onScan={(result) => {
            if (result && result.length > 0) {
              onScan(result[0].rawValue);
            }
          }}
          constraints={{
            facingMode: "environment",
          }}
          components={{
            finder: true,
            torch: true,
          }}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { width: "100%", height: "100%", objectFit: "cover" },
          }}
        />
      </div>
    </div>
  );
}
