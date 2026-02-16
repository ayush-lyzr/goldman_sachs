import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Externalize mongoose and mongodb for serverless compatibility
  serverExternalPackages: ["mongodb", "mongoose"],
};

export default nextConfig;
