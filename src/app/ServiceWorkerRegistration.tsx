"use client";

import { useEffect } from "react";

// public/sw.js, which only swaps the browser's dino for public/offline.html
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
