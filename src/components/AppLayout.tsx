import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const fontSizeClass = profile?.font_size ? `font-size-${profile.font_size}` : "font-size-medium";

  return (
    <div className={`min-h-screen bg-background ${fontSizeClass}`}>
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">ניהול תיוגים</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {profile?.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{profile?.display_name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                הגדרות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive">
                <LogOut className="h-4 w-4" />
                התנתק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
