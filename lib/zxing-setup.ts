"use client";

import { setZXingModuleOverrides } from "barcode-detector/ponyfill";

// Direct barcode-detector / zxing-wasm to load WebAssembly files locally from /public/wasm/
// to prevent cross-origin fetch failures and enable offline support.
if (typeof window !== "undefined") {
  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) => {
      if (path.endsWith(".wasm")) {
        return `/wasm/${path}`;
      }
      return prefix + path;
    },
  });
}
