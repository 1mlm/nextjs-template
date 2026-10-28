"use client";

import { Comment01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useState } from "react";
import { Icon } from "@/components/Icon";
import type { KanbanColumnData } from "@/components/kanban/columns";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { getColorStyle } from "@/utils/color";
import { APP_ICONS } from "@/utils/icons";
import { runUndoableAction } from "@/utils/undoableAction";

type Task = {
  id: string;
  title: string;
  label?: { name: string; color: string };
  assignee: string;
  comments: number;
};

const LABELS = {
  bug: { name: "bug", color: "red" },
  design: { name: "design", color: "violet" },
  feature: { name: "feature", color: "sky" },
  chore: { name: "chore", color: "amber" },
};

const INITIAL_COLUMNS: KanbanColumnData<Task>[] = [
  {
    id: "backlog",
    title: "Backlog",
    color: "slate",
    items: [
      {
        id: "t1",
        title: "Dark mode for the settings page",
        label: LABELS.design,
        assignee: "Amina Idrissi",
        comments: 2,
      },
      {
        id: "t2",
        title: "Export a table to csv",
        label: LABELS.feature,
        assignee: "Youssef Alami",
        comments: 0,
      },
      {
        id: "t3",
        title: "Upgrade to the new router",
        label: LABELS.chore,
        assignee: "Omar Tazi",
        comments: 5,
      },
      {
        id: "t4",
        title: "Empty states for every list",
        label: LABELS.design,
        assignee: "Sara Benani",
        comments: 1,
      },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    color: "sky",
    limit: 3,
    items: [
      {
        id: "t5",
        title: "Tooltip flickers on touch",
        label: LABELS.bug,
        assignee: "Lina Berrada",
        comments: 3,
      },
      {
        id: "t6",
        title: "Onboarding tour",
        label: LABELS.feature,
        assignee: "Malik",
        comments: 8,
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "amber",
    items: [
      {
        id: "t7",
        title: "Fix the date picker default time",
        label: LABELS.bug,
        assignee: "Hamza Fassi",
        comments: 4,
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "emerald",
    items: [
      {
        id: "t8",
        title: "Offline page",
        label: LABELS.feature,
        assignee: "Malik",
        comments: 1,
      },
      {
        id: "t9",
        title: "Pie chart gaps",
        label: LABELS.bug,
        assignee: "Malik",
        comments: 0,
      },
    ],
  },
];

const getTaskId = (task: Task) => task.id;
const getTaskLabel = (task: Task) => task.title;

function AddCard({ onAdd }: { onAdd: (title: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding)
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Icon icon={APP_ICONS.add} />
        Add a card
      </Button>
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get("title");
        if (typeof title === "string" && title.trim()) onAdd(title.trim());
        setIsAdding(false);
      }}
    >
      <Input
        autoFocus
        name="title"
        placeholder="what needs doing, then enter"
        aria-label="New card title"
        onBlur={() => setIsAdding(false)}
        onKeyDown={(event) => event.key === "Escape" && setIsAdding(false)}
      />
    </form>
  );
}

export function KanbanDemo() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);

  const addTask = (columnId: string, title: string) =>
    setColumns((current) =>
      current.map((column) =>
        column.id === columnId
          ? {
              ...column,
              items: [
                ...column.items,
                { id: `t${Date.now()}`, title, assignee: "Malik", comments: 0 },
              ],
            }
          : column,
      ),
    );

  // gone right away, back in the same spot if you hit undo
  const deleteTask = useCallback((task: Task) => {
    let columnId = "";
    let index = 0;
    setColumns((current) =>
      current.map((column) => {
        const taskIndex = column.items.findIndex((item) => item.id === task.id);
        if (taskIndex < 0) return column;
        columnId = column.id;
        index = taskIndex;
        return {
          ...column,
          items: column.items.filter((item) => item.id !== task.id),
        };
      }),
    );
    runUndoableAction({
      message: `"${task.title}" deleted`,
      // demo only, nothing to persist
      commit: async () => ({ error: null }),
      onRevert: () =>
        setColumns((current) =>
          current.map((column) =>
            column.id === columnId
              ? {
                  ...column,
                  items: [
                    ...column.items.slice(0, index),
                    task,
                    ...column.items.slice(index),
                  ],
                }
              : column,
          ),
        ),
    });
  }, []);

  const renderCard = useCallback(
    (task: Task) => (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex flex-col gap-2">
            <span className="font-medium">{task.title}</span>
            <div className="flex items-center gap-2">
              {task.label && (
                <span
                  style={getColorStyle(task.label.color)}
                  className="rounded-md px-1.5 py-0.5 text-xs font-medium"
                >
                  {task.label.name}
                </span>
              )}
              {task.comments > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <Icon icon={Comment01Icon} />
                  {task.comments}
                </span>
              )}
              <UserAvatar name={task.assignee} className="ml-auto size-6" />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            variant="destructive"
            onSelect={() => deleteTask(task)}
          >
            <Icon icon={APP_ICONS.remove} />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
    [deleteTask],
  );

  return (
    <KanbanBoard
      {...{ columns, renderCard }}
      onColumnsChange={setColumns}
      getItemId={getTaskId}
      getItemLabel={getTaskLabel}
      renderColumnFooter={(column) => (
        <AddCard onAdd={(title) => addTask(column.id, title)} />
      )}
      className="h-[30rem] w-full"
    />
  );
}
