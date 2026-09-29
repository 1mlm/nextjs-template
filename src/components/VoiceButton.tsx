"use client";

import { Mic01Icon, MicOff01Icon, StopIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { shakeElement } from "@/utils/shake";

enum VoiceState {
  Idle = "idle",
  Requesting = "requesting",
  Listening = "listening",
  Blocked = "blocked",
  Unsupported = "unsupported",
}

const CAPTIONS: Record<VoiceState, string> = {
  [VoiceState.Idle]: "hold to talk, or tap to keep listening",
  [VoiceState.Requesting]: "allow the microphone...",
  [VoiceState.Listening]: "listening...",
  [VoiceState.Blocked]: "mic is blocked, allow it in the address bar",
  [VoiceState.Unsupported]: "no microphone on this device",
};

const ICONS: Record<VoiceState, IconSvgElement> = {
  [VoiceState.Idle]: Mic01Icon,
  [VoiceState.Requesting]: Mic01Icon,
  [VoiceState.Listening]: StopIcon,
  [VoiceState.Blocked]: MicOff01Icon,
  [VoiceState.Unsupported]: MicOff01Icon,
};

// a press longer than this is push to talk (letting go stops), a shorter one
// is a tap that keeps listening until the next tap
const HOLD_MS = 350;

// each ring chases the voice at its own pace, so a loud word rolls outward
// as a wave instead of every ring jumping at once
const RINGS = [
  { stiffness: 320, damping: 20, growth: 0.45 },
  { stiffness: 170, damping: 17, growth: 0.9 },
  { stiffness: 90, damping: 14, growth: 1.4 },
];

// speech sits around 0.02 to 0.3 rms, this stretches it to fill 0 to 1
const LEVEL_BOOST = 4;

const getRms = (samples: Uint8Array) =>
  Math.sqrt(
    samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) /
      samples.length,
  );

function useMicrophone(onRecorded?: (recording: Blob) => void) {
  const level = useMotionValue(0);
  const isReducedMotion = useReducedMotion();
  const [state, setState] = useState<VoiceState>(VoiceState.Idle);
  const stopSession = useRef<() => void>(undefined);
  const isStopRequested = useRef(false);
  const frameId = useRef(0);

  const stop = () => {
    isStopRequested.current = true;
    stopSession.current?.();
  };

  const start = async () => {
    if (stopSession.current || state === VoiceState.Requesting) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState(VoiceState.Unsupported);
      return;
    }
    isStopRequested.current = false;
    setState(VoiceState.Requesting);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () =>
        onRecorded?.(new Blob(chunks, { type: recorder.mimeType }));
      recorder.start();

      const measure = () => {
        analyser.getByteTimeDomainData(samples);
        level.set(
          isReducedMotion ? 0 : Math.min(1, getRms(samples) * LEVEL_BOOST),
        );
        frameId.current = requestAnimationFrame(measure);
      };
      measure();

      // every track has to stop or the browser keeps its mic light on
      stopSession.current = () => {
        cancelAnimationFrame(frameId.current);
        if (recorder.state !== "inactive") recorder.stop();
        for (const track of stream.getTracks()) track.stop();
        context.close();
        level.set(0);
        stopSession.current = undefined;
        setState(VoiceState.Idle);
      };
      setState(VoiceState.Listening);
      // let go before the permission prompt was answered
      if (isStopRequested.current) stopSession.current();
    } catch {
      setState(VoiceState.Blocked);
    }
  };

  // leaving the page mid-sentence must not leave the mic on
  useEffect(() => () => stopSession.current?.(), []);

  return { state, level, start, stop };
}

function VoiceRing({
  level,
  stiffness,
  damping,
  growth,
}: { level: MotionValue<number> } & (typeof RINGS)[number]) {
  const smoothLevel = useSpring(level, { stiffness, damping });
  const scale = useTransform(smoothLevel, (value) => 1 + value * growth);
  const opacity = useTransform(smoothLevel, (value) =>
    Math.min(0.5, value * 2),
  );

  return (
    <motion.span
      style={{ scale, opacity }}
      className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-primary/60 bg-primary/5"
    />
  );
}

// a talk button that ripples with your actual voice. the rings read the
// microphone level live, the recording comes back through onRecorded
export function VoiceButton({
  onRecorded,
  className,
}: {
  onRecorded?: (recording: Blob) => void;
  className?: string;
}) {
  const { state, level, start, stop } = useMicrophone(onRecorded);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pressStartedAt = useRef(0);
  const didPressStartListening = useRef(false);
  const isListening = state === VoiceState.Listening;
  const isBlocked = state === VoiceState.Blocked;

  useEffect(() => {
    if (isBlocked) shakeElement(buttonRef.current);
  }, [isBlocked]);

  const handlePointerDown = () => {
    pressStartedAt.current = Date.now();
    didPressStartListening.current = !isListening;
    triggerHaptic("light");
    if (isListening) return;
    start();
  };

  const handlePointerUp = () => {
    const wasHeld = Date.now() - pressStartedAt.current > HOLD_MS;
    // a press that began the session only ends it when held, a press on an
    // already listening button is the tap that ends it
    if (didPressStartListening.current && !wasHeld) return;
    triggerHaptic("success");
    stop();
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative my-11">
        {RINGS.map((ring) => (
          <VoiceRing key={ring.growth} {...{ level }} {...ring} />
        ))}
        {state === VoiceState.Idle && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-3xl bg-primary/15 [animation-duration:2.6s] motion-reduce:hidden" />
        )}
        <Button
          ref={buttonRef}
          size="icon-lg"
          variant={isBlocked ? "destructive" : "default"}
          disabled={state === VoiceState.Unsupported}
          aria-label={isListening ? "Stop listening" : "Talk"}
          aria-pressed={isListening}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={stop}
          // keyboard: enter or space toggles, a real pointer click has detail 1+ and is handled above
          onClick={(event) => {
            if (event.detail !== 0) return;
            if (isListening) stop();
            else start();
          }}
          className="relative size-16 touch-none rounded-3xl [&_svg:not([class*='size-'])]:size-7"
        >
          <Icon icon={ICONS[state]} />
        </Button>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {CAPTIONS[state]}
      </p>
    </div>
  );
}
