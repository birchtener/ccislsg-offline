import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.111.8.59", "10.13.117.192", "192.168.1.14"],
  // devIndicators: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
      "@base-ui/react",
      "@tanstack/react-table",
    ],
  },
};

export default nextConfig;
