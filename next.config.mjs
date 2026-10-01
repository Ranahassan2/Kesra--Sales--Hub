/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["whatsapp-web.js", "puppeteer"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // whatsapp-web.js uses @aws-sdk/client-s3 only in RemoteAuth which we don't use
      config.externals = [...(config.externals || []), "@aws-sdk/client-s3", "fluent-ffmpeg"];
    }
    return config;
  },
};

export default nextConfig;
