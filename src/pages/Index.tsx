import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import TagsTable, { TagRow } from "@/components/TagsTable";
import TagsFilters, { TagFilters, emptyFilters } from "@/components/TagsFilters";
import TagEditor from "@/components/TagEditor";
import VersionHistory from "@/components/VersionHistory";
import Pagination from "@/components/Pagination";
import TagsHeader from "@/components/TagsHeader";
import { useToast } from "@/hooks/use-toast";
import { strings } from "@/constants/strings";

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

    const { data: tagsData } = await supabase
      .from("tags")
      .select("id, created_at, updated_at")
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });

    if (!tagsData) { setLoading(false); return; }

    const { data: versions } = await supabase
      .from("tag_versions")
      .select("*")
      .in("tag_id", tagsData.map((t) => t.id))
      .order("created_at", { ascending: false });

    if (!versions) { setLoading(false); return; }

    const userIds = [...new Set(versions.map((v) => v.created_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

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
        last_editor: profileMap.get(latest.created_by) || strings.common.unknown,
        updated_at: tag.updated_at,
        created_at: tag.created_at,
        version_count: tagVersions.length,
      };
    }).filter(Boolean) as TagRow[];

    // Apply filters
    if (filters.questionSearch) rows = rows.filter((r) => r.question.includes(filters.questionSearch));
    if (filters.answerSearch) rows = rows.filter((r) => r.answer_type === "free_text" && r.free_text_content?.includes(filters.answerSearch));
    if (filters.answerType) rows = rows.filter((r) => r.answer_type === filters.answerType);
    if (filters.isDraft) rows = rows.filter((r) => String(r.is_draft) === filters.isDraft);
    if (filters.cubeName) rows = rows.filter((r) => r.cubes?.some((c: any) => c.cube_name === filters.cubeName));
    if (filters.userId) {
      const userVersionTagIds = versions.filter((v) => v.created_by === filters.userId).map((v) => v.tag_id);
      rows = rows.filter((r) => userVersionTagIds.includes(r.id));
    }
    if (filters.dateFrom) rows = rows.filter((r) => new Date(r.updated_at) >= filters.dateFrom!);
    if (filters.dateTo) rows = rows.filter((r) => new Date(r.updated_at) <= filters.dateTo!);

    setTags(rows);
    setLoading(false);
  }, [filters]);

  useEffect(() => { setCurrentPage(1); }, [filters]);
  useEffect(() => { fetchTags(); }, [fetchTags]);

  const totalPages = Math.max(1, Math.ceil(tags.length / pageSize));
  const paginatedTags = tags.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    await supabase.from("tags").update({ is_deleted: true }).eq("id", id);
    toast({ title: strings.tags.deleted });
    fetchTags();
  };

  const handleOpenEditor = (id: string | null = null) => {
    setEditTagId(id);
    setEditorOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <TagsHeader
          count={tags.length}
          tags={tags}
          onAdd={() => handleOpenEditor()}
        />

        <TagsFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{strings.common.loading}</div>
        ) : (
          <>
            <TagsTable
              tags={paginatedTags}
              onEdit={(id) => handleOpenEditor(id)}
              onDelete={handleDelete}
              onViewHistory={(id) => { setHistoryTagId(id); setHistoryOpen(true); }}
            />

            {tags.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={tags.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            )}
          </>
        )}
      </div>

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
