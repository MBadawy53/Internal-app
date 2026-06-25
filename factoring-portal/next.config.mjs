/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the Docker image.
  output: 'standalone',
  // The ported engine (src/lib/portal/engine.js) is legacy DOM code with its
  // own eslint-disable header; don't block production builds on linting it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
