"use client";

import { useEffect } from "react";

// phone keyboards slide over the page instead of shrinking it, so a bottom
// sheet with an input stayed pinned behind the keyboard. this writes how much
// of the screen the keyboard covers into --keyboard-inset, and the sheets in
// globals.css sit on top of it (the visual viewport is what's actually visible)
export function KeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${Math.max(covered, 0)}px`,
      );
      document.documentElement.style.setProperty(
        "--visible-height",
        `${viewport.height}px`,
      );
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}
