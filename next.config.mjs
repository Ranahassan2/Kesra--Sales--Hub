/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14: externalize server-only packages from client bundle
    serverComponentsExternalPackages: [
      "whatsapp-web.js",
      "puppeteer",
      "puppeteer-core",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { isServer }) => {
    // Prevent webpack from bundling Node.js-only packages on any side
    config.externals = [
      ...(config.externals || []),
      "whatsapp-web.js",
      "puppeteer",
      "@aws-sdk/client-s3",
      "fluent-ffmpeg",
    ];
    return config;
  },
};

export default nextConfig;
