"use client";

import { DraggableGlass } from "./Stage";

// the usual "liquid glass" tutorial: blur, a white wash and a 1px border, no
// bending at all. only here as the baseline the others should beat
export default function FrostedGlass() {
  return (
    <DraggableGlass className="rounded-full border border-white/60 bg-white/25 shadow-[0_8px_24px_rgb(0_0_0/0.12)] backdrop-blur-xl" />
  );
}
