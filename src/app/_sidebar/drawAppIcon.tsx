import { GiftIcon } from "@hugeicons/core-free-icons";

// the sidebar's gift, drawn as a plain full bleed square for ImageResponse.
// no rounded corners on purpose, phones cut their own shape out of it, and
// the gift sits well inside the middle 60% so no mask ever clips it
export function drawAppIcon(size: number) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: satori (ImageResponse) paints a <title> as visible text on the icon */}
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fafafa"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GiftIcon.map(([, { d, key }]) => (
          <path key={String(key)} d={String(d)} />
        ))}
      </svg>
    </div>
  );
}
