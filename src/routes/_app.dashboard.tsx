import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { useDataStore, MODULE_LABELS, type ModuleKey } from "@/lib/store";
import { useCurrentUser } from "@/lib/auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ADSAN" }] }),
  component: Dashboard,
});

const MODULES: ModuleKey[] = ["bahan-baku", "barang-jadi", "barang-proses", "barang-perjalanan", "pemakaian"];

function Dashboard() {
  const user = useCurrentUser();
  const { data, todos, logs, settings, updateSettings } = useDataStore();
  const [editing, setEditing] = useState(false);

  const widgets = settings.dashboardWidgets;
  const visible = (id: string) => widgets.find((w) => w.id === id)?.visible ?? true;

  function toggleWidget(id: string) {
    if (!user) return;
    updateSettings(
      {
        dashboardWidgets: widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
      },
      user.username,
    );
  }

  const totals = MODULES.map((m) => {
    const rows = data[m];
    const masuk = rows.reduce((a, r) => a + (r.masuk || 0), 0);
    const keluar = rows.reduce((a, r) => a + (r.keluar || 0), 0);
    return { key: m, label: MODULE_LABELS[m], count: rows.length, stock: masuk - keluar, masuk, keluar };
  });

  const grandStock = totals.reduce((a, t) => a + t.stock, 0);
  const grandMasuk = totals.reduce((a, t) => a + t.masuk, 0);
  const grandKeluar = totals.reduce((a, t) => a + t.keluar, 0);

  const lowStock = totals.filter((t) => t.stock < 10);
  const recent = logs.slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Halo {user?.name}, ringkasan operasional terintegrasi seluruh modul.
          </p>
        </div>
        <Popover open={editing} onOpenChange={setEditing}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="mr-1 h-4 w-4" />
              Atur Widget
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="mb-2 text-sm font-semibold">Widget Dashboard</div>
            <div className="space-y-2">
              {widgets.map((w) => (
                <div key={w.id} className="flex items-center justify-between">
                  <Label className="text-xs capitalize">{w.id.replace(/-/g, " ")}</Label>
                  <Switch checked={w.visible} onCheckedChange={() => toggleWidget(w.id)} />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div
        className="rounded-2xl p-6 text-primary-foreground"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <HeroStat label="Total Stok" value={grandStock} />
          <HeroStat label="Total Masuk" value={grandMasuk} />
          <HeroStat label="Total Keluar" value={grandKeluar} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {visible("module-counts") && (
          <Card className="lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Ringkasan Modul</h2>
                <Badge variant="outline">Terintegrasi</Badge>
              </div>
              <div className="space-y-2">
                {totals.map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.count} entri</div>
                    </div>
                    <div className="flex gap-4 text-right text-xs">
                      <div>
                        <div className="text-muted-foreground">Masuk</div>
                        <div className="font-bold text-success">
                          {t.masuk.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Keluar</div>
                        <div className="font-bold text-warning">
                          {t.keluar.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Stok</div>
                        <div className="font-bold text-primary">
                          {t.stock.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {visible("low-stock") && (
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4">
              <h2 className="mb-3 font-semibold">Stok Rendah</h2>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">Semua modul memiliki stok aman.</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.map((t) => (
                    <div key={t.key} className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-2 text-sm">
                      <span>{t.label}</span>
                      <Badge className="bg-warning text-warning-foreground">{t.stock}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {visible("recent-activity") && (
          <Card className="lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4">
              <h2 className="mb-3 font-semibold">Aktivitas Terbaru</h2>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
              ) : (
                <div className="space-y-1.5">
                  {recent.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {l.module}
                        </Badge>
                        <span className="font-medium">{l.action}</span>
                        <span className="text-muted-foreground">{l.detail}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(l.ts).toLocaleString("id-ID")} • {l.user}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {visible("todo") && (
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4">
              <h2 className="mb-3 font-semibold">To-do</h2>
              {todos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada tugas. Tambahkan dari ikon lonceng di header.</p>
              ) : (
                <div className="space-y-1.5">
                  {todos.slice(0, 6).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${t.done ? "bg-success" : "bg-accent"}`} />
                      <span className={t.done ? "line-through text-muted-foreground" : ""}>{t.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {visible("chart-movements") && (
          <Card className="lg:col-span-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4">
              <h2 className="mb-3 font-semibold">Pergerakan per Modul</h2>
              <div className="space-y-2">
                {totals.map((t) => {
                  const max = Math.max(1, ...totals.map((x) => x.masuk + x.keluar));
                  const wIn = (t.masuk / max) * 100;
                  const wOut = (t.keluar / max) * 100;
                  return (
                    <div key={t.key}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{t.label}</span>
                        <span className="text-muted-foreground">
                          ↑{t.masuk} ↓{t.keluar}
                        </span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        <div className="bg-success transition-all" style={{ width: `${wIn}%` }} />
                        <div className="bg-warning transition-all" style={{ width: `${wOut}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-3xl font-bold tabular-nums">{value.toLocaleString("id-ID")}</div>
    </div>
  );
}