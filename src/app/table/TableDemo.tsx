"use client";

import {
  CheckmarkBadge02Icon,
  Coins01Icon,
  Image01Icon,
  Key01Icon,
  Mail01Icon,
  MoreVerticalIcon,
  Note01Icon,
  QuotesIcon,
  StarIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";
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
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/shadcn/ui/button";
import { ContextMenuItem } from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { useCopyToClipboard } from "@/utils/clipboard";
import { APP_ICONS } from "@/utils/icons";
import { LABEL_COLORS, type Row, statusOptions } from "./data";

const NOTE_MAX_LENGTH = 20;

// groups the table by team so the merged team cells show up untouched
const DEFAULT_SORT = [
  { columnId: "team", dir: SortDirection.Asc },
  { columnId: "name", dir: SortDirection.Asc },
];

const getRowId = (row: Row) => row.id;

// cycles through the spares, a fresh id each lap so keys never collide
const getSpareRow = (spareRows: Row[], createdCount: number) => {
  const spare = spareRows[createdCount % spareRows.length];
  return (
    spare && {
      ...spare,
      id: `${spare.id}_${createdCount}`,
      joinedAt: new Date(),
    }
  );
};

const toLabelTag = (label: string): CustomTableEnumValue => ({
  label,
  icon: APP_ICONS.tag,
  color: LABEL_COLORS[label] ?? "gray",
  keywords: [`${label}-team`],
});

const columns: CustomTableColumn<Row>[] = [
  {
    id: "avatar",
    label: "Profile picture",
    icon: Image01Icon,
    iconOnly: true,
    type: ColumnType.String,
    getString: (row) => row.name,
    render: (row) => (
      <UserAvatar
        name={row.name}
        src={row.avatarUrl}
        className="mx-auto size-7"
      />
    ),
  },
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
    icon: APP_ICONS.user,
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
    id: "bio",
    label: "Bio",
    icon: QuotesIcon,
    type: ColumnType.String,
    longText: true,
    getString: (row) => row.bio,
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
    icon: APP_ICONS.tag,
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
    icon: APP_ICONS.calendar,
    type: ColumnType.Date,
    getDate: (row) => row.joinedAt,
  },
  {
    id: "url",
    label: "Link",
    icon: APP_ICONS.link,
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
      className="cursor-copy shadow-lg"
      onClick={() => copy(rows.map((row) => row.email).join(", "))}
    >
      <Icon icon={APP_ICONS.copy} />
      {copied ? "Copied!" : "Copy emails"}
    </Button>
  );
}

// rows come from the server (faker stays out of the browser bundle), plus
// spares that "Add person" hands out
export function TableDemo({
  rows: initialRows,
  spareRows,
}: {
  rows: Row[];
  spareRows: Row[];
}) {
  const [resultCount, setResultCount] = useState(initialRows.length);
  const [createdRows, setCreatedRows] = useState<Row[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  const allRows = useMemo(
    () =>
      [...createdRows, ...initialRows].filter((row) => !deletedIds.has(row.id)),
    [createdRows, initialRows, deletedIds],
  );
  const justCreatedIds = useJustCreatedIds(allRows, getRowId);
  const { visibleItems, markRemoved, unmarkRemoved } = useOptimisticRowRemoval(
    allRows,
    getRowId,
  );

  const addPerson = () => {
    const row = getSpareRow(spareRows, createdRows.length);
    if (row) setCreatedRows((rows) => [row, ...rows]);
  };

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
      icon: MoreVerticalIcon,
      iconOnly: true,
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
          <Icon icon={APP_ICONS.add} />
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
