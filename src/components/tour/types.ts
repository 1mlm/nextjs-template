import type { ReactNode } from "react";

export type TourStep = {
  id: string;
  // a css selector or a function for what a selector can't say (the sidebar
  // on desktop, the tab bar on a phone). leave it out for a step in the
  // middle of the screen, a welcome or a goodbye
  target?: string | (() => HTMLElement | null);
  title: string;
  body: ReactNode;
  // where the card goes relative to the highlight, flips if it doesn't fit
  placement?: "top" | "bottom" | "left" | "right";
  // runs before the step shows (open a menu, go to another page), then the
  // tour waits for the target to exist. may run twice in dev (strict mode),
  // so make it safe to repeat
  before?: () => void | Promise<void>;
  // runs when the step is left, to close what `before` opened
  after?: () => void;
  // clicks reach the highlighted element instead of being blocked
  interactive?: boolean;
  // moves on by itself when the target is clicked (implies interactive)
  advanceOnClick?: boolean;
  // how long to wait for the target to exist. a step with a before() gets
  // 4 seconds (a page to load), one without gets under a second, so a target
  // that isn't there is skipped or replaced quickly instead of after a long stare
  waitMs?: number;
  // room between the target and the edge of the highlight
  spotlightPadding?: number;
  // when the target never shows up the step is skipped, instead of shown in
  // the middle of the screen with its text
  skipIfMissing?: boolean;
};

export type TourRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};
