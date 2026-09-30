/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // allow larger CSV/Excel uploads
    },
  },
};

export default nextConfig;
