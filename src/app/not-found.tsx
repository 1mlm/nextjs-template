import { UnavailableIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { APP_ICONS } from "@/utils/icons";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
      <EmptyState
        icon={UnavailableIcon}
        message="This page doesn't exist (or it moved and nobody told us)"
        className="flex-none p-0"
      />
      <Button asChild className="mt-2">
        <Link href="/showcase">
          <Icon icon={APP_ICONS.showcase} />
          Back to the showcase
        </Link>
      </Button>
    </div>
  );
}
