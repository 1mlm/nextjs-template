import { parseAsInteger, useQueryState } from "nuqs";

const PAGE_SIZE = 25;

// slices the filtered/sorted list into pages and clamps the url page number
// into range (a filter can shrink the list below the page you were on)
export function useTablePagination<T>({
  items,
  paginate,
}: {
  items: T[];
  paginate: boolean;
}) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const pageCount = paginate
    ? Math.max(1, Math.ceil(items.length / PAGE_SIZE))
    : 1;
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const paginatedItems = paginate
    ? items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : items;

  return { page: currentPage, setPage, pageCount, paginatedItems };
}
