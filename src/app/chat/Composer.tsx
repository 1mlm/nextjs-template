"use client";

import { ArrowUp02Icon, StopIcon } from "@hugeicons/core-free-icons";
import { type KeyboardEvent, useState } from "react";
import { Icon } from "@/components/Icon";
import { Kbd } from "@/components/Kbd";
import { Button } from "@/shadcn/ui/button";
import { Textarea } from "@/shadcn/ui/textarea";
import { triggerHaptic } from "@/utils/haptics";

// enter sends on desktop, on a phone the enter key is for new lines and the
// send button does the sending
const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches;

export function Composer({
  isStreaming,
  onSend,
  onStop,
}: {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0 && !isStreaming;

  const send = () => {
    if (!canSend) return;
    triggerHaptic("selection");
    onSend(draft.trim());
    setDraft("");
  };

  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const isPlainEnter =
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing;
    if (!isPlainEnter || isTouchDevice()) return;
    event.preventDefault();
    send();
  };

  const stop = () => {
    triggerHaptic("selection");
    onStop();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-3 pb-3 md:px-4 md:pb-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex items-end gap-2 rounded-3xl bg-background p-2 pl-4 ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-ring/50"
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={sendOnEnter}
          placeholder="Message..."
          rows={1}
          className="max-h-40 min-h-0 resize-none border-0 bg-transparent px-0 py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="Stop"
            onClick={stop}
            className="rounded-full"
          >
            <Icon icon={StopIcon} />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            aria-label="Send"
            disabled={!canSend}
            className="rounded-full"
          >
            <Icon icon={ArrowUp02Icon} />
          </Button>
        )}
      </form>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground pointer-coarse:hidden">
        <Kbd keys={["enter"]} /> to send
        <Kbd keys={["shift", "enter"]} /> for a new line
      </p>
    </div>
  );
}
