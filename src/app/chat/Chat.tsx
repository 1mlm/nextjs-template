"use client";

import { ArrowDown02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { APP_ICONS } from "@/utils/icons";
import { Composer } from "./Composer";
import {
  type ChatMessage,
  ChatRole,
  pickReply,
  SEED_MESSAGES,
  SUGGESTIONS,
} from "./data";
import { MessageBubble } from "./MessageBubble";

const FIRST_WORD_DELAY_MS = 700;
const BASE_WORD_DELAY_MS = 30;
// how far up you scroll before the jump to latest button shows
const AWAY_FROM_LATEST_PX = 160;

// a reply that's still being typed, `shown` words of `words` are on screen
type Stream = { id: string; words: string[]; shown: number };

const getWordDelayMs = (shown: number) =>
  shown === 0
    ? FIRST_WORD_DELAY_MS
    : // not random so it's the same on every render, just uneven enough to feel typed
      BASE_WORD_DELAY_MS + ((shown * 37) % 40);

// all fake: replies are canned and streamed word by word in the browser
export function Chat() {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [stream, setStream] = useState<Stream | null>(null);
  const [isAwayFromLatest, setIsAwayFromLatest] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stream) return;
    const isDone = stream.shown >= stream.words.length;
    const timeout = setTimeout(
      () => {
        if (!isDone) return setStream({ ...stream, shown: stream.shown + 1 });
        const reply = {
          id: stream.id,
          role: ChatRole.Assistant,
          text: stream.words.join(" "),
        };
        setMessages((current) => [...current, reply]);
        setStream(null);
      },
      isDone ? 0 : getWordDelayMs(stream.shown),
    );
    return () => clearTimeout(timeout);
  }, [stream]);

  const startReply = (userText: string, attempt: number) =>
    setStream({
      id: crypto.randomUUID(),
      words: pickReply(userText, attempt).split(" "),
      shown: 0,
    });

  const scrollToLatest = () =>
    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const sendMessage = (text: string) => {
    const message = { id: crypto.randomUUID(), role: ChatRole.User, text };
    setMessages([...messages, message]);
    startReply(text, messages.length);
    scrollToLatest();
  };

  const stopReply = () => {
    if (!stream) return;
    const partialText = stream.words.slice(0, stream.shown).join(" ");
    if (partialText)
      setMessages([
        ...messages,
        { id: stream.id, role: ChatRole.Assistant, text: partialText },
      ]);
    setStream(null);
  };

  const regenerateLastReply = () => {
    const withoutReply = messages.slice(0, -1);
    const lastUserMessage = withoutReply.findLast(
      ({ role }) => role === ChatRole.User,
    );
    if (!lastUserMessage) return;
    setMessages(withoutReply);
    startReply(lastUserMessage.text, messages.length + 1);
  };

  const startNewChat = () => {
    setStream(null);
    setMessages([]);
  };

  const lastMessage = messages.at(-1);
  const canRegenerate = !stream && lastMessage?.role === ChatRole.Assistant;
  const isEmpty = messages.length === 0 && !stream;
  const streamingMessage: ChatMessage | null = stream && {
    id: stream.id,
    role: ChatRole.Assistant,
    text: stream.words.slice(0, stream.shown).join(" "),
  };

  return (
    // the phone keyboard shrinks --visible-height (see KeyboardInset) so the
    // composer rides on top of it instead of hiding behind
    <div className="flex h-[calc(var(--visible-height,100dvh)-5.25rem)] flex-col md:h-[calc(100dvh-1rem)]">
      <header className="flex items-center justify-between px-4 py-3 md:px-5">
        <h1 className="text-sm font-semibold">Chat</h1>
        <Button
          variant="ghost"
          size="sm"
          disabled={messages.length === 0 && !stream}
          onClick={startNewChat}
        >
          <Icon icon={APP_ICONS.add} />
          New chat
        </Button>
      </header>

      <div className="relative min-h-0 flex-1">
        {/* column-reverse keeps the scroll pinned to the bottom by itself,
        new text grows upward and scrolling up just works, no scroll math */}
        <div
          ref={scrollerRef}
          onScroll={(event) =>
            setIsAwayFromLatest(
              event.currentTarget.scrollTop < -AWAY_FROM_LATEST_PX,
            )
          }
          className="flex h-full flex-col-reverse overflow-y-auto overscroll-contain"
        >
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
              <EmptyState
                icon={SparklesIcon}
                message="what's on your mind?"
                className="flex-none p-0"
              />
              <div className="flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  {...{ message }}
                  onRegenerate={
                    canRegenerate && message === lastMessage
                      ? regenerateLastReply
                      : undefined
                  }
                />
              ))}
              {streamingMessage && stream && (
                <MessageBubble
                  message={streamingMessage}
                  isTyping={stream.shown === 0}
                />
              )}
            </div>
          )}
        </div>
        {isAwayFromLatest && (
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Jump to latest"
            onClick={scrollToLatest}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md ring-1 ring-border"
          >
            <Icon icon={ArrowDown02Icon} />
          </Button>
        )}
      </div>

      <Composer
        isStreaming={stream !== null}
        onSend={sendMessage}
        onStop={stopReply}
      />
    </div>
  );
}
