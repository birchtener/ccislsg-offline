"use client";

import { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface AssetScannerProps {
  onScanSuccess: (scannedValue: string) => void;
}

function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn("Audio block/error:", e);
  }
}

export function AssetScanner({ onScanSuccess }: AssetScannerProps) {
  const [manualInput, setManualInput] = useState("");

  const handleScan = useCallback(
    (result: string) => {
      if (!result) return;
      playScanBeep();
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      onScanSuccess(result);
    },
    [onScanSuccess]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video md:aspect-[4/3] max-h-[320px] overflow-hidden rounded-xl border bg-black shadow-inner flex items-center justify-center">
        <Scanner
          onScan={(result) => {
            if (result && result.length > 0) {
              handleScan(result[0].rawValue);
            }
          }}
          constraints={{
            facingMode: "environment",
          }}
          components={{
            finder: false,
            torch: true,
          }}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { width: "100%", height: "100%", objectFit: "cover" },
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-40 h-40 border-2 border-dashed border-white/40 rounded-lg relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white -mt-0.5 -ml-0.5" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white -mt-0.5 -mr-0.5" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white -mb-0.5 -ml-0.5" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white -mb-0.5 -mr-0.5" />
          </div>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <Label htmlFor="manual-tag-input" className="text-xs font-semibold">
          Or Enter Asset Tag Manually
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="manual-tag-input"
              placeholder="e.g. CCISLSG-PROP-2026-0001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="h-13.5 pl-9 pr-3"
            />
          </div>
          <Button type="submit" size="sm" className="h-13.5 px-3">
            Verify
          </Button>
        </div>
      </form>
    </div>
  );
}