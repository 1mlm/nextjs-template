import { ColumnType, type CustomTableColumn } from "./columns";

export type MergeRun = { isStart: boolean; length: number };

// one entry per row: the first row of a run of equal values starts it and
// knows how many rows it spans, the rest are swallowed by it. computed over
// the current page only, a run cut by a page break just becomes two cells
function getColumnRuns(keys: string[]): MergeRun[] {
  return keys.map((key, index) => {
    if (index > 0 && keys[index - 1] === key)
      return { isStart: false, length: 0 };
    const nextDifferentIndex = keys.findIndex(
      (otherKey, otherIndex) => otherIndex > index && otherKey !== key,
    );
    const runEnd = nextDifferentIndex === -1 ? keys.length : nextDifferentIndex;
    return { isStart: true, length: runEnd - index };
  });
}

export function getMergeRuns<T>(
  columns: CustomTableColumn<T>[],
  pageItems: T[],
): Map<string, MergeRun[]> {
  const mergeableColumns = columns.flatMap((column) =>
    column.type === ColumnType.String && column.mergeAdjacent ? [column] : [],
  );
  return new Map(
    mergeableColumns.map((column) => {
      const getKey = column.getMergeKey ?? column.getString;
      return [column.id, getColumnRuns(pageItems.map(getKey))];
    }),
  );
}
