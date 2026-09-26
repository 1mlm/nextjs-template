import { ImageResponse } from "next/og";
import { drawAppIcon } from "../../_sidebar/drawAppIcon";

// the manifest's install icons, /app-icon/192 and /app-icon/512
const ICON_SIZES = [192, 512];

export const generateStaticParams = () =>
  ICON_SIZES.map((size) => ({ size: String(size) }));
export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/app-icon/[size]">,
) {
  const size = Number((await params).size);
  return new ImageResponse(drawAppIcon(size), { width: size, height: size });
}
