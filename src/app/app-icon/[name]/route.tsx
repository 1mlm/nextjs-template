import type { IconSvgElement } from "@hugeicons/react";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { drawAppIcon, drawPaddedAppIcon } from "../../_sidebar/drawAppIcon";
import { APP_SHORTCUTS } from "../../_sidebar/shortcuts";

// a hugeicon redrawn as a plain svg, satori can't run the react component
function drawShortcutIcon(icon: IconSvgElement, size: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <svg
        width={size / 2}
        height={size / 2}
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "#ffffff" }}
        aria-hidden
      >
        {icon.map(([tag, { key, ...attributes }]) => {
          const Tag = tag as "path";
          return <Tag key={key} {...attributes} />;
        })}
      </svg>
    </div>
  );
}

// the manifest's icons: install icons at /app-icon/192 and /app-icon/512,
// the android maskable one, and one per icon shortcut
const ICON_DRAWINGS: Record<
  string,
  { size: number; draw: () => ReactElement }
> = {
  192: { size: 192, draw: () => drawAppIcon(192) },
  512: { size: 512, draw: () => drawAppIcon(512) },
  // android crops maskable icons to its own shape, the middle 80% is safe
  maskable: { size: 512, draw: () => drawPaddedAppIcon(512, 0.6) },
  ...Object.fromEntries(
    APP_SHORTCUTS.map(({ concept, icon }) => [
      concept,
      { size: 192, draw: () => drawShortcutIcon(icon, 192) },
    ]),
  ),
};

export const generateStaticParams = () =>
  Object.keys(ICON_DRAWINGS).map((name) => ({ name }));
export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/app-icon/[name]">,
) {
  const { size, draw } = ICON_DRAWINGS[(await params).name];
  return new ImageResponse(draw(), { width: size, height: size });
}
