import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, History } from "lucide-react";
import { format } from "date-fns";
import CubesPieChart from "./CubesPieChart";
import SortableHead, { SortDir, SortKey } from "./SortableHead";
import DeleteTagDialog from "./DeleteTagDialog";
import { strings } from "@/constants/strings";
import type { TagDto } from "@/services/api.types";

interface Props {
  tags: TagDto[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

function TagAnswerCell({ tag }: { tag: TagDto }) {
  if (tag.answer_type === "cubes" && tag.cubes) {
    return (
      <div className="flex items-center gap-2">
        <CubesPieChart cubes={tag.cubes} />
        <div className="flex flex-wrap gap-1">
          {tag.cubes.map((c) => (
            <Badge key={c.cube_id} variant="outline" className="text-xs">
              {c.cube_name}
            </Badge>
          ))}
        </div>
      </div>
    );
  }
  return <span className="text-sm truncate block">{tag.free_text_content || "-"}</span>;
}

function TagActionsCell({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Edit className="h-4 w-4" />
      </Button>
      <DeleteTagDialog onConfirm={onDelete} />
    </div>
  );
}

export default function TagsTable({ tags, onEdit, onDelete, onViewHistory }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedTags = [...tags];
  if (sortKey) {
    sortedTags.sort((a, b) => {
      let cmp = 0;
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb, "he");
      } else if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else if (typeof va === "boolean" && typeof vb === "boolean") {
        cmp = (va ? 1 : 0) - (vb ? 1 : 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold">{strings.common.id}</TableHead>
              <SortableHead label={strings.tags.question} sortKey="question" {...sortProps} />
              <SortableHead label={strings.tags.answerType} sortKey="answer_type" {...sortProps} />
              <TableHead className="text-right font-semibold">{strings.tags.answerValue}</TableHead>
              <SortableHead label={strings.tags.draft} sortKey="is_draft" {...sortProps} />
              <SortableHead label={strings.tags.lastEditor} sortKey="last_editor" {...sortProps} />
              <SortableHead label={strings.tags.updated} sortKey="updated_at" {...sortProps} />
              <SortableHead label={strings.tags.created} sortKey="created_at" {...sortProps} />
              <SortableHead label={strings.tags.versions} sortKey="version_count" {...sortProps} />
              <TableHead className="text-right font-semibold">{strings.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  {strings.tags.noTags}
                </TableCell>
              </TableRow>
            ) : (
              sortedTags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{tag.id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium">{tag.question}</TableCell>
                  <TableCell>
                    <Badge variant={tag.answer_type === "cubes" ? "default" : "secondary"}>
                      {tag.answer_type === "cubes" ? strings.tags.cubes : strings.tags.freeText}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <TagAnswerCell tag={tag} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={tag.is_draft ? "destructive" : "outline"} className="text-xs">
                      {tag.is_draft ? strings.common.yes : strings.common.no}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{tag.last_editor}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(tag.updated_at), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(tag.created_at), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewHistory(tag.id)}>
                      <History className="h-4 w-4" />
                      <span className="sr-only">{strings.common.history}</span>
                    </Button>
                    <Badge variant="secondary">{tag.version_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <TagActionsCell onEdit={() => onEdit(tag.id)} onDelete={() => onDelete(tag.id)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
