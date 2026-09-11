import { type HugeIcon, Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// one place for "nothing here yet" — `page` fills the remaining space and
// centers on both axes with an icon, `compact` is just a small centered
// line of text for tight spaces like a dashboard card or a popover list
export function EmptyState({
  variant = "page",
  icon,
  message,
  className,
}: {
  variant?: "page" | "compact";
  icon?: HugeIcon;
  message: string;
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <p
        className={cn(
          "flex flex-1 items-center justify-center text-sm text-muted-foreground",
          className,
        )}
      >
        {message}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 p-10 text-muted-foreground",
        className,
      )}
    >
      {icon && <Icon icon={icon} className="size-8" />}
      <span className="text-sm">{message}</span>
    </div>
  );
}
