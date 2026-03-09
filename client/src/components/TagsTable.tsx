import { useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, History, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
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

function VersionSwitcher({
  tagId,
  versionCount,
  viewingVersion,
  onVersionChange,
  onViewHistory,
}: {
  tagId: string;
  versionCount: number;
  viewingVersion: VersionDto | null;
  onVersionChange: (tagId: string, version: VersionDto | null) => void;
  onViewHistory: () => void;
}) {
  const [versions, setVersions] = useState<VersionDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const s = strings.versionSelector;
  const currentIndex = viewingVersion && versions ? versions.findIndex((v) => v.id === viewingVersion.id) : 0;
  const displayIndex = currentIndex >= 0 ? currentIndex : 0;

  const loadVersions = useCallback(async (): Promise<VersionDto[]> => {
    if (versions && versions.length > 0) return versions;
    setLoading(true);
    try {
      const data = await fetchTagVersions(tagId);
      setVersions(data);
      return data;
    } catch {
      setVersions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [tagId, versions]);

  const goPrev = async () => {
    const v = await loadVersions();
    if (v.length < 2) return;
    const next = displayIndex - 1;
    if (next >= 0) onVersionChange(tagId, v[next]);
  };

  const goNext = async () => {
    const v = await loadVersions();
    if (v.length < 2) return;
    const next = displayIndex + 1;
    if (next < v.length) onVersionChange(tagId, v[next]);
  };

  const resetToLatest = () => {
    onVersionChange(tagId, null);
  };

  if (versionCount <= 1) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{versionCount}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onViewHistory} title={strings.common.history}>
          <History className="h-3.5 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goPrev}
        disabled={loading || displayIndex <= 0}
        title={s.current}
      >
        <ChevronRight className="h-3.5 w-3" />
      </Button>
      <button
        type="button"
        onClick={() => loadVersions()}
        className="min-w-[3rem] px-1.5 py-0.5 text-xs rounded hover:bg-muted"
        title={s.selectVersion}
      >
        {viewingVersion ? `${displayIndex + 1}/${versionCount}` : `1/${versionCount}`}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goNext}
        disabled={loading || (versions ? displayIndex >= versions.length - 1 : true)}
        title={s.version(2)}
      >
        <ChevronLeft className="h-3.5 w-3" />
      </Button>
      {viewingVersion && (
        <Button variant="ghost" size="sm" className="h-7 text-xs px-1.5" onClick={resetToLatest} title={s.current}>
          ✓
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onViewHistory} title={strings.common.history}>
        <History className="h-3.5 w-3" />
      </Button>
    </div>
  );
}

export default function TagsTable({ tags, onEdit, onDelete, onViewHistory }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewingVersion, setViewingVersion] = useState<Record<string, VersionDto | null>>({});

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
                    <TableCell>
                      <VersionSwitcher
                        tagId={tag.id}
                        versionCount={tag.version_count}
                        viewingVersion={v ?? null}
                        onVersionChange={handleVersionChange}
                        onViewHistory={() => onViewHistory(tag.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 items-center justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tag.id, v ?? undefined)} title={strings.common.edit}>
                          <Edit className="h-4 w-4" />
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
    </div>
  );
}
