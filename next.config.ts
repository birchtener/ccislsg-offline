import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.111.11.44", "10.13.117.192"],
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
