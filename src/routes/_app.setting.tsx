import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Lock, Database, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useCurrentUser, type Role } from "@/lib/auth";
import { useDataStore } from "@/lib/store";

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
  field: "peruntukan" | "jenisBahan" | "gudang" | "kategori";
  label: string;
  disabled: boolean;
}) {
  const me = useCurrentUser();
  const { settings, updateSettings } = useDataStore();
  const items = settings[field];
  const [draft, setDraft] = useState("");
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
  return (
    <Card style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="space-y-3 p-4">
        {!disabled && (
          <div className="flex gap-2">
            <Input placeholder={`Tambah ${label}...`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Tambah</Button>
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