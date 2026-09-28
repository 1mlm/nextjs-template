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
