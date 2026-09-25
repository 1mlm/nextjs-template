"use client";

import { Suspense } from "react";
import { BUTTON_ITEMS } from "./_showcase/buttons";
import { CHART_ITEMS } from "./_showcase/charts";
import { DATA_ITEMS } from "./_showcase/data";
import { FEEL_ITEMS } from "./_showcase/feel";
import { INPUT_ITEMS } from "./_showcase/inputs";
import { OVERLAY_ITEMS } from "./_showcase/overlays";
import { ShowcaseCard } from "./_showcase/ShowcaseCard";
import { STATE_ITEMS } from "./_showcase/states";

const SECTIONS = [
  { title: "Buttons", items: BUTTON_ITEMS },
  { title: "Overlays & forms", items: OVERLAY_ITEMS },
  { title: "Inputs", items: INPUT_ITEMS },
  { title: "States & display", items: STATE_ITEMS },
  { title: "Feel (haptics, sound, confetti)", items: FEEL_ITEMS },
  { title: "Charts", items: CHART_ITEMS },
  { title: "Data & pages", items: DATA_ITEMS },
];

export default function Page() {
  return (
    // nuqs (SearchBar) reads search params, which needs a suspense boundary on a static page
    <Suspense>
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">nextjs-template</h1>
          <p className="text-sm text-muted-foreground">
            every component and util in this template, poke at them
          </p>
        </header>
        {SECTIONS.map(({ title, items }) => (
          <section key={title} className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">{title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ShowcaseCard key={item.name} {...item} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </Suspense>
  );
}
