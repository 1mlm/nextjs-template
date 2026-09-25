"use client";

import {
  ArrowLeft01Icon,
  CheckIcon,
  Copy01Icon,
  Loading03Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ErrorState";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { useCopyToClipboard } from "@/utils/clipboard";
import { triggerHaptic } from "@/utils/haptics";

const COPIED_FEEDBACK_MS = 1500;

const buildErrorReport = (error: Error & { digest?: string }) =>
  [
    `date: ${new Date().toISOString()}`,
    `page: ${window.location.href}`,
    `message: ${error.message}`,
    error.digest && `digest: ${error.digest}`,
    `browser: ${navigator.userAgent}`,
  ]
    .filter(Boolean)
    .join("\n");

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { copied, copy } = useCopyToClipboard(COPIED_FEEDBACK_MS);
  const [retrying, setRetrying] = useState(false);

  // a retry that fails again re-renders this same boundary with a new error
  // instead of remounting it, so the spinner has to be cleared by hand here
  useEffect(() => {
    console.error(error);
    setRetrying(false);
  }, [error]);

  const handleCopyDetails = async () => {
    const didCopy = await copy(buildErrorReport(error));
    if (didCopy) triggerHaptic("light");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ErrorState>
        <Button
          disabled={retrying}
          className="disabled:cursor-wait"
          onClick={() => {
            setRetrying(true);
            reset();
          }}
        >
          <Icon
            icon={retrying ? Loading03Icon : RefreshIcon}
            className={retrying ? "animate-spin" : undefined}
          />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          <Icon icon={ArrowLeft01Icon} />
          Go back
        </Button>
        <Button variant="ghost" onClick={handleCopyDetails}>
          <Icon icon={copied ? CheckIcon : Copy01Icon} />
          {copied ? "Copied" : "Copy details"}
        </Button>
      </ErrorState>
    </div>
  );
}
