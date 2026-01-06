import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource: any) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
  transpilePackages: ['@supabase/supabase-js'],
};

export default nextConfig;
