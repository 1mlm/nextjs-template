// microsoft's fluent emoji sparkles, straight off their cdn, no background
// square around it. this feeds apple-icon, the og image and the pwa install
// icons, so they never drift from each other
export function drawAppIcon(size: number) {
  return (
    // biome-ignore lint/performance/noImgElement: satori (ImageResponse) needs a plain img to fetch a remote file
    <img
      src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sparkles/3D/sparkles_3d.png"
      width={size}
      height={size}
      alt="Sparkles"
    />
  );
}

// the sparkles on a solid square, for the places that won't take a
// transparent icon: ios paints transparency black and android crops
// maskable icons into its own shape, so logoScale keeps them in the safe zone
export function drawPaddedAppIcon(size: number, logoScale: number) {
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
      {drawAppIcon(size * logoScale)}
    </div>
  );
}
