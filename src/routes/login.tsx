import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useDataStore } from "@/lib/store";
import { LogIn, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — ADSAN ERP" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { init, login, currentUserId } = useAuth();
  const log = useDataStore((s) => s.log);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (currentUserId) navigate({ to: "/dashboard" });
  }, [currentUserId, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = login(username, password);
    if (u) {
      log({ user: u.username, module: "auth", action: "login" });
      toast.success(`Selamat datang, ${u.name}`);
      navigate({ to: "/dashboard" });
    } else {
      toast.error("Username atau password salah");
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      <Card className="w-full max-w-md" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <CardContent className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-accent-foreground"
              style={{ background: "var(--gradient-accent)" }}
            >
              A
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ADSAN</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Enterprise ERP
              </div>
            </div>
          </div>
          <h1 className="mb-1 text-lg font-semibold">Masuk ke akun Anda</h1>
          <p className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Default: admin / admin
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}