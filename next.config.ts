import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // lets <ViewTransition> in layout.tsx animate route changes
    viewTransition: true,
  },
  // opening the dev server through a tunnel on a phone, without these the
  // page loads but hot reload and server actions get blocked
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "*.loca.lt",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // every project bootstrapped from this template starts here, keep
          // search engines out until the real site is ready to be found.
          // delete once that's actually the case
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // nothing here uses these, a fork that needs one removes it
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
