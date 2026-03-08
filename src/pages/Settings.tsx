import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { strings } from "@/constants/strings";
import { updateProfile, updatePassword, uploadFile } from "@/services/api";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
];

function ProfileCard({ displayName, setDisplayName, avatarUrl, setAvatarUrl, onSave, saving, userId }: {
  displayName: string; setDisplayName: (v: string) => void;
  avatarUrl: string; setAvatarUrl: (v: string) => void;
  onSave: () => void; saving: boolean; userId?: string;
}) {
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const result = await uploadFile("avatars", path, file);
      setAvatarUrl(result.url);
    } catch (error: any) {
      toast({ title: strings.settings.uploadError, description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{strings.settings.profileTitle}</CardTitle>
        <CardDescription>{strings.settings.profileDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{strings.settings.displayNameLabel}</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>{strings.settings.profilePicture}</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">{displayName?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-muted transition-colors">
                  <Upload className="h-3 w-3" />
                  {strings.settings.uploadImage}
                </Label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </div>
              <div className="flex gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button key={i} onClick={() => setAvatarUrl(url)} className={`rounded-full border-2 transition-all ${avatarUrl === url ? "border-primary scale-110" : "border-transparent hover:border-muted-foreground/30"}`}>
                    <Avatar className="h-8 w-8"><AvatarImage src={url} /></Avatar>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {strings.settings.saveChanges}
        </Button>
      </CardContent>
    </Card>
  );
}

function FontSizeCard({ fontSize, setFontSize, onSave, saving }: {
  fontSize: string; setFontSize: (v: string) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Type className="h-5 w-5" />
          {strings.settings.fontSizeTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={fontSize} onValueChange={setFontSize}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">{strings.settings.fontSizeSmall}</SelectItem>
            <SelectItem value="medium">{strings.settings.fontSizeMedium}</SelectItem>
            <SelectItem value="large">{strings.settings.fontSizeLarge}</SelectItem>
            <SelectItem value="xlarge">{strings.settings.fontSizeXlarge}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {strings.common.save}
        </Button>
      </CardContent>
    </Card>
  );
}

function PasswordCard({ saving }: { saving: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const handleChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: strings.common.error, description: strings.settings.passwordMinLength, variant: "destructive" });
      return;
    }
    try {
      await updatePassword(newPassword);
      toast({ title: strings.settings.passwordChanged });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast({ title: strings.common.error, description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="h-5 w-5" />
          {strings.settings.changePasswordTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{strings.settings.currentPassword}</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} dir="ltr" className="text-left" />
        </div>
        <div className="space-y-2">
          <Label>{strings.settings.newPassword}</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" className="text-left" minLength={6} />
        </div>
        <Button onClick={handleChange} disabled={saving} className="gap-2">
          <Key className="h-4 w-4" />
          {strings.settings.changePassword}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [fontSize, setFontSize] = useState(profile?.font_size || "medium");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        avatar_url: avatarUrl || null,
        font_size: fontSize,
      });
      await refreshProfile();
      toast({ title: strings.settings.profileUpdated });
    } catch (e: any) {
      toast({ title: strings.common.error, description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          {strings.settings.backToTags}
        </Button>

        <h2 className="text-2xl font-bold">{strings.settings.title}</h2>

        <ProfileCard
          displayName={displayName}
          setDisplayName={setDisplayName}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          onSave={handleSaveProfile}
          saving={saving}
          userId={user?.id}
        />

        <FontSizeCard fontSize={fontSize} setFontSize={setFontSize} onSave={handleSaveProfile} saving={saving} />

        <PasswordCard saving={saving} />
      </div>
    </AppLayout>
  );
}
