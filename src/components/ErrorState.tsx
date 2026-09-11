import { Bug02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";

// `message` is the raw error (e.g. "Bad Gateway", a stray HTML body) —
// logged for debugging, never shown, since it's not something a user
// should have to read
export function ErrorState({ message }: { message?: string }) {
  if (message) console.error(message);

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      <Icon icon={Bug02Icon} className="size-8 text-muted-foreground" />
      <p className="font-semibold text-lg">Oops!</p>
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
    </div>
  );
}
