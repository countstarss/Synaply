import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing",
        permanent: false,
      },
      {
        source: "/en",
        destination: "/landing",
        permanent: false,
      },
      {
        source: "/:locale(zh|ko|ja)",
        destination: "/:locale/landing",
        permanent: false,
      },
    ];
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
