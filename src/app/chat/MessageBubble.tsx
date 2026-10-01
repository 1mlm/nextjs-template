"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { IconChip } from "@/components/IconChip";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";
import { APP_ICONS } from "@/utils/icons";
import { type ChatMessage, ChatRole } from "./data";

const TYPING_DOT_DELAYS_MS = [0, 150, 300];

function TypingDots() {
  return (
    <span className="flex h-6 items-center gap-1">
      {TYPING_DOT_DELAYS_MS.map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}ms` }}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
        />
      ))}
    </span>
  );
}

export function MessageBubble({
  message,
  isTyping = false,
  onRegenerate,
}: {
  message: ChatMessage;
  isTyping?: boolean;
  // only given to the last finished reply
  onRegenerate?: () => void;
}) {
  const { copied, copy } = useCopyToClipboard(1500);

  if (message.role === ChatRole.User)
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.text}
        </p>
      </div>
    );

  return (
    <div className="group/reply flex gap-3">
      <IconChip icon={SparklesIcon} className="rounded-full" />
      <div className="min-w-0 flex-1 pt-1">
        {isTyping ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.text}
          </p>
        )}
        {!isTyping && (
          <div
            className={cn(
              "mt-1.5 -ml-1.5 flex gap-0.5 text-muted-foreground transition-opacity",
              // always visible on touch and on the newest reply, the rest wait for hover
              !onRegenerate && "md:opacity-0 md:group-hover/reply:opacity-100",
            )}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Copy"
              onClick={() => copy(message.text)}
            >
              <Icon icon={copied ? APP_ICONS.confirm : APP_ICONS.copy} />
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Regenerate"
                onClick={onRegenerate}
              >
                <Icon icon={APP_ICONS.reload} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
