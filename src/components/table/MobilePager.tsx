import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

// the card list's own pager, at the end of the list where a thumb arrives. the
// floating bar's pagination is for the table, over cards it would sit on the
// last card
export function MobilePager({
  currentPage,
  pageCount,
  setPage,
}: {
  currentPage: number;
  pageCount: number;
  setPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-1 pb-2">
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
      >
        <Icon icon={ArrowLeft01Icon} />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        {currentPage} / {pageCount}
      </span>
      <Button
        variant="outline"
        disabled={currentPage === pageCount}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
        <Icon icon={ArrowRight01Icon} />
      </Button>
    </div>
  );
}
