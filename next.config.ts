import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // domains: ["your-external-image-source.com"], // Replace with actual domains
    formats: ["image/avif", "image/webp"], // Enables modern formats for better performance
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows all external images (modify for security)
      },
    ],
  },
};

export default nextConfig;
