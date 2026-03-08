import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { History, ChevronDown, ChevronUp, GitCompare } from "lucide-react";
import CubesPieChart from "./CubesPieChart";

interface CubeEntry {
  cube_id: string;
  cube_name: string;
  weight: number;
}

interface Version {
  id: string;
  question: string;
  answer_type: "cubes" | "free_text";
  cubes: CubeEntry[] | null;
  free_text_content: string | null;
  top_x: number | null;
  total_weight_threshold: number | null;
  is_draft: boolean;
  changed_fields: string[] | null;
  created_at: string;
  created_by: string;
  editor_name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  tagId: string | null;
}

export default function VersionHistory({ open, onClose, tagId }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && tagId) {
      fetchVersions(tagId);
      setCompareIds([null, null]);
      setExpandedId(null);
    }
  }, [open, tagId]);

  const fetchVersions = async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("tag_versions")
      .select("*")
      .eq("tag_id", id)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map((v) => v.created_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    setVersions(
      data.map((v) => ({
        ...v,
        answer_type: v.answer_type as "cubes" | "free_text",
        cubes: v.cubes as unknown as CubeEntry[] | null,
        editor_name: profileMap.get(v.created_by) || "לא ידוע",
      }))
    );
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

  const renderVersionDetail = (v: Version) => (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-muted-foreground">שאלה:</span>
          <p className="font-medium mt-1">{v.question}</p>
        </div>
        <div>
          <span className="text-muted-foreground">סוג תשובה:</span>
          <p className="mt-1">
            <Badge variant={v.answer_type === "cubes" ? "default" : "secondary"}>
              {v.answer_type === "cubes" ? "קוביות" : "טקסט חופשי"}
            </Badge>
          </p>
        </div>
      </div>

      {v.answer_type === "cubes" && v.cubes && (
        <div className="space-y-2">
          <span className="text-muted-foreground">קוביות:</span>
          <div className="flex items-center gap-3">
            <CubesPieChart cubes={v.cubes} />
            <div className="flex flex-wrap gap-1">
              {v.cubes.map((c) => (
                <Badge key={c.cube_id} variant="outline" className="text-xs">
                  {c.cube_name} ({c.weight}%)
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>TOP X: {v.top_x}</span>
            <span>סף משקל: {v.total_weight_threshold}%</span>
          </div>
        </div>
      )}

      {v.answer_type === "free_text" && (
        <div>
          <span className="text-muted-foreground">תוכן:</span>
          <p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-2">{v.free_text_content || "-"}</p>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>טיוטה: {v.is_draft ? "כן" : "לא"}</span>
        {v.changed_fields && v.changed_fields.length > 0 && (
          <span>שדות ששונו: {v.changed_fields.join(", ")}</span>
        )}
      </div>
    </div>
  );

  const getDiff = (field: string, a: Version, b: Version) => {
    const valA = field === "question" ? a.question : field === "answer_type" ? a.answer_type : field === "content" ? (a.free_text_content || "-") : "";
    const valB = field === "question" ? b.question : field === "answer_type" ? b.answer_type : field === "content" ? (b.free_text_content || "-") : "";
    const changed = valA !== valB;
    return { valA, valB, changed };
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            היסטוריית גרסאות
            <Badge variant="secondary">{versions.length} גרסאות</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : isComparing ? (
          <div className="space-y-4 flex-1 overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                השוואת גרסאות
              </h3>
              <Button variant="outline" size="sm" onClick={() => setCompareIds([null, null])}>
                חזור לרשימה
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 bg-muted/20">
                <div className="text-xs text-muted-foreground mb-2">
                  גרסה מ-{format(new Date(compareA.created_at), "dd/MM/yy HH:mm")} | {compareA.editor_name}
                </div>
                {renderVersionDetail(compareA)}
              </div>
              <div className="rounded-lg border p-3 bg-muted/20">
                <div className="text-xs text-muted-foreground mb-2">
                  גרסה מ-{format(new Date(compareB.created_at), "dd/MM/yy HH:mm")} | {compareB.editor_name}
                </div>
                {renderVersionDetail(compareB)}
              </div>
            </div>

            {/* Highlight differences */}
            <div className="rounded-lg border p-3 space-y-2">
              <h4 className="text-sm font-semibold">הבדלים:</h4>
              {(() => {
                const diffs: string[] = [];
                if (compareA.question !== compareB.question) diffs.push("שאלה");
                if (compareA.answer_type !== compareB.answer_type) diffs.push("סוג תשובה");
                if (JSON.stringify(compareA.cubes) !== JSON.stringify(compareB.cubes)) diffs.push("קוביות");
                if (compareA.free_text_content !== compareB.free_text_content) diffs.push("תוכן טקסט");
                if (compareA.is_draft !== compareB.is_draft) diffs.push("סטטוס טיוטה");
                if (compareA.top_x !== compareB.top_x) diffs.push("TOP X");
                if (compareA.total_weight_threshold !== compareB.total_weight_threshold) diffs.push("סף משקל");
                return diffs.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {diffs.map((d) => (
                      <Badge key={d} variant="destructive" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">אין הבדלים</p>
                );
              })()}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[65vh]">
            <div className="space-y-2 pr-4">
              {versions.length > 1 && (
                <p className="text-xs text-muted-foreground mb-3">
                  בחר 2 גרסאות להשוואה
                </p>
              )}
              {versions.map((v, i) => {
                const isExpanded = expandedId === v.id;
                const isSelected = compareIds.includes(v.id);
                return (
                  <div
                    key={v.id}
                    className={`rounded-lg border p-3 transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={i === 0 ? "default" : "outline"} className="text-xs">
                          {i === 0 ? "נוכחית" : `v${versions.length - i}`}
                        </Badge>
                        <span className="text-sm font-medium truncate max-w-[200px]">{v.question}</span>
                        {v.is_draft && <Badge variant="destructive" className="text-xs">טיוטה</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {v.editor_name} | {format(new Date(v.created_at), "dd/MM/yy HH:mm")}
                        </span>
                        {versions.length > 1 && (
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleCompare(v.id)}
                          >
                            <GitCompare className="h-3 w-3 mr-1" />
                            {isSelected ? "נבחר" : "השווה"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setExpandedId(isExpanded ? null : v.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <>
                        <Separator className="my-3" />
                        {renderVersionDetail(v)}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
