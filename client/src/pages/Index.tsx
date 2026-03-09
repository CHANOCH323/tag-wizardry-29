import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import TagsTable from "@/components/TagsTable";
import TagsFilters, { TagFilters, emptyFilters } from "@/components/TagsFilters";
import TagEditor from "@/components/TagEditor";
import VersionHistory from "@/components/VersionHistory";
import Pagination from "@/components/Pagination";
import TagsHeader from "@/components/TagsHeader";
import { useToast } from "@/hooks/use-toast";
import { strings } from "@/constants/strings";
import { fetchTags as apiFetchTags, deleteTag as apiDeleteTag } from "@/services/api";
import type { TagDto } from "@/services/api.types";

export default function Index() {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [filters, setFilters] = useState<TagFilters>({ ...emptyFilters });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTagId, setEditTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTagId, setHistoryTagId] = useState<string | null>(null);
  const [editFromVersion, setEditFromVersion] = useState<{ tagId: string; version: import("@/services/api.types").VersionDto } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      let rows = await apiFetchTags();

      // Apply client-side filters
      if (filters.questionSearch) rows = rows.filter((r) => r.question.includes(filters.questionSearch));
      if (filters.answerSearch) rows = rows.filter((r) => r.answer_type === "free_text" && r.free_text_content?.includes(filters.answerSearch));
      if (filters.answerType) rows = rows.filter((r) => r.answer_type === filters.answerType);
      if (filters.isDraft) rows = rows.filter((r) => String(r.is_draft) === filters.isDraft);
      if (filters.cubeName) rows = rows.filter((r) => r.cubes?.some((c) => c.cube_name === filters.cubeName));
      if (filters.dateFrom) rows = rows.filter((r) => new Date(r.updated_at) >= filters.dateFrom!);
      if (filters.dateTo) rows = rows.filter((r) => new Date(r.updated_at) <= filters.dateTo!);

      setTags(rows);
    } catch (e: any) {
      toast({ title: strings.common.error, description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, [filters, toast]);

  useEffect(() => { setCurrentPage(1); }, [filters]);
  useEffect(() => { loadTags(); }, [loadTags]);

  const totalPages = Math.max(1, Math.ceil(tags.length / pageSize));
  const paginatedTags = tags.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteTag(id);
      toast({ title: strings.tags.deleted });
      loadTags();
    } catch (e: any) {
      toast({ title: strings.common.error, description: e.message, variant: "destructive" });
    }
  };

  const handleOpenEditor = (id: string | null = null) => {
    setEditFromVersion(null);
    setEditTagId(id);
    setEditorOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <TagsHeader count={tags.length} tags={tags} onAdd={() => handleOpenEditor()} />
        <TagsFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{strings.common.loading}</div>
        ) : (
          <>
            <TagsTable
              tags={paginatedTags}
              onEdit={(id, version) => {
                if (version) {
                  setEditFromVersion({ tagId: id, version });
                  setEditTagId(id);
                  setEditorOpen(true);
                } else {
                  handleOpenEditor(id);
                }
              }}
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
        onClose={() => { setEditorOpen(false); setEditTagId(null); setEditFromVersion(null); }}
        editTagId={editTagId ?? editFromVersion?.tagId ?? null}
        initialVersion={editFromVersion?.version ?? null}
        onSaved={loadTags}
      />

      <VersionHistory
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTagId(null); }}
        tagId={historyTagId}
      />
    </AppLayout>
  );
}
