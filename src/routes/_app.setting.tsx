import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Lock, Database, RotateCcw, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useCurrentUser, type Role } from "@/lib/auth";
import {
  useDataStore,
  MODULE_LABELS,
  MODULE_FIELDS,
  ROW_FIELDS,
  defaultModuleColumns,
  type ModuleKey,
  type ModuleColumnConfig,
} from "@/lib/store";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_app/setting")({
  head: () => ({ meta: [{ title: "Setting — ADSAN" }] }),
  component: Setting,
});

function Setting() {
  const me = useCurrentUser();
  const isAdmin = me?.role === "admin";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Setting</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi aplikasi, master data, dan pengguna.
        </p>
      </div>
      {!isAdmin && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          Mode read-only. Hanya admin yang dapat mengubah pengaturan.
        </div>
      )}
      <Tabs defaultValue="users">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="peruntukan">Peruntukan</TabsTrigger>
          <TabsTrigger value="jenis">Jenis Bahan</TabsTrigger>
          <TabsTrigger value="gudang">Gudang</TabsTrigger>
          <TabsTrigger value="kategori">Kategori</TabsTrigger>
          <TabsTrigger value="lokasi">Lokasi Barang</TabsTrigger>
          <TabsTrigger value="kolom">Kolom Modul</TabsTrigger>
          <TabsTrigger value="lock">Kunci Periode</TabsTrigger>
          <TabsTrigger value="data">Data Contoh</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserSettings disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="peruntukan">
          <ListEditor field="peruntukan" label="Peruntukan" disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="jenis">
          <ListEditor field="jenisBahan" label="Jenis Bahan" disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="gudang">
          <ListEditor field="gudang" label="Gudang" disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="kategori">
          <ListEditor field="kategori" label="Kategori" disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="lokasi">
          <ListEditor field="lokasiBarang" label="Lokasi Barang" disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="kolom">
          <ModuleColumnSettings disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="lock">
          <LockPeriod disabled={!isAdmin} />
        </TabsContent>
        <TabsContent value="data">
          <SampleData disabled={!isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserSettings({ disabled }: { disabled: boolean }) {
  const { users, addUser, removeUser, updateUser } = useAuth();
  const [u, setU] = useState({ username: "", name: "", password: "", role: "operator" as Role });
  function add() {
    if (!u.username || !u.password) return toast.error("Username & password wajib");
    addUser(u);
    setU({ username: "", name: "", password: "", role: "operator" });
    toast.success("Pengguna ditambahkan");
  }
  return (
    <Card style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="space-y-4 p-4">
        {!disabled && (
          <div className="grid gap-2 sm:grid-cols-5">
            <Input placeholder="Username" value={u.username} onChange={(e) => setU({ ...u, username: e.target.value })} />
            <Input placeholder="Nama" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} />
            <Input placeholder="Password" type="password" value={u.password} onChange={(e) => setU({ ...u, password: e.target.value })} />
            <Select value={u.role} onValueChange={(v) => setU({ ...u, role: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Tambah</Button>
          </div>
        )}
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{user.username}</td>
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">
                    {disabled ? (
                      <Badge variant="outline">{user.role}</Badge>
                    ) : (
                      <Select value={user.role} onValueChange={(v) => updateUser(user.id, { role: v as Role })}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!disabled && users.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeUser(user.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ListEditor({
  field,
  label,
  disabled,
}: {
  field: "peruntukan" | "jenisBahan" | "gudang" | "kategori" | "lokasiBarang";
  label: string;
  disabled: boolean;
}) {
  const me = useCurrentUser();
  const { settings, updateSettings } = useDataStore();
  const items = settings[field];
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  function add() {
    if (!draft.trim() || !me) return;
    if (items.includes(draft.trim())) return toast.error("Sudah ada");
    updateSettings({ [field]: [...items, draft.trim()] }, me.username);
    setDraft("");
  }
  function remove(v: string) {
    if (!me) return;
    updateSettings({ [field]: items.filter((i) => i !== v) }, me.username);
  }
  function exportXlsx() {
    const ws = XLSX.utils.json_to_sheet(items.map((v) => ({ [label]: v })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `${field}.xlsx`);
  }
  function template() {
    const ws = XLSX.utils.json_to_sheet([{ [label]: "" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `template-${field}.xlsx`);
  }
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !me) return;
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const incoming = json
        .map((r) => String(r[label] ?? r[field] ?? Object.values(r)[0] ?? "").trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...items, ...incoming]));
      updateSettings({ [field]: merged }, me.username);
      toast.success(`${incoming.length} baris diimpor`);
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
    e.target.value = "";
  }
  return (
    <Card style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="space-y-3 p-4">
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-xs" placeholder={`Tambah ${label}...`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Tambah</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={onImport} />
            <Button variant="outline" size="sm" onClick={template}>Template</Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportXlsx}>
              <Download className="mr-1 h-4 w-4" />Export
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {items.map((i) => (
            <Badge key={i} variant="secondary" className="gap-1 px-2 py-1">
              {i}
              {!disabled && (
                <button onClick={() => remove(i)} className="ml-1 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {items.length === 0 && <span className="text-sm text-muted-foreground">Belum ada</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleColumnSettings({ disabled }: { disabled: boolean }) {
  const me = useCurrentUser();
  const { settings, updateSettings } = useDataStore();
  const [mod, setMod] = useState<ModuleKey>("bahan-baku");
  const current = settings.moduleColumns[mod] ?? defaultModuleColumns(mod);

  function update(idx: number, patch: Partial<ModuleColumnConfig>) {
    if (!me) return;
    const next = current.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    updateSettings(
      { moduleColumns: { ...settings.moduleColumns, [mod]: next } },
      me.username,
    );
  }
  function reset() {
    if (!me) return;
    updateSettings(
      { moduleColumns: { ...settings.moduleColumns, [mod]: defaultModuleColumns(mod) } },
      me.username,
    );
    toast.success("Konfigurasi kolom direset");
  }

  const modules: ModuleKey[] = ["bahan-baku", "barang-jadi", "barang-proses", "pemakaian"];

  return (
    <Card style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Atur kolom yang ditampilkan dan kewajiban pengisian per modul. Berlaku ke tabel, form input, dan template Excel.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Modul</Label>
            <Select value={mod} onValueChange={(v) => setMod(v as ModuleKey)}>
              <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!disabled && (
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-1 h-4 w-4" />Reset Default
            </Button>
          )}
        </div>
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2">Kolom</th>
                <th className="px-3 py-2 w-24 text-center">Tampil</th>
                <th className="px-3 py-2 w-24 text-center">Wajib</th>
              </tr>
            </thead>
            <tbody>
              {current.map((c, i) => {
                const def = ROW_FIELDS.find((f) => f.key === c.key);
                const isComputed = def?.computed;
                const isNoLog = c.key === "noLog";
                return (
                  <tr key={c.key} className="border-t">
                    <td className="px-3 py-2">
                      {def?.label ?? c.key}
                      {isComputed && <Badge variant="outline" className="ml-2 text-[10px]">otomatis</Badge>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={c.visible}
                        disabled={disabled || isNoLog}
                        onCheckedChange={(v) => update(i, { visible: !!v })}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={c.required}
                        disabled={disabled || isComputed || isNoLog}
                        onCheckedChange={(v) => update(i, { required: !!v })}
                      />
                    </td>
                  </tr>
                );
              })}
              {/* Show fields not yet in config (e.g. after future additions) */}
              {MODULE_FIELDS[mod]
                .filter((f) => !current.some((c) => c.key === f.key))
                .map((f) => (
                  <tr key={f.key} className="border-t bg-muted/20">
                    <td className="px-3 py-2 italic text-muted-foreground">{f.label} (baru)</td>
                    <td className="px-3 py-2 text-center">—</td>
                    <td className="px-3 py-2 text-center">—</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LockPeriod({ disabled }: { disabled: boolean }) {
  const me = useCurrentUser();
  const { settings, updateSettings } = useDataStore();
  const [val, setVal] = useState(settings.lockedUntil ?? "");
  return (
    <Card style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Semua entri dengan tanggal <strong>≤</strong> tanggal di bawah akan terkunci dan tidak dapat diedit/dihapus.
        </p>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Kunci sampai tanggal</Label>
            <Input type="date" value={val} onChange={(e) => setVal(e.target.value)} disabled={disabled} />
          </div>
          {!disabled && (
            <>
              <Button
                onClick={() => {
                  if (!me) return;
                  updateSettings({ lockedUntil: val || null }, me.username);
                  toast.success("Periode kunci diperbarui");
                }}
              >
                <Lock className="mr-1 h-4 w-4" />Terapkan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!me) return;
                  setVal("");
                  updateSettings({ lockedUntil: null }, me.username);
                  toast.success("Kunci dilepas");
                }}
              >
                Buka Kunci
              </Button>
            </>
          )}
        </div>
        {settings.lockedUntil && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-sm">
            Saat ini terkunci hingga: <strong>{settings.lockedUntil}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SampleData({ disabled }: { disabled: boolean }) {
  const me = useCurrentUser();
  const { seedSampleData, resetAllData, data } = useDataStore();
  const total = Object.values(data).reduce((a, rows) => a + rows.length, 0);
  return (
    <Card style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Muat 5 contoh data ke setiap modul (saling terintegrasi via Pemakaian). Aksi ini menghapus data yang ada.
        </p>
        <div className="text-sm">Total baris saat ini: <strong>{total}</strong></div>
        <div className="flex gap-2">
          <Button
            disabled={disabled}
            onClick={() => {
              if (!me) return;
              if (!confirm("Muat data contoh? Semua data lama akan dihapus.")) return;
              seedSampleData(me.username);
              toast.success("Data contoh dimuat");
            }}
          >
            <Database className="mr-1 h-4 w-4" />Muat Data Contoh
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => {
              if (!me) return;
              if (!confirm("Hapus seluruh data inventori?")) return;
              resetAllData(me.username);
              toast.success("Semua data dihapus");
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" />Reset Semua Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}