"use client";

import {
  Add01Icon,
  Alert02Icon,
  Calendar04Icon,
  CheckmarkBadge02Icon,
  Coins01Icon,
  Copy01Icon,
  Delete02Icon,
  Key01Icon,
  Link01Icon,
  Mail01Icon,
  MoreVerticalIcon,
  Note01Icon,
  StarIcon,
  Tag01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Suspense, useMemo, useState } from "react";
import { ErrorTooltip } from "@/components/ErrorTooltip";
import { Icon } from "@/components/Icon";
import { SearchBar } from "@/components/SearchBar";
import { CustomTable } from "@/components/table/CustomTable";
import {
  ColumnAlign,
  ColumnType,
  type CustomTableColumn,
  type CustomTableEnumValue,
  StringFilterType,
} from "@/components/table/columns";
import { DeleteRowMenuItem } from "@/components/table/DeleteRowMenuItem";
import { SortDirection } from "@/components/table/filtering";
import { CopyMenuItem, RowMenu } from "@/components/table/RowMenu";
import { useJustCreatedIds } from "@/components/table/useJustCreatedIds";
import { useOptimisticRowRemoval } from "@/components/table/useOptimisticRowRemoval";
import { Button } from "@/shadcn/ui/button";
import { ContextMenuItem } from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { useCopyToClipboard } from "@/utils/clipboard";

type Row = {
  id: string;
  name: string;
  email: string;
  team: string;
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
const TEAMS = ["Design", "Engineering", "Growth", "Support"];
const NOTE_MAX_LENGTH = 20;

// fixed epoch, not Date.now(), a module-scope clock read differs between the
// server render and the client hydration and blows up as a mismatch
const EPOCH = new Date("2026-07-27T12:00:00Z").getTime();

// deterministic so server and client render the same rows
const makeRow = (i: number): Row => {
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
  const labels = Object.keys(LABEL_COLORS).slice(0, i % 5);
  return {
    id: `usr_${String(i).padStart(3, "0")}_9f4c2ba7e1d${i}`,
    name,
    email: `${name.split(" ")[0]?.toLowerCase()}${i}@example.com`,
    team: TEAMS[i % TEAMS.length] ?? "Support",
    url: `https://example.com/profile/${i}`,
    credits: (i * 137) % 5000,
    status: STATUSES[i % STATUSES.length],
    verified: i % 3 !== 0,
    joinedAt: i % 7 === 0 ? undefined : new Date(EPOCH - i * 36_000_000),
    labels,
  };
};

const ROWS = Array.from({ length: 43 }, (_, i) => makeRow(i));

// groups the table by team so the merged team cells show up untouched
const DEFAULT_SORT = [
  { columnId: "team", dir: SortDirection.Asc },
  { columnId: "name", dir: SortDirection.Asc },
];

const getRowId = (row: Row) => row.id;

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
    type: ColumnType.String,
    monospace: true,
    truncate: "middle",
    getString: (row) => row.id,
  },
  {
    id: "name",
    label: "Name",
    icon: UserIcon,
    type: ColumnType.String,
    getString: (row) => row.name,
    onClick: (row) => alert(`Clicked ${row.name}`),
  },
  {
    id: "email",
    label: "Email",
    icon: Mail01Icon,
    type: ColumnType.String,
    getString: (row) => row.email,
  },
  {
    id: "team",
    label: "Team",
    icon: UserGroupIcon,
    type: ColumnType.String,
    mergeAdjacent: true,
    getString: (row) => row.team,
  },
  {
    id: "credits",
    label: "Credits",
    icon: Coins01Icon,
    type: ColumnType.String,
    align: ColumnAlign.Right,
    filterType: StringFilterType.Number,
    getString: (row) => row.credits.toLocaleString("en-US"),
    getNumber: (row) => row.credits,
  },
  {
    id: "status",
    label: "Status",
    icon: StarIcon,
    type: ColumnType.Enum,
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
    type: ColumnType.Tags,
    getTags: (row) => row.labels.map(toLabelTag),
  },
  {
    id: "verified",
    label: "Verified",
    icon: CheckmarkBadge02Icon,
    type: ColumnType.Boolean,
    getBoolean: (row) => row.verified,
  },
  {
    id: "joinedAt",
    label: "Joined",
    icon: Calendar04Icon,
    type: ColumnType.Date,
    getDate: (row) => row.joinedAt,
  },
  {
    id: "url",
    label: "Link",
    icon: Link01Icon,
    type: ColumnType.Copy,
    searchable: false,
    getString: (row) => row.url,
  },
];

