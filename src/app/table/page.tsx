"use client";

import {
  Alert02Icon,
  Calendar04Icon,
  CheckmarkBadge02Icon,
  Coins01Icon,
  Delete02Icon,
  Key01Icon,
  Link01Icon,
  Mail01Icon,
  StarIcon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Suspense, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
  type CustomTableEnumValue,
} from "@/components/table/CustomTable";
import { Button } from "@/shadcn/ui/button";

type Row = {
  id: string;
  name: string;
  email: string;
  url: string;
  credits: number;
  status: keyof typeof statusOptions | undefined;
  verified: boolean;
  joinedAt: Date | undefined;
  labels: string[];
};

const statusOptions = {
  ACTIVE: { label: "Active", icon: CheckmarkBadge02Icon, color: "green" },
  PENDING: { label: "Pending", icon: Alert02Icon, color: "amber" },
  BANNED: { label: "Banned", icon: Delete02Icon, color: "rose" },
} satisfies Record<string, CustomTableEnumValue>;

const LABEL_COLORS: Record<string, string> = {
  founder: "violet",
  beta: "cyan",
  vip: "yellow",
  partner: "teal",
  intern: "pink",
};

const FIRST_NAMES = [
  "Amina",
  "Youssef",
  "Sofia",
  "Karim",
  "Lina",
  "Omar",
  "Nadia",
  "Rayan",
];
const LAST_NAMES = [
  "Benali",
  "Haddad",
  "Cherkaoui",
  "Ziani",
  "Otmani",
  "Fassi",
];
const STATUSES = ["ACTIVE", "PENDING", "BANNED", undefined] as const;

// fixed epoch, not Date.now() — a module-scope clock read differs between the
// server render and the client hydration and blows up as a mismatch
const EPOCH = new Date("2026-07-27T12:00:00Z").getTime();

// deterministic so server and client render the same rows
const ROWS: Row[] = Array.from({ length: 43 }, (_, i) => {
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
  const labels = Object.keys(LABEL_COLORS).slice(0, i % 5);
  return {
    id: `usr_${String(i).padStart(3, "0")}_9f4c2ba7e1d${i}`,
    name,
    email: `${name.split(" ")[0]?.toLowerCase()}${i}@example.com`,
    url: `https://example.com/profile/${i}`,
    credits: (i * 137) % 5000,
    status: STATUSES[i % STATUSES.length],
    verified: i % 3 !== 0,
    joinedAt: i % 7 === 0 ? undefined : new Date(EPOCH - i * 36_000_000),
    labels,
  };
});

const toLabelTag = (label: string): CustomTableEnumValue => ({
  label,
  icon: Tag01Icon,
  color: LABEL_COLORS[label] ?? "gray",
  keywords: [`${label}-team`],
});

const columns: CustomTableColumn<Row>[] = [
  {
    id: "id",
    label: "ID",
    icon: Key01Icon,
    type: "string",
    monospace: true,
    truncate: "middle",
    getString: (row) => row.id,
  },
  {
    id: "name",
    label: "Name",
    icon: UserIcon,
    type: "string",
    getString: (row) => row.name,
    onClick: (row) => alert(`Clicked ${row.name}`),
  },
  {
    id: "email",
    label: "Email",
    icon: Mail01Icon,
    type: "string",
    getString: (row) => row.email,
  },
  {
    id: "credits",
    label: "Credits",
    icon: Coins01Icon,
    type: "string",
    align: "right",
    filterType: "number",
    getString: (row) => row.credits.toLocaleString(),
    getNumber: (row) => row.credits,
  },
  {
    id: "status",
    label: "Status",
    icon: StarIcon,
    type: "enum",
    enumOptions: statusOptions,
    getValue: (row) => row.status,
    getPopoverContent: (row) => (
      <span className="text-sm">
        {row.name} is currently {row.status?.toLowerCase() ?? "unset"}.
      </span>
    ),
  },
  {
    id: "labels",
    label: "Labels",
    icon: Tag01Icon,
    type: "tags",
    getTags: (row) => row.labels.map(toLabelTag),
  },
  {
    id: "verified",
    label: "Verified",
    icon: CheckmarkBadge02Icon,
    type: "boolean",
    getBoolean: (row) => row.verified,
  },
  {
    id: "joinedAt",
    label: "Joined",
    icon: Calendar04Icon,
    type: "date",
    getDate: (row) => row.joinedAt,
  },
  {
    id: "url",
    label: "Link",
    icon: Link01Icon,
    type: "copy",
    searchable: false,
    getString: (row) => row.url,
  },
  {
    id: "actions",
    label: "Actions",
    icon: Delete02Icon,
    type: "buttons",
    getButtons: (row) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => alert(`Delete ${row.name}`)}
      >
        Delete
      </Button>
    ),
  },
];

// CustomTable/SearchBar read the URL via nuqs (useSearchParams), which Next.js
// requires a Suspense boundary around wherever it's statically prerendered
function TableDemo() {
  const [resultCount, setResultCount] = useState(ROWS.length);

  return (
    <div className="flex flex-col gap-4 p-5">
      <SearchBar
        className="flex-1"
        placeholder="Search people..."
        trailing={`${resultCount} ${resultCount === 1 ? "person" : "people"}`}
      />
      <CustomTable
        {...{ columns }}
        items={ROWS}
        getItemId={(row) => row.id}
        selectable
        emptyLabel="people"
        exportFilePrefix="people"
        onVisibleCountChange={setResultCount}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TableDemo />
    </Suspense>
  );
}
