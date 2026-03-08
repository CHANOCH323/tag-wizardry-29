import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import TagsTable, { TagRow } from "@/components/TagsTable";
import TagsFilters, { TagFilters, emptyFilters } from "@/components/TagsFilters";
import TagEditor from "@/components/TagEditor";
import VersionHistory from "@/components/VersionHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from "lucide-react";
import * as XLSX from "xlsx";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Index() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [filters, setFilters] = useState<TagFilters>({ ...emptyFilters });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTagId, setEditTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTagId, setHistoryTagId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    setLoading(true);

    // Fetch all tags with their versions
    const { data: tagsData } = await supabase
      .from("tags")
      .select("id, created_at, updated_at")
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });

    if (!tagsData) { setLoading(false); return; }

    // Fetch all versions
    const { data: versions } = await supabase
      .from("tag_versions")
      .select("*")
      .in("tag_id", tagsData.map((t) => t.id))
      .order("created_at", { ascending: false });

    if (!versions) { setLoading(false); return; }

    // Fetch profiles for display names
    const userIds = [...new Set(versions.map((v) => v.created_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    // Group versions by tag
    const versionsByTag = new Map<string, typeof versions>();
    for (const v of versions) {
      if (!versionsByTag.has(v.tag_id)) versionsByTag.set(v.tag_id, []);
      versionsByTag.get(v.tag_id)!.push(v);
    }

    let rows: TagRow[] = tagsData.map((tag) => {
      const tagVersions = versionsByTag.get(tag.id) || [];
      const latest = tagVersions[0];
      if (!latest) return null;
      return {
        id: tag.id,
        question: latest.question,
        answer_type: latest.answer_type as "cubes" | "free_text",
        cubes: latest.cubes as any,
        free_text_content: latest.free_text_content,
        is_draft: latest.is_draft,
        last_editor: profileMap.get(latest.created_by) || "לא ידוע",
        updated_at: tag.updated_at,
        created_at: tag.created_at,
        version_count: tagVersions.length,
      };
    }).filter(Boolean) as TagRow[];

    // Apply filters
    if (filters.questionSearch) {
      rows = rows.filter((r) => r.question.includes(filters.questionSearch));
    }
    if (filters.answerSearch) {
      rows = rows.filter((r) => r.answer_type === "free_text" && r.free_text_content?.includes(filters.answerSearch));
    }
    if (filters.answerType) {
      rows = rows.filter((r) => r.answer_type === filters.answerType);
    }
    if (filters.isDraft) {
      rows = rows.filter((r) => String(r.is_draft) === filters.isDraft);
    }
    if (filters.cubeName) {
      rows = rows.filter((r) => r.cubes?.some((c: any) => c.cube_name === filters.cubeName));
    }
    if (filters.userId) {
      // Filter by user - need to check versions
      const userVersionTagIds = versions
        .filter((v) => v.created_by === filters.userId)
        .map((v) => v.tag_id);
      rows = rows.filter((r) => userVersionTagIds.includes(r.id));
    }
    if (filters.dateFrom) {
      rows = rows.filter((r) => new Date(r.updated_at) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      rows = rows.filter((r) => new Date(r.updated_at) <= filters.dateTo!);
    }

    setTags(rows);
    setLoading(false);
  }, [filters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(tags.length / pageSize));
  const paginatedTags = tags.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    await supabase.from("tags").update({ is_deleted: true }).eq("id", id);
    toast({ title: "התיוג נמחק" });
    fetchTags();
  };

  const handleViewHistory = (id: string) => {
    setHistoryTagId(id);
    setHistoryOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditTagId(id);
    setEditorOpen(true);
  };

  const handleExport = () => {
    const data = tags.map((t) => ({
      מזהה: t.id.slice(0, 8),
      שאלה: t.question,
      "סוג תשובה": t.answer_type === "cubes" ? "קוביות" : "טקסט חופשי",
      "ערך תשובה": t.answer_type === "cubes" ? t.cubes?.map((c: any) => c.cube_name).join(", ") : t.free_text_content,
      טיוטה: t.is_draft ? "כן" : "לא",
      "עורך אחרון": t.last_editor,
      "עודכן בתאריך": t.updated_at,
      "נוצר בתאריך": t.created_at,
      גרסאות: t.version_count,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "תיוגים");
    XLSX.writeFile(wb, "tags-export.xlsx");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">תיוגים</h2>
            <p className="text-muted-foreground text-sm mt-1">
              <Badge variant="secondary" className="font-mono">{tags.length}</Badge>{" "}
              רשומות מוצגות
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              ייצוא לאקסל
            </Button>
            <Button
              onClick={() => { setEditTagId(null); setEditorOpen(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              הוסף שאלה חדשה
            </Button>
          </div>
        </div>

        <TagsFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : (
          <>
            <TagsTable tags={paginatedTags} onEdit={handleEdit} onDelete={handleDelete} onViewHistory={handleViewHistory} />

            {tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>שורות בעמוד:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="rounded border bg-background px-2 py-1 text-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span className="mr-4">
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, tags.length)} מתוך {tags.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm font-medium">
                    עמוד {currentPage} מתוך {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

      <TagEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditTagId(null); }}
        editTagId={editTagId}
        onSaved={fetchTags}
      />

      <VersionHistory
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTagId(null); }}
        tagId={historyTagId}
      />
    </AppLayout>
  );
}
