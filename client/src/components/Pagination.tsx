import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from "lucide-react";
import { strings } from "@/constants/strings";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface Props {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: Props) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{strings.pagination.rowsPerPage}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="mr-4">
          {start}–{end} {strings.pagination.of} {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm font-medium">
          {strings.pagination.page} {currentPage} {strings.pagination.of} {totalPages}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
