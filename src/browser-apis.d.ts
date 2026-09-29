// the eyedropper and document picture-in-picture apis ship in chromium but
// typescript's dom lib doesn't know them yet, so just the bits we call
interface EyeDropper {
  open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
}
declare const EyeDropper: { new (): EyeDropper };

interface Window {
  documentPictureInPicture?: {
    requestWindow(options?: {
      width?: number;
      height?: number;
    }): Promise<Window>;
  };
}