// CustomTable/SearchBar read the url through nuqs (useSearchParams), and next
// wants a suspense boundary around that on a static page or the build yells
function CopyEmailsButton({ rows }: { rows: Row[] }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <Button
      variant="outline"
      className="shadow-lg"
      onClick={() => copy(rows.map((row) => row.email).join(", "))}
    >
      <Icon icon={Copy01Icon} />
      {copied ? "Copied!" : "Copy emails"}
    </Button>
  );
}

function TableDemo() {
  const [resultCount, setResultCount] = useState(ROWS.length);
  const [createdRows, setCreatedRows] = useState<Row[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  const allRows = useMemo(
    () => [...createdRows, ...ROWS].filter((row) => !deletedIds.has(row.id)),
    [createdRows, deletedIds],
  );
  const justCreatedIds = useJustCreatedIds(allRows, getRowId);
  const { visibleItems, markRemoved, unmarkRemoved } = useOptimisticRowRemoval(
    allRows,
    getRowId,
  );

  const addPerson = () =>
    setCreatedRows((rows) => [
      { ...makeRow(ROWS.length + rows.length), joinedAt: new Date() },
      ...rows,
    ]);

  const getNote = (row: Row) => notes[row.id] ?? "";
  const isNoteTooLong = (row: Row) => getNote(row).length > NOTE_MAX_LENGTH;

  const columnsWithActions: CustomTableColumn<Row>[] = [
    ...columns,
    {
      id: "note",
      label: "Note",
      icon: Note01Icon,
      type: ColumnType.String,
      getString: getNote,
      getCellError: isNoteTooLong,
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <Input
            value={getNote(row)}
            onChange={(event) =>
              setNotes((current) => ({
                ...current,
                [row.id]: event.target.value,
              }))
            }
            placeholder="add a note"
            aria-label={`Note for ${row.name}`}
            aria-invalid={isNoteTooLong(row)}
            className="h-7 min-w-32 bg-transparent"
          />
          {isNoteTooLong(row) && (
            <ErrorTooltip
              message={`${NOTE_MAX_LENGTH} characters max, this one has ${getNote(row).length}`}
            />
          )}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      icon: Delete02Icon,
      type: ColumnType.Buttons,
      getButtons: (row) => (
        <RowMenu ariaLabel={`Actions for ${row.name}`} icon={MoreVerticalIcon}>
          <CopyMenuItem value={row.id} label="Copy ID" copiedLabel="Copied!" />
          <DeleteRowMenuItem
            label="Delete"
            message={`${row.name} deleted`}
            onOptimisticRemove={() => markRemoved(row.id)}
            onRevert={() => unmarkRemoved(row.id)}
            // demo only, nothing to actually persist to
            commit={async () => ({ error: null })}
          />
        </RowMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex gap-2">
        <SearchBar
          className="flex-1"
          placeholder="Search people..."
          trailing={`${resultCount} ${resultCount === 1 ? "person" : "people"}`}
        />
        <Button onClick={addPerson}>
          <Icon icon={Add01Icon} />
          <span className="max-sm:sr-only">Add person</span>
        </Button>
      </div>
      <CustomTable
        columns={columnsWithActions}
        items={visibleItems}
        getItemId={getRowId}
        selectable
        emptyLabel="people"
        exportFilePrefix="people"
        onVisibleCountChange={setResultCount}
        defaultSort={DEFAULT_SORT}
        pinnedItemIds={justCreatedIds}
        selectionActions={(rows) => <CopyEmailsButton {...{ rows }} />}
        getRowMenuItems={(row) => (
          <ContextMenuItem asChild>
            <a href={`mailto:${row.email}`}>
              <Icon icon={Mail01Icon} />
              Email {row.name.split(" ")[0]}
            </a>
          </ContextMenuItem>
        )}
        onDeleteSelected={async (rows) =>
          setDeletedIds(
            (current) => new Set([...current, ...rows.map(getRowId)]),
          )
        }
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
