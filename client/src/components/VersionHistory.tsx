import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { History, ChevronDown, ChevronUp, GitCompare } from "lucide-react";
import CubesPieChart from "./CubesPieChart";
import { strings } from "@/constants/strings";
import { fetchTagVersions } from "@/services/api";
import type { VersionDto, CubeEntryDto } from "@/services/api.types";

interface Props {
  open: boolean;
  onClose: () => void;
  tagId: string | null;
}

function VersionDetail({ version }: { version: VersionDto }) {
  const s = strings.versionHistory;
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-muted-foreground">{s.questionLabel}</span>
          <p className="font-medium mt-1">{version.question}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{s.answerTypeLabel}</span>
          <p className="mt-1">
            <Badge variant={version.answer_type === "cubes" ? "default" : "secondary"}>
              {version.answer_type === "cubes" ? strings.tags.cubes : strings.tags.freeText}
            </Badge>
          </p>
        </div>
      </div>

      {version.answer_type === "cubes" && version.cubes && (
        <div className="space-y-2">
          <span className="text-muted-foreground">{s.cubesLabel}</span>
          <div className="flex items-center gap-3">
            <CubesPieChart cubes={version.cubes} />
            <div className="flex flex-wrap gap-1">
              {version.cubes.map((c) => (
                <Badge key={c.cube_id} variant="outline" className="text-xs">
                  {c.cube_name} ({c.weight}%)
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>TOP X: {version.top_x}</span>
            <span>{s.weightThresholdField}: {version.total_weight_threshold}%</span>
          </div>
        </div>
      )}

      {version.answer_type === "free_text" && (
        <div>
          <span className="text-muted-foreground">{s.contentLabel}</span>
          <p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-2">{version.free_text_content || "-"}</p>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{s.draftLabel} {version.is_draft ? strings.common.yes : strings.common.no}</span>
        {version.changed_fields && version.changed_fields.length > 0 && (
          <span>{s.changedFieldsLabel} {version.changed_fields.join(", ")}</span>
        )}
      </div>
    </div>
  );
}

function VersionCompare({ a, b, onBack }: { a: VersionDto; b: VersionDto; onBack: () => void }) {
  const s = strings.versionHistory;
  const diffs: string[] = [];
  if (a.question !== b.question) diffs.push(s.questionField);
  if (a.answer_type !== b.answer_type) diffs.push(s.answerTypeField);
  if (JSON.stringify(a.cubes) !== JSON.stringify(b.cubes)) diffs.push(s.cubesField);
  if (a.free_text_content !== b.free_text_content) diffs.push(s.freeTextContentField);
  if (a.is_draft !== b.is_draft) diffs.push(s.draftStatusField);
  if (a.top_x !== b.top_x) diffs.push(s.topXField);
  if (a.total_weight_threshold !== b.total_weight_threshold) diffs.push(s.weightThresholdField);

  return (
    <div className="space-y-4 flex-1 overflow-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          {s.compareVersions}
        </h3>
        <Button variant="outline" size="sm" onClick={onBack}>{s.backToList}</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((v) => (
          <div key={v.id} className="rounded-lg border p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-2">
              {s.versionFrom}{format(new Date(v.created_at), "dd/MM/yy HH:mm")} | {v.editor_name}
            </div>
            <VersionDetail version={v} />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-3 space-y-2">
        <h4 className="text-sm font-semibold">{s.differences}</h4>
        {diffs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {diffs.map((d) => <Badge key={d} variant="destructive" className="text-xs">{d}</Badge>)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{s.noDifferences}</p>
        )}
      </div>
    </div>
  );
}

function VersionListItem({
  version,
  index,
  total,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleCompare,
}: {
  version: VersionDto;
  index: number;
  total: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleCompare: () => void;
}) {
  const s = strings.versionHistory;
  return (
    <div className={`rounded-lg border p-3 transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
            {index === 0 ? s.current : `v${total - index}`}
          </Badge>
          <span className="text-sm font-medium truncate max-w-[200px]">{version.question}</span>
          {version.is_draft && <Badge variant="destructive" className="text-xs">{strings.tags.draft}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {version.editor_name} | {format(new Date(version.created_at), "dd/MM/yy HH:mm")}
          </span>
          {total > 1 && (
            <Button variant={isSelected ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={onToggleCompare}>
              <GitCompare className="h-3 w-3 mr-1" />
              {isSelected ? s.selected : s.compare}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleExpand}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <>
          <Separator className="my-3" />
          <VersionDetail version={version} />
        </>
      )}
    </div>
  );
}

export default function VersionHistory({ open, onClose, tagId }: Props) {
  const [versions, setVersions] = useState<VersionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && tagId) {
      loadVersions(tagId);
      setCompareIds([null, null]);
      setExpandedId(null);
    }
  }, [open, tagId]);

  const loadVersions = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchTagVersions(id);
      setVersions(data);
    } catch {
      setVersions([]);
    }
    setLoading(false);
  };

  const toggleCompare = (id: string) => {
    setCompareIds(([a, b]) => {
      if (a === id) return [b, null];
      if (b === id) return [a, null];
      if (!a) return [id, null];
      if (!b) return [a, id];
      return [a, id];
    });
  };

  const compareA = versions.find((v) => v.id === compareIds[0]);
  const compareB = versions.find((v) => v.id === compareIds[1]);
  const isComparing = compareA && compareB;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {strings.versionHistory.title}
            <Badge variant="secondary">{versions.length} {strings.versionHistory.versionsCount}</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{strings.common.loading}</div>
        ) : isComparing ? (
          <VersionCompare a={compareA} b={compareB} onBack={() => setCompareIds([null, null])} />
        ) : (
          <ScrollArea className="flex-1 max-h-[65vh]">
            <div className="space-y-2 pr-4">
              {versions.length > 1 && (
                <p className="text-xs text-muted-foreground mb-3">{strings.versionHistory.selectToCompare}</p>
              )}
              {versions.map((v, i) => (
                <VersionListItem
                  key={v.id}
                  version={v}
                  index={i}
                  total={versions.length}
                  isExpanded={expandedId === v.id}
                  isSelected={compareIds.includes(v.id)}
                  onToggleExpand={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  onToggleCompare={() => toggleCompare(v.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
