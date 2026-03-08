import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Save, Upload, Key, Type } from "lucide-react";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
];

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [fontSize, setFontSize] = useState(profile?.font_size || "medium");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: avatarUrl || null, font_size: fontSize })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "הפרופיל עודכן בהצלחה!" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "שגיאה", description: "הסיסמא החדשה חייבת להכיל לפחות 6 תווים", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הסיסמא שונתה בהצלחה!" });
      setCurrentPassword("");
      setNewPassword("");
    }
    setSaving(false);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) {
      toast({ title: "שגיאה בהעלאה", description: error.message, variant: "destructive" });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          חזרה לתיוגים
        </Button>

        <h2 className="text-2xl font-bold">הגדרות</h2>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פרופיל</CardTitle>
            <CardDescription>עדכן את פרטי הפרופיל שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>שם תצוגה</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>תמונת פרופיל</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">{displayName?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-muted transition-colors">
                      <Upload className="h-3 w-3" />
                      העלה תמונה
                    </Label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" />
                  </div>
                  <div className="flex gap-2">
                    {PRESET_AVATARS.map((url, i) => (
                      <button key={i} onClick={() => setAvatarUrl(url)} className={`rounded-full border-2 transition-all ${avatarUrl === url ? "border-primary scale-110" : "border-transparent hover:border-muted-foreground/30"}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={url} />
                        </Avatar>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              שמור שינויים
            </Button>
          </CardContent>
        </Card>

        {/* Font Size Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Type className="h-5 w-5" />
              גודל גופן
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">קטן</SelectItem>
                <SelectItem value="medium">בינוני</SelectItem>
                <SelectItem value="large">גדול</SelectItem>
                <SelectItem value="xlarge">גדול מאוד</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              שמור
            </Button>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              שינוי סיסמא
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>סיסמא נוכחית</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>סיסמא חדשה</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" className="text-left" minLength={6} />
            </div>
            <Button onClick={handleChangePassword} disabled={saving} className="gap-2">
              <Key className="h-4 w-4" />
              שנה סיסמא
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
