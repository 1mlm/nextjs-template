import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";

// tiny error marker that sits right next to whatever failed, instead of a
// toast or a paragraph of red text shoving the layout around. it's the inline
// half of the toast rule (see the Toaster note in layout.tsx): nothing
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
