"use client";

import {
  ArrowRight01Icon,
  Bug02Icon,
  ChartLineData01Icon,
  Table01Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { COLORS, getColorStyle } from "@/utils/color";
import {
  formatDetailedDuration,
  formatDurationMinutes,
  formatExactDate,
  formatRelativeDate,
} from "@/utils/date";
import { safeLocalStorage } from "@/utils/storage";
import type { ShowcaseItem } from "./ShowcaseCard";
import { useIsClient } from "./util";

const DEMO_PAGES: { href: string; label: string; icon: IconSvgElement }[] = [
  { href: "/table", label: "CustomTable", icon: Table01Icon },
  { href: "/stats", label: "Charts", icon: ChartLineData01Icon },
  {
    href: "/this-page-does-not-exist",
    label: "404 page",
    icon: UnavailableIcon,
  },
];

function DateFormattersDemo() {
  const isClient = useIsClient();
  if (!isClient) return null;

  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000 - 4 * 3_600_000);
  const rows = [
    ["formatRelativeDate", formatRelativeDate(threeDaysAgo)],
    ["formatExactDate", formatExactDate(threeDaysAgo)],
    ["formatDetailedDuration", formatDetailedDuration(threeDaysAgo)],
    ["formatDurationMinutes(95)", formatDurationMinutes(95)],
  ];

  return (
    <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {rows.map(([name, output]) => (
        <div key={name} className="contents">
          <dt className="font-mono text-muted-foreground">{name}</dt>
          <dd>{output}</dd>
        </div>
      ))}
    </dl>
  );
}

const VISIT_COUNT_KEY = "showcase_visit_count";

function LocalStorageDemo() {
  const isClient = useIsClient();
  const [visits, setVisits] = useState(() =>
    Number(safeLocalStorage.getItem(VISIT_COUNT_KEY) ?? 0),
  );
  if (!isClient) return null;

  const bumpVisits = () => {
    safeLocalStorage.setItem(VISIT_COUNT_KEY, String(visits + 1));
    setVisits(visits + 1);
  };

  return (
    <Button variant="outline" onClick={bumpVisits}>
      clicked {visits} times (survives a reload)
    </Button>
  );
}

function ErrorPageDemo() {
  const [shouldThrow, setShouldThrow] = useState(false);
  if (shouldThrow) throw new Error("thrown on purpose from the showcase");

  return (
    <Button variant="outline" onClick={() => setShouldThrow(true)}>
      <Icon icon={Bug02Icon} />
      Crash this page
    </Button>
  );
}

export const DATA_ITEMS: ShowcaseItem[] = [
  {
    name: "COLORS + getColorStyle",
    path: "src/utils/color.ts",
    description:
      "every tailwind hue as a tinted pill, light-dark() so it follows the os theme",
    Demo: () =>
      COLORS.map((color) => (
        <span
          key={color}
          style={getColorStyle(color)}
          className="rounded-md corner-squircle px-2 py-0.5 text-xs font-medium"
        >
          {color}
        </span>
      )),
  },
  {
    name: "date formatters",
    path: "src/utils/date.ts",
    description: "relative / exact / duration helpers",
    Demo: DateFormattersDemo,
  },
  {
    name: "safeLocalStorage",
    path: "src/utils/storage.ts",
    description:
      "localStorage that never throws (safari private mode, ssr, blocked storage)",
    Demo: LocalStorageDemo,
  },
  {
    name: "error.tsx",
    path: "src/app/error.tsx",
    description: "route error boundary with retry, back and copy details",
    Demo: ErrorPageDemo,
  },
  {
    name: "demo pages",
    path: "src/app/",
    description: "bigger demos that need a whole page",
    Demo: () =>
      DEMO_PAGES.map(({ href, label, icon }) => (
        <Button key={href} variant="outline" asChild>
          <Link {...{ href }}>
            <Icon {...{ icon }} />
            {label}
            <Icon icon={ArrowRight01Icon} />
          </Link>
        </Button>
      )),
  },
];
