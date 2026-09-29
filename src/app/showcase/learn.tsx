"use client";

import { useEffect, useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import type { ShowcaseItem } from "./ShowcaseCard";

function VoiceButtonDemo() {
  const [recordingUrl, setRecordingUrl] = useState<string>();

  // a new recording replaces the old one, its blob url is freed with it
  useEffect(
    () => () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    },
    [recordingUrl],
  );

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <VoiceButton
        onRecorded={(recording) =>
          setRecordingUrl(URL.createObjectURL(recording))
        }
      />
      {recordingUrl && (
        // biome-ignore lint/a11y/useMediaCaption: it plays back whatever you just said, there's no transcript to caption
        <audio controls src={recordingUrl} className="h-9 w-full max-w-xs" />
      )}
    </div>
  );
}

export const LEARN_ITEMS: ShowcaseItem[] = [
  {
    name: "VoiceButton",
    path: "src/components/VoiceButton.tsx",
    description:
      "hold to talk or tap to keep listening. the rings ripple with your real voice (microphone level), the recording comes back through onRecorded",
    Demo: VoiceButtonDemo,
  },
];
