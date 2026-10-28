import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/shadcn/utils";

export type AvatarStackUser = { name: string; src?: string };

const OVERLAP_RING = "ring-2 ring-background";

// who's on this, in the space of one avatar's width plus a bit: overlapping
// faces, a name on hover, and a +N that opens the whole list (a popover, a
// sheet on phones, so it works with a tap too)
export function AvatarStack({
  users,
  max = 4,
  className,
}: {
  users: AvatarStackUser[];
  max?: number;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const hiddenCount = users.length - shown.length;

  return (
    <ul
      aria-label={`${users.length} people`}
      className={cn("flex -space-x-2", className)}
    >
      {shown.map((user) => (
        <li key={user.name}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block rounded-full">
                <UserAvatar {...user} className={cn("size-8", OVERLAP_RING)} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{user.name}</TooltipContent>
          </Tooltip>
        </li>
      ))}
      {hiddenCount > 0 && (
        <li>
          <ResponsivePopover
            title="Everyone"
            icon={UserGroupIcon}
            align="start"
            className="flex max-h-72 w-56 flex-col gap-1 overflow-y-auto p-2"
            trigger={
              <button
                type="button"
                aria-label={`Show all ${users.length} people`}
                className={cn(
                  "grid size-8 place-items-center rounded-full corner-round bg-muted text-xs font-semibold tabular-nums transition-colors hover:bg-accent",
                  OVERLAP_RING,
                )}
              >
                +{hiddenCount}
              </button>
            }
          >
            {users.map((user) => (
              <span
                key={user.name}
                className="flex items-center gap-2 rounded-md px-1 py-1 text-sm"
              >
                <UserAvatar {...user} className="size-6" />
                {user.name}
              </span>
            ))}
          </ResponsivePopover>
        </li>
      )}
    </ul>
  );
}
