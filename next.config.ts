import type { NextConfig } from "next";

// Generate common IP ranges for mobile development
function generateDevOrigins() {
  const origins = ['localhost', '127.0.0.1', '0.0.0.0'];
  
  // Common router ranges
  const ranges = [
    '192.168.0', // Current mobile range
    '192.168.1', // Most common home range
    '192.168.2',
    '10.0.0',    // Corporate/advanced routers
    '10.0.1',
    '172.16.0'   // Less common but used
  ];
  
  // Add IP ranges (first 20 IPs in each range)
  ranges.forEach(range => {
    for (let i = 100; i <= 120; i++) {
      origins.push(`${range}.${i}`);
    }
  });
  
  return origins;
}

const nextConfig: NextConfig = {
  // @ts-ignore - allowedDevOrigins might not be in types yet but is supported  
  allowedDevOrigins: generateDevOrigins(),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
