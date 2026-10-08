import type { MetadataRoute } from "next";
import { APP_INFO } from "./_sidebar/nav";
import { APP_SHORTCUTS } from "./_sidebar/shortcuts";

// chrome's install dialog shows these like a store page
const SCREENSHOTS = [
  { file: "wide-showcase", label: "The showcase", form_factor: "wide" },
  { file: "wide-table", label: "The table", form_factor: "wide" },
  { file: "narrow-showcase", label: "The showcase", form_factor: "narrow" },
  { file: "narrow-table", label: "The table", form_factor: "narrow" },
] as const;

// makes the app installable (add to home screen), it then opens in its own
// window without browser chrome. icons come from app-icon/[name]
export default function manifest(): MetadataRoute.Manifest {
  return {
    // id pins the app's identity to start_url, changing it later would make
    // every existing install a different app
    id: "/showcase",
    name: APP_INFO.name,
    short_name: APP_INFO.name,
    description: APP_INFO.description,
    lang: "en",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    start_url: "/showcase",
    scope: "/",
    display: "standalone",
    // opening the app again (icon, shortcut, a link) reuses the window
    // that's already open instead of stacking a second one
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      ...[192, 512].map((size) => ({
        src: `/app-icon/${size}`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/app-icon/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: APP_SHORTCUTS.map(({ label, href, concept }) => ({
      name: label,
      url: href,
      icons: [
        { src: `/app-icon/${concept}`, sizes: "192x192", type: "image/png" },
      ],
    })),
    screenshots: SCREENSHOTS.map(({ file, label, form_factor }) => ({
      src: `/screenshots/${file}.png`,
      sizes: form_factor === "wide" ? "2560x1600" : "1170x2532",
      type: "image/png",
      form_factor,
      label,
    })),
  };
}
