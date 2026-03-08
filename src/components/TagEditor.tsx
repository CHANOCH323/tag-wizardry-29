import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { strings } from "@/constants/strings";
import CubesEditor from "@/components/CubesEditor";

interface CubeEntry {
  cube_id: string;
  cube_name: string;
  weight: number;
}

interface TagData {
  id?: string;
  question: string;
  answer_type: "cubes" | "free_text";
  free_text_content: string;
  cubes: CubeEntry[];
  top_x: number;
  total_weight_threshold: number;
  is_draft: boolean;
}

const emptyTag: TagData = {
  question: "",
  answer_type: "cubes",
  free_text_content: "",
  cubes: [],
  top_x: 3,
  total_weight_threshold: 70,
  is_draft: false,
};

interface Props {
  open: boolean;
  onClose: () => void;
  editTagId?: string | null;
  onSaved: () => void;
}

export default function TagEditor({ open, onClose, editTagId, onSaved }: Props) {
  const [form, setForm] = useState<TagData>({ ...emptyTag });
  const [availableCubes, setAvailableCubes] = useState<{ cube_id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      supabase.from("cubes").select("*").then(({ data }) => data && setAvailableCubes(data));
      if (editTagId) {
        loadTag(editTagId);
      } else {
        setForm({ ...emptyTag });
      }
    }
  }, [open, editTagId]);

  const loadTag = async (tagId: string) => {
    const { data } = await supabase
      .from("tag_versions")
      .select("*")
      .eq("tag_id", tagId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setForm({
        id: tagId,
        question: data.question,
        answer_type: data.answer_type,
        free_text_content: data.free_text_content || "",
        cubes: (data.cubes as unknown as CubeEntry[] | null) || [],
        top_x: data.top_x || 3,
        total_weight_threshold: data.total_weight_threshold || 70,
        is_draft: data.is_draft,
      });
    }
  };

  const validate = (): string | null => {
    if (form.is_draft) return null;
    if (!form.question.trim()) return strings.tagEditor.validationQuestion;
    if (form.answer_type === "cubes") {
      if (form.cubes.length === 0) return strings.tagEditor.validationCubes;
      const total = form.cubes.reduce((s, c) => s + c.weight, 0);
      if (Math.abs(total - 100) > 0.5) return strings.tagEditor.validationWeights(total.toFixed(1));
      if (form.top_x < 1) return strings.tagEditor.validationTopX;
    }
    if (form.answer_type === "free_text" && !form.free_text_content.trim()) return strings.tagEditor.validationFreeText;
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast({ title: strings.common.error, description: err, variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);

    try {
      let tagId = form.id;
      const changedFields: string[] = [];

      if (!tagId) {
        const { data, error } = await supabase.from("tags").insert({}).select("id").single();
        if (error) throw error;
        tagId = data.id;
        changedFields.push("question", "answer");
      } else {
        const { data: prev } = await supabase
          .from("tag_versions")
          .select("question, answer_type, cubes, free_text_content")
          .eq("tag_id", tagId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (prev) {
          if (prev.question !== form.question) changedFields.push("question");
          if (prev.answer_type !== form.answer_type || JSON.stringify(prev.cubes) !== JSON.stringify(form.cubes) || prev.free_text_content !== form.free_text_content) {
            changedFields.push("answer");
          }
        }
      }

      const { error: vError } = await supabase.from("tag_versions").insert({
        tag_id: tagId!,
        created_by: user.id,
        question: form.question,
        answer_type: form.answer_type,
        free_text_content: form.answer_type === "free_text" ? form.free_text_content : null,
        cubes: form.answer_type === "cubes" ? form.cubes as any : null,
        top_x: form.answer_type === "cubes" ? form.top_x : null,
        total_weight_threshold: form.answer_type === "cubes" ? form.total_weight_threshold : null,
        is_draft: form.is_draft,
        changed_fields: changedFields,
      });
      if (vError) throw vError;

      await supabase.from("tags").update({ updated_at: new Date().toISOString() }).eq("id", tagId!);

      toast({ title: strings.tagEditor.savedSuccess });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: strings.tagEditor.saveError, description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const updateForm = (partial: Partial<TagData>) => setForm({ ...form, ...partial });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTagId ? strings.tagEditor.editTitle : strings.tagEditor.createTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>{strings.tagEditor.questionLabel}</Label>
            <Input value={form.question} onChange={(e) => updateForm({ question: e.target.value })} placeholder={strings.tagEditor.questionPlaceholder} />
          </div>

          <div className="space-y-2">
            <Label>{strings.tagEditor.answerTypeLabel}</Label>
            <Select value={form.answer_type} onValueChange={(v: "cubes" | "free_text") => updateForm({ answer_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cubes">{strings.tags.cubes}</SelectItem>
                <SelectItem value="free_text">{strings.tags.freeText}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.answer_type === "cubes" && (
            <CubesEditor
              cubes={form.cubes}
              availableCubes={availableCubes}
              topX={form.top_x}
              weightThreshold={form.total_weight_threshold}
              onChange={(cubes) => updateForm({ cubes })}
              onTopXChange={(top_x) => updateForm({ top_x })}
              onWeightThresholdChange={(total_weight_threshold) => updateForm({ total_weight_threshold })}
            />
          )}

          {form.answer_type === "free_text" && (
            <div className="space-y-2">
              <Label>{strings.tagEditor.freeTextLabel}</Label>
              <Textarea value={form.free_text_content} onChange={(e) => updateForm({ free_text_content: e.target.value })} placeholder={strings.tagEditor.freeTextPlaceholder} rows={5} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox id="draft" checked={form.is_draft} onCheckedChange={(v) => updateForm({ is_draft: !!v })} />
            <Label htmlFor="draft" className="cursor-pointer">{strings.tagEditor.saveAsDraft}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{strings.common.cancel}</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? strings.common.saving : strings.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
