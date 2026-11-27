import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Absolute root fixes the "turbopack.root should be absolute" warning.
  turbopack: { root: __dirname },
  // Fullstack Next.js - API routes handled internally
};

export default nextConfig;
