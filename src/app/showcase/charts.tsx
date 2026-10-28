"use client";

import { addDays } from "date-fns";
import { useState } from "react";
import { Line, LineChart } from "@/components/charts";
import { Grid } from "@/components/charts/grid";
import { PieChart, type PieSlice } from "@/components/charts/pie-chart";
import { ProjectionLine } from "@/components/charts/projection-line";
import { StatCardLine } from "@/components/charts/stat-card-line";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ActivityHeatmap } from "@/components/viz/ActivityHeatmap";
import { ProgressRings } from "@/components/viz/progress-rings";
import { SegmentedBar } from "@/components/viz/segmented-bar";
import { Sparkline } from "@/components/viz/sparkline";
import { Button } from "@/shadcn/ui/button";
import { getColorSwatch } from "@/utils/color";
import type { ShowcaseItem } from "./ShowcaseCard";

const SERIES_START = new Date("2026-06-01");
const SERIES_DAYS = 30;

// deterministic wobble, a Math.random() here would differ between server and client
const TRAFFIC_SERIES = Array.from({ length: SERIES_DAYS }, (_, day) => ({
  date: addDays(SERIES_START, day),
  visitors: Math.round(1200 + day * 25 + Math.sin(day / 2) * 180),
  signups: Math.round(300 + day * 9 + Math.cos(day / 3) * 70),
}));

const LAST_POINT = TRAFFIC_SERIES[SERIES_DAYS - 1];

const VISITOR_PROJECTION = [
  { date: LAST_POINT.date, value: LAST_POINT.visitors },
  { date: addDays(LAST_POINT.date, 7), value: LAST_POINT.visitors + 260 },
];

const LOADING_STYLES = ["pulse", "sweep"] as const;

// two series with very different sizes, each on its own axis in its own
// color, otherwise signups would be a flat line at the bottom
const TRAFFIC_LINES = [
  {
    dataKey: "visitors",
    label: "Visitors",
    color: getColorSwatch("sky"),
    yAxisId: "left",
    side: "left",
  },
  {
    dataKey: "signups",
    label: "Signups",
    color: getColorSwatch("violet"),
    yAxisId: "right",
    side: "right",
  },
] as const;

// the series' display names in the tooltip, not the raw data keys
const getTrafficTooltipRows = (point: Record<string, unknown>) =>
  TRAFFIC_LINES.map(({ dataKey, label, color }) => ({
    label,
    color,
    value: Number(point[dataKey]),
  }));

const TRAFFIC_SOURCES: PieSlice[] = [
  { id: "search", label: "Search", value: 4820, color: getColorSwatch("sky") },
  {
    id: "social",
    label: "Social",
    value: 2710,
    color: getColorSwatch("violet"),
  },
  {
    id: "direct",
    label: "Direct",
    value: 1940,
    color: getColorSwatch("emerald"),
  },
  { id: "email", label: "Email", value: 860, color: getColorSwatch("amber") },
  { id: "other", label: "Other", value: 410, color: getColorSwatch("rose") },
];

const SPARKLINE_ROWS = [
  { label: "Revenue", values: [4, 5, 4, 6, 7, 6, 9, 8, 11] },
  { label: "Churn", values: [9, 8, 9, 7, 6, 7, 5, 4, 4] },
  { label: "Signups", values: [5, 5, 5, 5, 5, 5, 5, 5, 5] },
  { label: "Latency", values: [3, 4, 3, 5, 4, 6, 8, 7, 9] },
];

const ACTIVITY_RINGS = [
  { id: "move", label: "Move", value: 420, max: 600, color: "rose" },
  { id: "exercise", label: "Exercise", value: 22, max: 30, color: "lime" },
  { id: "stand", label: "Stand", value: 6, max: 12, color: "cyan" },
] as const;

const STORAGE_SEGMENTS = [
  { id: "photos", label: "Photos", value: 48, color: getColorSwatch("sky") },
  { id: "videos", label: "Videos", value: 31, color: getColorSwatch("violet") },
  { id: "apps", label: "Apps", value: 14, color: getColorSwatch("amber") },
  { id: "other", label: "Other", value: 6, color: getColorSwatch("rose") },
];

// local midnight on both sides, so server and browser draw the same weeks
const HEATMAP_END = new Date(2026, 9, 28);
const HEATMAP_DAYS = Array.from({ length: 280 }, (_, daysAgo) => ({
  date: addDays(HEATMAP_END, -daysAgo),
  value: (daysAgo * 37) % 11 > 4 ? ((daysAgo * 7) % 9) + 1 : 0,
}));

