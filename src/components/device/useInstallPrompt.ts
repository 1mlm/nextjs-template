import { useEffect, useState } from "react";

// chrome's "add to home screen" prompt, which it only offers once the
// manifest checks out. safari never fires it, so there we hand out the
// manual steps instead
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const isInstallPromptEvent = (event: Event): event is InstallPromptEvent =>
  "prompt" in event;

// navigator.standalone is the older ios-only flag, display-mode covers
// everything else
const isRunningAsInstalledApp = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && navigator.standalone === true);

// ipados claims to be a mac, the touch points give it away
const isIpad = () =>
  /iPad/.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

const isIphone = () => /iPhone|iPod/.test(navigator.userAgent);

// chrome, firefox and edge on ios still install through the share sheet,
// but their share button isn't where safari's is
const isOtherIosBrowser = () => /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

const isMacSafari = () =>
  /Macintosh/.test(navigator.userAgent) &&
  /Safari/.test(navigator.userAgent) &&
  !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent);

const getManualInstallPlatform = () => {
  if (isRunningAsInstalledApp()) return undefined;
  if ((isIphone() || isIpad()) && isOtherIosBrowser()) return "iosBrowser";
  if (isIpad()) return "ipad";
  if (isIphone()) return "iphone";
  if (isMacSafari()) return "mac";
};

export type ManualInstallPlatform = NonNullable<
  ReturnType<typeof getManualInstallPlatform>
>;

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent>();
  // read after mount, the server has no navigator to sniff
  const [manualInstallPlatform, setManualInstallPlatform] =
    useState<ManualInstallPlatform>();

  useEffect(() => {
    setManualInstallPlatform(getManualInstallPlatform());
    const keepPrompt = (event: Event) => {
      if (!isInstallPromptEvent(event)) return;
      event.preventDefault();
      setInstallEvent(event);
    };
    const forgetPrompt = () => setInstallEvent(undefined);
    window.addEventListener("beforeinstallprompt", keepPrompt);
    window.addEventListener("appinstalled", forgetPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", keepPrompt);
      window.removeEventListener("appinstalled", forgetPrompt);
    };
  }, []);

  // chrome only lets one event prompt once, so the row goes away after
  const install = installEvent
    ? async () => {
        await installEvent.prompt();
        setInstallEvent(undefined);
      }
    : undefined;

  return { install, manualInstallPlatform };
}
