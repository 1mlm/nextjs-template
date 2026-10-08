import { ImageResponse } from "next/og";
import { drawPaddedAppIcon } from "./_sidebar/drawAppIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(drawPaddedAppIcon(size.width, 0.7), size);
}
