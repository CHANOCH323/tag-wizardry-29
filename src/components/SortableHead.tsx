import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortKey = "question" | "answer_type" | "is_draft" | "last_editor" | "updated_at" | "created_at" | "version_count";
export type SortDir = "asc" | "desc";

interface Props {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}

export default function SortableHead({ label, sortKey, currentKey, currentDir, onSort }: Props) {
  const active = currentKey === sortKey;
  return (
    <TableHead
      className="text-right font-semibold cursor-pointer select-none hover:bg-muted/30 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </TableHead>
  );
}
