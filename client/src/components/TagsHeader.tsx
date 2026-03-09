import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";
import { strings } from "@/constants/strings";
import type { TagDto } from "@/services/api.types";
import * as XLSX from "xlsx";

interface Props {
  count: number;
  tags: TagDto[];
  onAdd: () => void;
}

function exportToExcel(tags: TagDto[]) {
  const data = tags.map((t) => ({
    [strings.export.id]: t.id,
    [strings.export.question]: t.question,
    [strings.export.answerType]: t.answer_type === "cubes" ? strings.tags.cubes : strings.tags.freeText,
    [strings.export.answerValue]: t.answer_type === "cubes" ? t.cubes?.map((c) => c.cube_name).join(", ") : t.free_text_content,
    [strings.export.draft]: t.is_draft ? strings.common.yes : strings.common.no,
    [strings.export.lastEditor]: t.last_editor,
    [strings.export.updatedAt]: t.updated_at,
    [strings.export.createdAt]: t.created_at,
    [strings.export.versions]: t.version_count,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, strings.export.sheetName);
  XLSX.writeFile(wb, "tags-export.xlsx");
}

export default function TagsHeader({ count, tags, onAdd }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold">{strings.tags.title}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          <Badge variant="secondary" className="font-mono">{count}</Badge>{" "}
          {strings.tags.recordsShown}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => exportToExcel(tags)} className="gap-2">
          <Download className="h-4 w-4" />
          {strings.tags.exportExcel}
        </Button>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {strings.tags.addQuestion}
        </Button>
      </div>
    </div>
  );
}
