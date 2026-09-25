"use client";

import { Search02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shadcn/ui/input-group";

export const DEFAULT_SEARCH_QUERY_KEY = "q";

export function SearchBar({
  placeholder = "Search...",
  icon = Search02Icon,
  // pass a matching searchQueryKey to CustomTable when overriding this
  queryKey = DEFAULT_SEARCH_QUERY_KEY,
  trailing,
  className,
}: {
  placeholder?: string;
  icon?: IconSvgElement;
  queryKey?: string;
  // right-aligned slot, e.g. a "12 users" result count
  trailing?: ReactNode;
  className?: string;
}) {
  const [search, setSearch] = useQueryState(queryKey, { defaultValue: "" });

  return (
    <InputGroup {...{ className }}>
      <InputGroupAddon>
        <Icon {...{ icon }} />
      </InputGroupAddon>
      <InputGroupInput
        {...{ placeholder }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {trailing && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{trailing}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
