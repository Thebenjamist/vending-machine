import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In-memory machine state must not be statically cached across requests.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
