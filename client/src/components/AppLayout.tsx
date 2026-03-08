import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Tag, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { strings } from "@/constants/strings";

function UserAvatar({ displayName, avatarUrl }: { displayName?: string; avatarUrl?: string | null }) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={avatarUrl || undefined} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm">
        {displayName?.charAt(0) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

function UserMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <UserAvatar displayName={profile?.display_name} avatarUrl={profile?.avatar_url} />
          <span className="text-sm font-medium hidden sm:inline">{profile?.display_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={toggleTheme} className="gap-2 cursor-pointer">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? strings.theme.lightMode : strings.theme.darkMode}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          {strings.settings.title}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive">
          <LogOut className="h-4 w-4" />
          {strings.auth.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const fontSizeClass = profile?.font_size ? `font-size-${profile.font_size}` : "font-size-medium";

  return (
    <div className={`min-h-screen bg-background ${fontSizeClass}`}>
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">{strings.app.title}</h1>
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
