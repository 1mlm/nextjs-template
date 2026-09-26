import { ImageResponse } from "next/og";
import { drawAppIcon } from "./_sidebar/drawAppIcon";
import { APP_INFO } from "./_sidebar/nav";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = APP_INFO.name;

const ICON_SIZE = 160;

// the card a link preview shows (slack, imessage, twitter...)
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        background: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          borderRadius: 40,
          overflow: "hidden",
          border: "2px solid #262626",
        }}
      >
        {drawAppIcon(ICON_SIZE)}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>{APP_INFO.name}</div>
        <div style={{ fontSize: 36, color: "#a3a3a3" }}>
          {APP_INFO.description}
        </div>
      </div>
    </div>,
    size,
  );
}
