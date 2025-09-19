import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbo: {
      rules: {
        '*.node': {
          loaders: ['ignore-loader'],
        },
      },
    },
  },
  // Only apply webpack config when not using Turbopack
  ...(process.env.TURBOPACK !== '1' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          child_process: false,
          net: false,
          tls: false,
          http2: false,
          os: false,
          path: false,
        };
      }
      return config;
    },
  }),
};

export default nextConfig;
