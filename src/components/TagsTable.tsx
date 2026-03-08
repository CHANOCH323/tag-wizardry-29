import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, History, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import CubesPieChart from "./CubesPieChart";

interface CubeEntry {
  cube_id: string;
  cube_name: string;
  weight: number;
}

export interface TagRow {
  id: string;
  question: string;
  answer_type: "cubes" | "free_text";
  cubes: CubeEntry[] | null;
  free_text_content: string | null;
  is_draft: boolean;
  last_editor: string;
  updated_at: string;
  created_at: string;
  version_count: number;
}

type SortKey = "question" | "answer_type" | "is_draft" | "last_editor" | "updated_at" | "created_at" | "version_count";
type SortDir = "asc" | "desc";

interface Props {
  tags: TagRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

function SortableHead({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <TableHead
      className="text-right font-semibold cursor-pointer select-none hover:bg-muted/30 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </TableHead>
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
      const va = a[sortKey];
      const vb = b[sortKey];
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

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold">מזהה</TableHead>
              <SortableHead label="שאלה" sortKey="question" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHead label="סוג תשובה" sortKey="answer_type" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <TableHead className="text-right font-semibold">ערך תשובה</TableHead>
              <SortableHead label="טיוטה" sortKey="is_draft" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHead label="עורך אחרון" sortKey="last_editor" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHead label="עודכן" sortKey="updated_at" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHead label="נוצר" sortKey="created_at" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHead label="גרסאות" sortKey="version_count" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <TableHead className="text-right font-semibold">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  לא נמצאו תיוגים
                </TableCell>
              </TableRow>
            ) : (
              sortedTags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{tag.id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium">{tag.question}</TableCell>
                  <TableCell>
                    <Badge variant={tag.answer_type === "cubes" ? "default" : "secondary"}>
                      {tag.answer_type === "cubes" ? "קוביות" : "טקסט חופשי"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    {tag.answer_type === "cubes" && tag.cubes ? (
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
                    ) : (
                      <span className="text-sm truncate block">{tag.free_text_content || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tag.is_draft ? "destructive" : "outline"} className="text-xs">
                      {tag.is_draft ? "כן" : "לא"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{tag.last_editor}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(tag.updated_at), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(tag.created_at), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewHistory(tag.id)} title="היסטוריית גרסאות">
                      <History className="h-4 w-4" />
                      <span className="sr-only">היסטוריה</span>
                    </Button>
                    <Badge variant="secondary">{tag.version_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tag.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת תיוג</AlertDialogTitle>
                            <AlertDialogDescription>האם אתה בטוח שברצונך למחוק תיוג זה? פעולה זו לא ניתנת לביטול.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(tag.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
