import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Save } from "lucide-react";

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
  const [selectedCubeToAdd, setSelectedCubeToAdd] = useState("");
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
    if (!form.question.trim()) return "יש להזין שאלה";
    if (form.answer_type === "cubes") {
      if (form.cubes.length === 0) return "יש להוסיף לפחות קובייה אחת";
      const total = form.cubes.reduce((s, c) => s + c.weight, 0);
      if (Math.abs(total - 100) > 0.5) return `סכום המשקלים חייב להיות 100% (כרגע ${total.toFixed(1)}%)`;
      if (form.top_x < 1) return "TOP X חייב להיות לפחות 1";
    }
    if (form.answer_type === "free_text" && !form.free_text_content.trim()) return "יש להזין תוכן תשובה";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast({ title: "שגיאה", description: err, variant: "destructive" });
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
        // Detect changes for versioning
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

      // Update tag's updated_at
      await supabase.from("tags").update({ updated_at: new Date().toISOString() }).eq("id", tagId!);

      toast({ title: "נשמר בהצלחה!" });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const addCube = () => {
    if (!selectedCubeToAdd) return;
    const cube = availableCubes.find((c) => c.cube_id === selectedCubeToAdd);
    if (!cube || form.cubes.find((c) => c.cube_id === cube.cube_id)) return;
    const newCubes = [...form.cubes, { cube_id: cube.cube_id, cube_name: cube.name, weight: 0 }];
    setForm({ ...form, cubes: newCubes });
    setSelectedCubeToAdd("");
  };

  const removeCube = (cubeId: string) => {
    setForm({ ...form, cubes: form.cubes.filter((c) => c.cube_id !== cubeId) });
  };

  const setCubeWeight = (cubeId: string, weight: number) => {
    setForm({
      ...form,
      cubes: form.cubes.map((c) => (c.cube_id === cubeId ? { ...c, weight } : c)),
    });
  };

  const distributeEvenly = () => {
    if (form.cubes.length === 0) return;
    const w = Math.floor(100 / form.cubes.length);
    const remainder = 100 - w * form.cubes.length;
    setForm({
      ...form,
      cubes: form.cubes.map((c, i) => ({ ...c, weight: w + (i === 0 ? remainder : 0) })),
    });
  };

  const totalWeight = form.cubes.reduce((s, c) => s + c.weight, 0);
  const unusedCubes = availableCubes.filter((c) => !form.cubes.find((fc) => fc.cube_id === c.cube_id));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTagId ? "עריכת תיוג" : "יצירת תיוג חדש"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Question */}
          <div className="space-y-2">
            <Label>שאלה *</Label>
            <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="הזן את השאלה..." />
          </div>

          {/* Answer Type */}
          <div className="space-y-2">
            <Label>סוג תשובה *</Label>
            <Select value={form.answer_type} onValueChange={(v: "cubes" | "free_text") => setForm({ ...form, answer_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cubes">קוביות</SelectItem>
                <SelectItem value="free_text">טקסט חופשי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cubes answer */}
          {form.answer_type === "cubes" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="mb-1 block">הוסף קובייה</Label>
                  <Select value={selectedCubeToAdd} onValueChange={setSelectedCubeToAdd}>
                    <SelectTrigger><SelectValue placeholder="בחר קובייה..." /></SelectTrigger>
                    <SelectContent>
                      {unusedCubes.map((c) => <SelectItem key={c.cube_id} value={c.cube_id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={addCube} disabled={!selectedCubeToAdd}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {form.cubes.length > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      סה״כ משקל: <span className={Math.abs(totalWeight - 100) > 0.5 ? "text-destructive" : "text-success"}>{totalWeight}%</span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={distributeEvenly}>חלוקה שווה</Button>
                  </div>
                  <div className="space-y-3">
                    {form.cubes.map((cube) => (
                      <div key={cube.cube_id} className="flex items-center gap-3 rounded-md border p-3 bg-secondary/30">
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeCube(cube.cube_id)}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Badge variant="secondary" className="shrink-0">{cube.cube_name}</Badge>
                        <div className="flex-1">
                          <Slider value={[cube.weight]} onValueChange={([v]) => setCubeWeight(cube.cube_id, v)} max={100} step={1} />
                        </div>
                        <Input
                          type="number"
                          value={cube.weight}
                          onChange={(e) => setCubeWeight(cube.cube_id, Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-16 text-center"
                          min={0}
                          max={100}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TOP X</Label>
                  <Input type="number" value={form.top_x} onChange={(e) => setForm({ ...form, top_x: Number(e.target.value) })} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>סף משקל כולל (%)</Label>
                  <Input type="number" value={form.total_weight_threshold} onChange={(e) => setForm({ ...form, total_weight_threshold: Number(e.target.value) })} min={0} max={100} />
                </div>
              </div>
            </div>
          )}

          {/* Free text answer */}
          {form.answer_type === "free_text" && (
            <div className="space-y-2">
              <Label>תוכן התשובה *</Label>
              <Textarea value={form.free_text_content} onChange={(e) => setForm({ ...form, free_text_content: e.target.value })} placeholder="הזן את תוכן התשובה..." rows={5} />
            </div>
          )}

          {/* Draft */}
          <div className="flex items-center gap-2">
            <Checkbox id="draft" checked={form.is_draft} onCheckedChange={(v) => setForm({ ...form, is_draft: !!v })} />
            <Label htmlFor="draft" className="cursor-pointer">שמור כטיוטה</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "שומר..." : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
