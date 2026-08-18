"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PrintableAssetLabelsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Array<{
    tag: string;
    itemName: string;
    itemId: string;
    createdAt: string | Date;
    creatorLastName: string;
    datePurchased?: string | Date | null;
  }>;
}

export function PrintableAssetLabels({
  open,
  onOpenChange,
  assets = [],
}: PrintableAssetLabelsProps) {
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const formatDate = (d: any) => {
    if (!d) return "__/__/____";
    try {
      const date = new Date(d);
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch (e) {
      return "__/__/____";
    }
  };

  useEffect(() => {
    if (!open || assets.length === 0) return;

    const generateQRs = async () => {
      const urls: Record<string, string> = {};
      for (const asset of assets) {
        try {
          const url = await QRCode.toDataURL(asset.tag, {
            margin: 0,
            width: 180,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          urls[asset.tag] = url;
        } catch (err) {
          console.error(err);
        }
      }
      setQrUrls(urls);
    };

    generateQRs();
  }, [open, assets]);

  const handlePrint = useReactToPrint({
    contentRef,
  });

  // Chunk assets into pages of 4 items each (2x2 grid per landscape page)
  const pagedAssets = useMemo(() => {
    const pages: Array<typeof assets> = [];
    for (let i = 0; i < assets.length; i += 4) {
      pages.push(assets.slice(i, i + 4));
    }
    return pages;
  }, [assets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <DialogTitle className="text-lg font-bold">
              Print Asset Labels (Landscape)
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Optimized for standard A4 landscape sheets (2x2 grid &bull; 4 labels per page &bull; {assets.length} label{assets.length !== 1 ? "s" : ""} on {pagedAssets.length} page{pagedAssets.length !== 1 ? "s" : ""}).
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePrint()}
              size="sm"
              className="h-10 px-4 font-semibold gap-2"
            >
              <Printer className="size-4" />
              Print Labels
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-lg flex flex-col items-center gap-6">
          <div ref={contentRef} className="print-container flex flex-col gap-6">
            <style>{`
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 0mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .print-container {
                  gap: 0 !important;
                }
                .print-sheet {
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .print-sheet:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
              }
            `}</style>

            {pagedAssets.map((pageGroup, pageIndex) => (
              <div
                key={`page-${pageIndex}`}
                className="print-sheet bg-white text-black shadow-lg border overflow-hidden"
                style={{
                  width: "297mm",
                  height: "210mm",
                  padding: "10mm 12mm",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  className="grid grid-cols-2 gap-x-[10mm] gap-y-[10mm]"
                  style={{
                    width: "273mm",
                    height: "190mm",
                    fontFamily: "monospace",
                  }}
                >
                  {pageGroup.map((asset) => (
                    <div
                      key={asset.tag}
                      className="border-2 border-gray-500 flex flex-col justify-between bg-white overflow-hidden select-none rounded-xs"
                      style={{
                        width: "131.5mm",
                        height: "90mm",
                        boxSizing: "border-box",
                      }}
                    >
                      <img
                        src="/item-header.png"
                        alt="CCISLSG Header"
                        className="w-full h-auto object-contain shrink-0"
                      />

                      <div className="flex-1 min-h-0 flex items-center justify-between gap-4 p-[4mm]">
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full text-left">
                          <div>
                            <div className="text-[14px] font-black text-black uppercase leading-tight line-clamp-2">
                              ITEM NAME:{" "}
                              <span className="font-medium text-[13px]">
                                {asset.itemName}
                              </span>
                            </div>
                            <div className="text-[14px] font-black text-black font-mono leading-normal mt-1.5">
                              ITEM CODE:{" "}
                              <span className="font-semibold text-primary/90 bg-muted/50 px-1 rounded">
                                {asset.tag}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-gray-800 mt-2">
                              <div
                                className="gap-x-2 gap-y-1 leading-tight"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1.6fr 1fr",
                                }}
                              >
                                <div>
                                  <div className="text-[8px] text-black uppercase font-black tracking-tighter">
                                    Date Purchased
                                  </div>
                                  <div className="font-mono text-[9.5px] text-black mt-0.5 font-bold">
                                    {formatDate(asset.datePurchased)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-black uppercase font-black tracking-tighter">
                                    Recorded By
                                  </div>
                                  <div className="font-sans text-[9px] text-black mt-0.5 font-medium truncate">
                                    Property Custodian - {asset.creatorLastName || "Staff"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-black uppercase font-black tracking-tighter">
                                    Date Recorded
                                  </div>
                                  <div className="font-mono text-[9.5px] text-black mt-0.5 font-bold">
                                    {formatDate(asset.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-[9px] font-black text-center text-gray-700 mt-2 uppercase tracking-widest border-t pt-1 border-gray-300">
                              (DO NOT DETACH OR MUTILATE)
                            </div>
                          </div>
                        </div>

                        <div className="w-[34mm] h-[34mm] flex items-center justify-center shrink-0 border border-gray-300 p-1 rounded-xs bg-white">
                          {qrUrls[asset.tag] ? (
                            <img
                              src={qrUrls[asset.tag]}
                              alt={asset.tag}
                              className="w-full h-full"
                              style={{ imageRendering: "pixelated" }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted animate-pulse rounded" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
