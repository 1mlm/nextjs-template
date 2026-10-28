"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { Kbd } from "@/components/Kbd";
import { Tour } from "@/components/tour/Tour";
import type { TourStep } from "@/components/tour/types";

const StartTourContext = createContext<(() => void) | null>(null);

export function useStartAppTour() {
  const start = useContext(StartTourContext);
  if (!start) throw new Error("useStartAppTour needs an AppTourProvider");
  return start;
}

// the first run through the template, also what a fork copies to write its
// own. elements get data-tour="name" and the step points at it
export function AppTourProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const goToPage = (path: string) => () => {
    if (window.location.pathname !== path) router.push(path);
  };

  const steps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Malik Kit",
      body: "A quick walk through the shell and the table. It takes under a minute, and you can leave any time with escape.",
    },
    {
      id: "nav",
      target: '[data-tour="nav"]',
      placement: "right",
      title: "Every page lives here",
      body: "The sidebar on a computer, the tab bar on a phone. Links are one list in nav.tsx.",
    },
    {
      id: "search",
      target: '[data-tour="search"]',
      placement: "right",
      skipIfMissing: true,
      title: "Search everything",
      body: (
        <>
          Pages, actions and every showcase component.{" "}
          <Kbd keys={["mod", "k"]} /> opens it from anywhere.
        </>
      ),
    },
    {
      id: "showcase",
      before: goToPage("/showcase"),
      target: "main [data-slot='card']",
      title: "The showcase",
      body: "Every component is a card you can poke at, with the file it lives in right under the name.",
    },
    {
      id: "table-add",
      before: goToPage("/table"),
      target: '[data-tour="table-add"]',
      advanceOnClick: true,
      title: "Try it",
      body: "Press Add person. A fresh row slides in on top.",
    },
    {
      id: "table-header",
      target: "table thead",
      placement: "bottom",
      title: "Every column header is a menu",
      body: "Sort, filter, or hide a column. Your choices live in the url, so a reload or a shared link keeps them.",
    },
    {
      id: "done",
      title: "That's it",
      body: "Take this tour again from the search (ctrl k), type tour.",
    },
  ];

  return (
    <StartTourContext.Provider value={() => setOpen(true)}>
      {children}
      <Tour {...{ steps, open }} onOpenChange={setOpen} />
    </StartTourContext.Provider>
  );
}
