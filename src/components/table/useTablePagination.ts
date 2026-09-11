import { parseAsInteger, useQueryState } from "nuqs";

const PAGE_SIZE = 25;

// slices an already filtered/sorted item list into pages, clamping the
// URL-driven page number into range (e.g. after a filter shrinks the result
// count below the previously-viewed page)
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