function TrafficChartDemo() {
  const [loadingStyle, setLoadingStyle] = useState<
    (typeof LOADING_STYLES)[number] | null
  >(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {TRAFFIC_LINES.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-sm">
            <span
              style={{ background: color }}
              className="h-1 w-4 rounded-full"
            />
            {label}
          </span>
        ))}
        <span className="flex-1" />
        {LOADING_STYLES.map((style) => (
          <Button
            key={style}
            size="sm"
            variant={loadingStyle === style ? "default" : "outline"}
            onClick={() =>
              setLoadingStyle(loadingStyle === style ? null : style)
            }
          >
            loading: {style}
          </Button>
        ))}
      </div>
      <LineChart
        aspectRatio="2.2 / 1"
        className="w-full"
        data={TRAFFIC_SERIES}
        status={loadingStyle ? "loading" : "ready"}
      >
        <Grid />
        {TRAFFIC_LINES.map(({ dataKey, color, yAxisId }) => (
          <Line
            key={dataKey}
            {...{ dataKey, yAxisId }}
            stroke={color}
            loadingStyle={loadingStyle ?? undefined}
          />
        ))}
        {TRAFFIC_LINES.map(({ label, color, yAxisId, side }) => (
          <YAxis key={label} {...{ label, color, yAxisId, side }} />
        ))}
        <ProjectionLine
          data={VISITOR_PROJECTION}
          stroke={TRAFFIC_LINES[0].color}
        />
        <XAxis />
        <ChartTooltip rows={getTrafficTooltipRows} />
      </LineChart>
    </div>
  );
}

export const CHART_ITEMS: ShowcaseItem[] = [
  {
    name: "LineChart",
    path: "src/components/charts/line-chart.tsx",
    description:
      "visitors on the left axis, signups on the right, each in its line's color, a dashed projection and a tooltip. hover it, toggle the loading styles",
    wide: true,
    Demo: TrafficChartDemo,
  },
  {
    name: "StatCardLine",
    path: "src/components/charts/stat-card-line.tsx",
    description:
      "sparkline card, hover the line: a crosshair lands on the day and the corner shows its value",
    Demo: () => (
      <div className="w-full">
        <StatCardLine />
      </div>
    ),
  },
  {
    name: "PieChart",
    path: "src/components/charts/pie-chart.tsx",
    description:
      "donut with the total in the middle, hover a slice or a legend row: it slides out and the middle shows its share",
    Demo: () => (
      <PieChart data={TRAFFIC_SOURCES} totalLabel="Visits" className="w-full" />
    ),
  },
  {
    name: "Sparkline",
    path: "src/components/viz/sparkline.tsx",
    description:
      "a trend without axes or labels, for a table cell or next to a number. green when it ended higher than it started, red when lower, flat sits in the middle",
    Demo: () => (
      <ul className="flex w-full flex-col gap-2">
        {SPARKLINE_ROWS.map(({ label, values }) => (
          <li key={label} className="flex items-center justify-between text-sm">
            {label}
            <Sparkline {...{ values }} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    name: "ProgressRings",
    path: "src/components/viz/progress-rings.tsx",
    description:
      "nested rings for how far along each goal is, readable without a word. one ring works as a plain circular progress, the middle takes anything",
    Demo: () => (
      <div className="flex items-center gap-6">
        <ProgressRings rings={[...ACTIVITY_RINGS]} />
        <ProgressRings
          rings={[{ id: "upload", label: "Upload", value: 72, color: "sky" }]}
          className="size-20"
        >
          <span className="text-sm font-semibold tabular-nums">72%</span>
        </ProgressRings>
      </div>
    ),
  },
  {
    name: "SegmentedBar",
    path: "src/components/viz/segmented-bar.tsx",
    description:
      "one bar split by share, like storage by file type. with a max the rest stays an empty track. hover a segment or a legend dot and the others fade",
    Demo: () => (
      <SegmentedBar segments={STORAGE_SEGMENTS} max={128} className="w-full" />
    ),
  },
  {
    name: "ActivityHeatmap",
    path: "src/components/viz/ActivityHeatmap.tsx",
    wide: true,
    description:
      "the contribution calendar: a column per week, darker the busier the day (by quartile, so one huge day doesn't flatten the rest). hover or tap a day, scrolls sideways on phones",
    Demo: () => (
      <ActivityHeatmap
        data={HEATMAP_DAYS}
        until={HEATMAP_END}
        weeks={40}
        className="w-full"
      />
    ),
  },
];
