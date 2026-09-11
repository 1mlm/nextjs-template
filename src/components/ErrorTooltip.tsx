import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";

// compact error indicator meant to sit right next to whatever action
// failed, instead of a toast or a paragraph of red text taking up layout
// space - the inline-feedback half of the toast convention (see the
// comment above <Toaster /> in layout.tsx): use this when nothing
// disappeared, there's just an error to point at
export function ErrorTooltip({ message }: { message: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center text-destructive">
        <Icon icon={Alert02Icon} className="size-4" />
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="max-w-56 text-center">
        {message}
      </TooltipContent>
    </Tooltip>
  );
}
