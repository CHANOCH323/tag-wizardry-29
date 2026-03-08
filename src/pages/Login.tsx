import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Tag } from "lucide-react";
import { strings } from "@/constants/strings";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuthData } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login({ email, password });
      setAuthData(response.user, response.profile);
      navigate("/");
    } catch (error: any) {
      toast({
        title: strings.auth.loginError,
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Tag className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {strings.auth.loginTitle}
          </CardTitle>
          <CardDescription>{strings.auth.loginSubtitle}</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{strings.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{strings.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? strings.auth.loggingIn : strings.auth.login}
            </Button>
            <p className="text-sm text-muted-foreground">
              {strings.auth.noAccount}{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                {strings.auth.registerHere}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
