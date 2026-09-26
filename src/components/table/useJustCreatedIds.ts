import { useEffect, useRef, useState } from "react";

// ids that showed up in `items` after the first render, newest first. feed
// it to CustomTable's pinnedItemIds so rows you just created sit on top with
// a highlight. lives in memory only, a refresh drops them back into the
// normal sort which is exactly what you want
export function useJustCreatedIds<T>(
  items: T[],
  getItemId: (item: T) => string,
) {
  const previousIds = useRef<Set<string>>(undefined);
  const [justCreatedIds, setJustCreatedIds] = useState<string[]>([]);

  useEffect(() => {
    const currentIds = items.map(getItemId);
    const knownIds = previousIds.current;
    previousIds.current = new Set(currentIds);
    if (!knownIds) return;
    const addedIds = currentIds.filter((id) => !knownIds.has(id));
    if (addedIds.length > 0)
      setJustCreatedIds((current) => [...addedIds, ...current]);
  }, [items, getItemId]);

  return justCreatedIds;
}
