import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, History } from "lucide-react";
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

interface Props {
  tags: TagRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TagsTable({ tags, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold">מזהה</TableHead>
              <TableHead className="text-right font-semibold">שאלה</TableHead>
              <TableHead className="text-right font-semibold">סוג תשובה</TableHead>
              <TableHead className="text-right font-semibold">ערך תשובה</TableHead>
              <TableHead className="text-right font-semibold">טיוטה</TableHead>
              <TableHead className="text-right font-semibold">עורך אחרון</TableHead>
              <TableHead className="text-right font-semibold">עודכן</TableHead>
              <TableHead className="text-right font-semibold">נוצר</TableHead>
              <TableHead className="text-right font-semibold">גרסאות</TableHead>
              <TableHead className="text-right font-semibold">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  לא נמצאו תיוגים
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
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
