import type { NextConfig } from "next";
// validates the env vars at build time too, not just on the first request
import "./src/env";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // bottom-left is where the sidebar's profile footer lives
  devIndicators: { position: "bottom-right" },
  // <ViewTransition> in layout.tsx no longer needs an experimental flag as of
  // Next.js 16.3 — it's unconditional now, the config option was removed
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
          // nothing here uses camera or location, a fork that needs one removes it. the microphone is on for this origin because VoiceButton needs it (a blank () blocks it even when the browser would allow it)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
