"use client";

import { useEffect } from "react";

// public/sw.js. the offline page works everywhere, caching the build's
// static files only switches on in production (?static=1), see the worker
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isProduction = process.env.NODE_ENV === "production";
    navigator.serviceWorker.register(
      isProduction ? "/sw.js?static=1" : "/sw.js",
    );
  }, []);

  return null;
}
