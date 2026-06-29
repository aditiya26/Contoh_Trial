import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCircle2, Circle, LogOut, Plus, Trash2, User as UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth, useCurrentUser } from "@/lib/auth";
import { useDataStore } from "@/lib/store";

export function AppHeader() {
  const user = useCurrentUser();
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const { todos, addTodo, toggleTodo, removeTodo } = useDataStore();
  const [draft, setDraft] = useState("");

  const openCount = todos.filter((t) => !t.done).length;

  function submit() {
    const t = draft.trim();
    if (!t || !user) return;
    addTodo(t, user.username);
    setDraft("");
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/80 px-3 backdrop-blur"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <SidebarTrigger />
      <div className="flex-1" />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">To-do</span>
            {openCount > 0 && (
              <Badge className="ml-1 h-5 min-w-5 rounded-full bg-accent px-1.5 text-accent-foreground">
                {openCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="mb-2 text-sm font-semibold">To-do List</div>
          <div className="mb-3 flex gap-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Tambah tugas..."
              className="h-8"
            />
            <Button size="sm" className="h-8 px-2" onClick={submit}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-72 space-y-1 overflow-auto">
            {todos.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">Belum ada tugas</div>
            )}
            {todos.map((t) => (
              <div
                key={t.id}
                className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <button onClick={() => toggleTodo(t.id)} className="mt-0.5 shrink-0">
                  {t.done ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 text-sm">
                  <div className={t.done ? "line-through text-muted-foreground" : ""}>{t.text}</div>
                  <div className="text-[10px] text-muted-foreground">{t.createdBy}</div>
                </div>
                <button
                  onClick={() => removeTodo(t.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="ml-2 hidden items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs sm:flex">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="h-3.5 w-3.5" />
        </div>
        <div className="leading-tight">
          <div className="font-medium text-foreground">{user?.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {user?.role}
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logoff</span>
      </Button>
    </header>
  );
}