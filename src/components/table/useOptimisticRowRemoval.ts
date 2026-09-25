"use client";

import { useCallback, useMemo, useState } from "react";

const getSettledError = (
  result: PromiseSettledResult<{ error: string | null }>,
) => {
  if (result.status === "fulfilled") return result.value.error;
  return result.reason instanceof Error
    ? result.reason.message
    : "Something went wrong";
};

// hides a row the moment its delete is confirmed instead of waiting on the
// server, rolls back on error. run your items through `visibleItems` before
// handing them to CustomTable
export function useOptimisticRowRemoval<T, K>(
  items: T[],
  getKey: (item: T) => K,
) {
  const [pendingRemoved, setPendingRemoved] = useState<Set<K>>(new Set());

  const visibleItems = useMemo(
    () => items.filter((item) => !pendingRemoved.has(getKey(item))),
    [items, pendingRemoved, getKey],
  );

  // stable identities (pure functional setState, no closed-over state) so
  // callers can safely list these in a useMemo/useCallback deps array
  // without defeating the memoization
  const markRemoved = useCallback(
    (key: K) => setPendingRemoved((prev) => new Set(prev).add(key)),
    [],
  );

  const unmarkRemoved = useCallback(
    (key: K) =>
      setPendingRemoved((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }),
    [],
  );

  // runs deleteAction per row in parallel, keeps only the failures visible
  // again, matches CustomTable's bulk-delete contract
  const deleteSelected = useCallback(
    async (
      rows: T[],
      deleteAction: (row: T) => Promise<{ error: string | null }>,
    ) => {
      const keys = rows.map(getKey);
      setPendingRemoved((prev) => new Set([...prev, ...keys]));

      // allSettled so one throwing delete doesn't strand every row in the batch hidden
      const results = await Promise.allSettled(rows.map(deleteAction));
      const errors = results.map(getSettledError);
      const failedKeys = rows.filter((_, i) => errors[i]).map(getKey);
      if (failedKeys.length > 0)
        setPendingRemoved((prev) => {
          const next = new Set(prev);
          for (const key of failedKeys) next.delete(key);
          return next;
        });

      return { error: errors.find(Boolean) ?? null };
    },
    [getKey],
  );

  return { visibleItems, markRemoved, unmarkRemoved, deleteSelected };
}
