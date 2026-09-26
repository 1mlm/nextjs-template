import { type PropsWithChildren, ViewTransition } from "react";

// class names the ::view-transition rules in globals.css pick up
const PAGE_TRANSITIONS = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "page-fade",
};

// a template remounts on every navigation (a layout doesn't), so the page
// gets a real enter/exit to animate while the shell around it stays put
export default function Template({ children }: PropsWithChildren) {
  return (
    <ViewTransition
      enter={PAGE_TRANSITIONS}
      exit={PAGE_TRANSITIONS}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
