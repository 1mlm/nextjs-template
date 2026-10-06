"use client";

import { Suspense, useEffect } from "react";
import { ShowcaseCard } from "./ShowcaseCard";
import { flashShowcaseCard, SHOWCASE_SECTIONS } from "./sections";

export default function Page() {
  // arriving from the command palette with /showcase#some-card
  useEffect(() => {
    const slug = window.location.hash.slice(1);
    if (slug) flashShowcaseCard(slug);
  }, []);

  return (
    // nuqs (SearchBar) reads search params, which needs a suspense boundary on a static page
    <Suspense>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Malik Kit</h1>
          <p className="text-sm text-muted-foreground">
            every component and util in this template, poke at them
          </p>
        </header>
        {SHOWCASE_SECTIONS.map(({ title, items }) => (
          <section key={title} className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">{title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ShowcaseCard key={item.name} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Suspense>
  );
}
