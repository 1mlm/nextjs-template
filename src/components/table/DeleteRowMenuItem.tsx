"use client";

import { Icon } from "@/components/Icon";
import { DropdownMenuItem } from "@/shadcn/ui/dropdown-menu";
import { APP_ICONS } from "@/utils/icons";
import { runUndoableAction } from "@/utils/undoableAction";

// pairs with useOptimisticRowRemoval: hides the row immediately and defers
// the real mutation behind a toast's undo window (see runUndoableAction)
export function DeleteRowMenuItem({
  label,
  message,
  undoLabel,
  onOptimisticRemove,
  onRevert,
  commit,
}: {
  label: string;
  message: string;
  undoLabel?: string;
  onOptimisticRemove: () => void;
  onRevert: () => void;
  commit: Parameters<typeof runUndoableAction>[0]["commit"];
}) {
  return (
    <DropdownMenuItem
      variant="destructive"
      onSelect={() => {
        onOptimisticRemove();
        runUndoableAction({ commit, onRevert, message, undoLabel });
      }}
    >
      <Icon icon={APP_ICONS.remove} />
      {label}
    </DropdownMenuItem>
  );
}
