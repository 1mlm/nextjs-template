import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // every project bootstrapped from this template starts here — keep search
  // engines out until the real site is ready to be found. Delete once that's
  // actually the case
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
