import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Allow AI Studio preview and Cloud Run iframe origins to load /_next/* assets in dev mode
  allowedDevOrigins: [
    '**.run.app',
    '*.run.app',
    '**.googleusercontent.com',
    '*.googleusercontent.com',
    'aistudio.google.com',
    '**.aistudio.google.com',
    'localhost',
    '127.0.0.1',
  ],
  // Absolute root fixes the "turbopack.root should be absolute" warning.
  turbopack: { root: __dirname },
};

export default nextConfig;
