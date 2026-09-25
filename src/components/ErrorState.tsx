import { Bug02Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

// `message` is the raw error (e.g. "Bad Gateway", a stray html body), it
// gets logged for debugging but never shown, no user should have to read that.
// `children` is for actions under it, like a retry button
export function ErrorState({
  message,
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  if (message) console.error(message);

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      <Icon icon={Bug02Icon} className="size-8 text-muted-foreground" />
      <p className="font-semibold text-lg">Oops!</p>
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
      {children && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
