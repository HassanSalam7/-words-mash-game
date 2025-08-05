import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - allowedDevOrigins might not be in types yet but is supported
  allowedDevOrigins: [
    '192.168.0.115',
    '192.168.0.108',
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ]
};

export default nextConfig;
