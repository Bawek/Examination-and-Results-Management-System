import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_PORT = process.env.API_PORT || '4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Absolute root fixes the "turbopack.root should be absolute" warning.
  turbopack: { root: __dirname },
  // Browser talks only to Next.js (same origin => cookies + CSRF just work);
  // Next forwards /api/* to the Express API on localhost.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `http://127.0.0.1:${API_PORT}/api/:path*` }];
  },
};

export default nextConfig;
