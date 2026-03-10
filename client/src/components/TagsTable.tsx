import { useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, History, GitBranch } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import CubesPieChart from "./CubesPieChart";
import SortableHead, { SortDir, SortKey } from "./SortableHead";
import DeleteTagDialog from "./DeleteTagDialog";
import { strings } from "@/constants/strings";
import { fetchTagVersions } from "@/services/api";
import type { TagDto, VersionDto } from "@/services/api.types";

interface Props {
  tags: TagDto[];
  onEdit: (id: string, version?: VersionDto | null) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

function TagAnswerCell({ tag }: { tag: TagDto }) {
  if (tag.answer_type === "cubes" && tag.cubes) {
    return (
      <div className="flex items-center gap-2 min-w-0 overflow-visible">
        <div className="shrink-0">
          <CubesPieChart cubes={tag.cubes} />
        </div>
        <div className="flex flex-wrap gap-1 min-w-0">
          {tag.cubes.map((c) => (
            <Badge key={c.cube_id} variant="outline" className="text-xs">
              {c.cube_name}
            </Badge>
          ))}
        </div>
      </div>
    );
  }
  return <span className="text-sm truncate block max-w-full">{tag.free_text_content || "-"}</span>;
}

export default function TagsTable({ tags, onEdit, onDelete, onViewHistory }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewingVersion, setViewingVersion] = useState<Record<string, VersionDto | null>>({});
  const [selectorOpen, setSelectorOpen] = useState<string | null>(null);
  const [selectorVersions, setSelectorVersions] = useState<VersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleVersionChange = (tagId: string, version: VersionDto | null) => {
    setViewingVersion((v) => ({ ...v, [tagId]: version }));
  };

  const openVersionSelector = async (tagId: string) => {
    setSelectorOpen(tagId);
    setSelectedVersionId(viewingVersion[tagId]?.id || null);
    try {
      const versions = await fetchTagVersions(tagId);
      setSelectorVersions(versions);
    } catch {
      setSelectorVersions([]);
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

  const getDisplayTag = (tag: TagDto): TagDto => {
    const v = viewingVersion[tag.id];
    if (!v) return tag;
    return {
      ...tag,
      question: v.question,
      answer_type: v.answer_type,
      cubes: v.cubes,
      free_text_content: v.free_text_content,
      last_editor: v.editor_name ?? tag.last_editor,
    };
  };

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
              <TableHead className="text-right font-semibold">{strings.tags.versions}</TableHead>
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
              sortedTags.map((tag) => {
                const displayTag = getDisplayTag(tag);
                const v = viewingVersion[tag.id];
                return (
                  <TableRow key={tag.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{tag.id.slice(0, 8)}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">{displayTag.question}</TableCell>
                    <TableCell>
                      <Badge variant={displayTag.answer_type === "cubes" ? "default" : "secondary"}>
                        {displayTag.answer_type === "cubes" ? strings.tags.cubes : strings.tags.freeText}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <TagAnswerCell tag={displayTag} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={displayTag.is_draft ? "destructive" : "outline"} className="text-xs">
                        {displayTag.is_draft ? strings.common.yes : strings.common.no}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{displayTag.last_editor}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(tag.updated_at), "dd/MM/yy HH:mm")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(tag.created_at), "dd/MM/yy HH:mm")}</TableCell>
                    <TableCell className="text-center">{tag.version_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 items-center justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tag.id, v ?? undefined)} title={strings.common.edit}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openVersionSelector(tag.id)} title={strings.versionSelector.selectVersion}>
                          <GitBranch className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewHistory(tag.id)} title={strings.common.history}>
                          <History className="h-4 w-4" />
                        </Button>
                        <DeleteTagDialog onConfirm={() => onDelete(tag.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectorOpen} onOpenChange={() => setSelectorOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{strings.versionSelector.selectVersion}</DialogTitle>
          </DialogHeader>
          <RadioGroup value={selectedVersionId || ""} onValueChange={setSelectedVersionId}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="current" />
              <Label htmlFor="current">{strings.versionSelector.current}</Label>
            </div>
            {selectorVersions.map((v, i) => (
              <div key={v.id} className="flex items-center space-x-2">
                <RadioGroupItem value={v.id} id={v.id} />
                <Label htmlFor={v.id}>v{selectorVersions.length - i} - {v.question.slice(0, 30)}...</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectorOpen(null)}>{strings.common.cancel}</Button>
            <Button onClick={() => {
              if (selectorOpen) {
                const version = selectedVersionId ? selectorVersions.find(v => v.id === selectedVersionId) || null : null;
                handleVersionChange(selectorOpen, version);
                setSelectorOpen(null);
              }
            }}>{strings.common.save}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
