import { ImageResponse } from "next/og";
import { drawAppIcon } from "./_sidebar/drawAppIcon";

// the tab icon, drawn from the same gift as the sidebar so they never drift
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(drawAppIcon(size.width), size);
}
