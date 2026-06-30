import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { useDataStore, MODULE_LABELS, ROW_FIELDS, type ModuleKey } from "@/lib/store";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_app/laporan")({
  head: () => ({ meta: [{ title: "Laporan — ADSAN" }] }),
  component: Laporan,
});

const MODULES: ModuleKey[] = ["bahan-baku", "barang-jadi", "barang-proses", "barang-perjalanan", "pemakaian"];

function Laporan() {
  const { data, logs } = useDataStore();
  const [mod, setMod] = useState<ModuleKey>("bahan-baku");
  const [cols, setCols] = useState<string[]>(ROW_FIELDS.map((f) => f.key));

  const rows = data[mod];
  const active = ROW_FIELDS.filter((f) => cols.includes(f.key));

  function exportSummary() {
    const out = rows.map((r) => {
      const o: Record<string, unknown> = {};
      active.forEach((f) => (o[f.label] = r[f.key]));
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(wb, `laporan-${mod}.xlsx`);
  }

  function exportLogs() {
    const ws = XLSX.utils.json_to_sheet(
      logs.map((l) => ({
        Tanggal: new Date(l.ts).toLocaleString("id-ID"),
        User: l.user,
        Modul: l.module,
        Aksi: l.action,
        Detail: l.detail ?? "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log Aktivitas");
    XLSX.writeFile(wb, `log-aktivitas.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground">Summary fleksibel dan log aktivitas detail.</p>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="logs">Log Aktivitas</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-[240px_1fr_auto] sm:items-end">
                <div>
                  <Label className="text-xs">Modul</Label>
                  <Select value={mod} onValueChange={(v) => setMod(v as ModuleKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {MODULE_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Kolom Ditampilkan</Label>
                  <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-2">
                    {ROW_FIELDS.map((f) => (
                      <label key={f.key} className="flex items-center gap-1.5 text-xs">
                        <Checkbox
                          checked={cols.includes(f.key)}
                          onCheckedChange={(c) =>
                            setCols((prev) =>
                              c ? [...prev, f.key] : prev.filter((k) => k !== f.key),
                            )
                          }
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={exportSummary}>
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
              </div>
              <div className="overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      {active.map((f) => (
                        <th key={f.key} className="whitespace-nowrap px-2 py-2 font-semibold">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.noLog} className="border-t">
                        {active.map((f) => (
                          <td key={f.key} className="whitespace-nowrap px-2 py-1.5">
                            {String(r[f.key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={active.length} className="py-8 text-center text-muted-foreground">
                          Belum ada data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{logs.length} aktivitas tercatat</div>
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 text-left">
                    <tr>
                      <th className="px-2 py-2">Waktu</th>
                      <th className="px-2 py-2">User</th>
                      <th className="px-2 py-2">Modul</th>
                      <th className="px-2 py-2">Aksi</th>
                      <th className="px-2 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="whitespace-nowrap px-2 py-1.5">
                          {new Date(l.ts).toLocaleString("id-ID")}
                        </td>
                        <td className="px-2 py-1.5">{l.user}</td>
                        <td className="px-2 py-1.5">
                          <Badge variant="outline">{l.module}</Badge>
                        </td>
                        <td className="px-2 py-1.5 font-medium">{l.action}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{l.detail}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          Belum ada aktivitas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}