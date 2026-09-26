"use client";

import { RefreshIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useEffect } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/Icon";

const CHECK_EVERY_MS = 5 * 60_000;
const VERSION_URL = "/api/version";

const fetchVersion = async () => {
  const response = await fetch(VERSION_URL, { cache: "no-store" });
  const { version }: { version: string } = await response.json();
  return version;
};

const showNewVersionToast = () =>
  toast("A new version is out", {
    id: "new-version",
    description: "reload to get the latest stuff",
    duration: Number.POSITIVE_INFINITY,
    icon: <Icon icon={SparklesIcon} className="size-4" />,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <Icon icon={RefreshIcon} className="size-3.5" />
          Reload
        </span>
      ),
      onClick: () => window.location.reload(),
    },
  });

// someone keeps a tab open across a deploy, their js is now stale. the
// version route changes every build, so compare against the one this tab
// started with, every few minutes and whenever the tab comes back into view
export function NewVersionToast() {
  useEffect(() => {
    const loadedVersion = fetchVersion().catch(() => null);

    const checkForNewVersion = async () => {
      const [startVersion, liveVersion] = await Promise.all([
        loadedVersion,
        fetchVersion().catch(() => null),
      ]);
      const hasNewVersion =
        startVersion !== null &&
        liveVersion !== null &&
        liveVersion !== startVersion;
      if (hasNewVersion) showNewVersionToast();
    };

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") checkForNewVersion();
    };

    const interval = window.setInterval(checkForNewVersion, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, []);

  return null;
}
