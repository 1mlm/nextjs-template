"use client";

import { RefreshIcon } from "@hugeicons/core-free-icons";
import "@/shadcn/styles/globals.css";
import { ErrorState } from "@/components/ErrorState";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

// only shows when the root layout itself blows up, so it replaces the whole
// document (own html/body, no providers, no fonts). error.tsx handles
// everything below the layout, this is the last line of defense
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-4 antialiased">
        <ErrorState message={error.message}>
          <Button onClick={reset}>
            <Icon icon={RefreshIcon} />
            Try again
          </Button>
        </ErrorState>
      </body>
    </html>
  );
}
