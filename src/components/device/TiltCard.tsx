"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { type PointerEvent, type ReactNode, useEffect } from "react";
import { cn } from "@/shadcn/utils";
import { clamp } from "@/utils/math";

const MAX_TILT = 12;
const SPRING = { stiffness: 180, damping: 16 };
// a phone held flat-ish is around 45 degrees, this is how far past that counts as "full tilt"
const GYRO_RANGE = 25;

// a card that leans toward your finger or cursor with a glare that follows
// it. on android the gyroscope tilts it too when you move the phone (iphones
// hide the sensor behind a permission prompt, so they just get the touch)
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // where the pointer is inside the card, 0 to 1 on both axes
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, SPRING);
  const smoothY = useSpring(pointerY, SPRING);
  const rotateY = useTransform(smoothX, [0, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(smoothY, [0, 1], [MAX_TILT, -MAX_TILT]);
  const glareX = useTransform(smoothX, [0, 1], [0, 100]);
  const glareY = useTransform(smoothY, [0, 1], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.45), transparent 60%)`;

  useEffect(() => {
    const handleOrientation = ({ gamma, beta }: DeviceOrientationEvent) => {
      if (gamma === null || beta === null) return;
      pointerX.set(clamp(0.5 + gamma / (GYRO_RANGE * 2), 0, 1));
      pointerY.set(clamp(0.5 + (beta - 45) / (GYRO_RANGE * 2), 0, 1));
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, [pointerX, pointerY]);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - box.left) / box.width);
    pointerY.set((event.clientY - box.top) / box.height);
  };

  const settle = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return (
    <div style={{ perspective: 900 }} className="w-full max-w-xs">
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onPointerMove={follow}
        onPointerLeave={settle}
        onPointerUp={(event) => event.pointerType !== "mouse" && settle()}
        className={cn(
          "relative touch-pan-y overflow-hidden rounded-3xl border bg-card p-5 shadow-[0_6px_0_0_var(--border)]",
          className,
        )}
      >
        {children}
        <motion.div
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0"
        />
      </motion.div>
    </div>
  );
}
