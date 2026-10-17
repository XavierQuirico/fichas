import type { NextConfig } from 'next';
import { securityHeaders } from './lib/server/security-headers';

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({ development: process.env.NODE_ENV !== 'production' }),
      },
    ];
  },
};

export default nextConfig;
