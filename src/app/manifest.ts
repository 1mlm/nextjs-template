import type { MetadataRoute } from "next";
import { APP_INFO } from "./_sidebar/nav";

// makes the app installable (add to home screen), it then opens in its own
// window without browser chrome. icons come from app-icon/[size]
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_INFO.name,
    short_name: APP_INFO.name,
    description: APP_INFO.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [192, 512].map((size) => ({
      src: `/app-icon/${size}`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
  };
}
