import { useMemo, useRef, useState } from "react";
import {
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Search,
  Lock,
  X,
  Copy,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useDataStore,
  type ModuleKey,
  type InventoryRow,
  type OutputItem,
  type FieldDef,
  MODULE_LABELS,
  MULTI_OUTPUT_PERUNTUKAN,
  computeRow,
  getModuleFields,
  getRequiredKeys,
} from "@/lib/store";
import { useCurrentUser } from "@/lib/auth";
import { downloadTemplate, exportRows, importRowsFromFile } from "@/lib/excel";

const today = () => new Date().toISOString().slice(0, 10);
const SUMBER_MODULES: ModuleKey[] = ["bahan-baku", "barang-jadi", "barang-proses"];
const NUMERIC_TOTAL_KEYS = new Set<keyof InventoryRow>([
  "qtyAwal", "masuk", "keluar", "susut", "adjust", "qtyAkhir", "harga", "jumlah",
]);

type FormState = Omit<InventoryRow, "noLog" | "createdAt" | "updatedAt" | "createdBy">;

const emptyForm = (): FormState => ({
  noInv: "",
  kodeBahan: "",
  noBox: "",
  peruntukan: "",
  tanggal: today(),
  jenisBahan: "",
  kategori: "",
  keluar: 0,
  masuk: 0,
  gudang: "",
  lokasiBarang: "",
  sumber: "",
  noJo: "",
  customer: "",
  vendor: "",
  keterangan: "",
  qtyAwal: 0,
  susut: 0,
  adjust: 0,
  qtyAkhir: 0,
  harga: 0,
  jumlah: 0,
  outputs: [],
  outputMirrors: [],
});

function fmt(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return v.toLocaleString("id-ID");
}

export function InventoryModule({ moduleKey }: { moduleKey: ModuleKey }) {
  const user = useCurrentUser();
  const { data, settings, addRow, updateRow, deleteRow, bulkAdd, isLocked } = useDataStore();
  const rows = data[moduleKey];
  const [q, setQ] = useState("");
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const fileRef = useRef<HTMLInputElement>(null);
  const isPemakaian = moduleKey === "pemakaian";
  const fields = getModuleFields(moduleKey, settings.moduleColumns);
  const requiredKeys = getRequiredKeys(moduleKey, settings.moduleColumns);
  const showOutputs = isPemakaian && MULTI_OUTPUT_PERUNTUKAN.includes(form.peruntukan);

  /** Aggregated stock per kodeBahan across all modules — used for negative-stock warnings & suggestions. */
  const stockByKodeGlobal = useMemo(() => {
    const m = new Map<string, number>();
    (Object.values(data) as InventoryRow[][]).forEach((rs) =>
      rs.forEach((r) => {
        const cur = m.get(r.kodeBahan) ?? 0;
        m.set(
          r.kodeBahan,
          cur + (r.qtyAwal || 0) + (r.masuk || 0) - (r.keluar || 0) - (r.susut || 0) + (r.adjust || 0),
        );
      }),
    );
    return m;
  }, [data]);

  /** Distinct kode bahan list for datalist suggestions (across all modules). */
  const kodeSuggestions = useMemo(() => {
    const set = new Set<string>();
    (Object.values(data) as InventoryRow[][]).forEach((rs) =>
      rs.forEach((r) => r.kodeBahan && set.add(r.kodeBahan)),
    );
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let out = rows;
    if (q) {
      const s = q.toLowerCase();
      out = out.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(s)),
      );
    }
    if (dateFrom) out = out.filter((r) => r.tanggal >= dateFrom);
    if (dateTo) out = out.filter((r) => r.tanggal <= dateTo);
    for (const [k, v] of Object.entries(colFilters)) {
      if (!v) continue;
      const s = v.toLowerCase();
      out = out.filter((r) =>
        String((r as unknown as Record<string, unknown>)[k] ?? "").toLowerCase().includes(s),
      );
    }
    return out;
  }, [rows, q, dateFrom, dateTo, colFilters]);

  /** Column totals for numeric columns in current filtered view. */
  const colTotals = useMemo(() => {
    const t: Record<string, number> = {};
    fields.forEach((f) => {
      if (NUMERIC_TOTAL_KEYS.has(f.key)) {
        t[f.key] = filtered.reduce((a, r) => a + (Number(r[f.key]) || 0), 0);
      }
    });
    return t;
  }, [filtered, fields]);

  const totalMasuk = rows.reduce((a, r) => a + (r.masuk || 0), 0);
  const totalKeluar = rows.reduce((a, r) => a + (r.keluar || 0), 0);
  const stock = totalMasuk - totalKeluar;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(r: InventoryRow) {
    setEditing(r);
    const { noLog: _n, createdAt: _c, updatedAt: _u, createdBy: _b, ...rest } = r;
    void _n; void _c; void _u; void _b;
    setForm({ ...emptyForm(), ...rest, outputs: r.outputs ?? [], outputMirrors: r.outputMirrors ?? [] });
    setOpen(true);
  }
  function openDuplicate(r: InventoryRow) {
    setEditing(null);
    const { noLog: _n, createdAt: _c, updatedAt: _u, createdBy: _b,
      linkedNoLog: _l, linkedModule: _lm, outputMirrors: _om, ...rest } = r;
    void _n; void _c; void _u; void _b; void _l; void _lm; void _om;
    setForm({
      ...emptyForm(),
      ...rest,
      tanggal: today(),
      outputs: r.outputs ?? [],
      outputMirrors: [],
    });
    setOpen(true);
  }

  /** Build a clean consumption-mirror payload for the source module — never leaks numerics that belong to the source row itself. */
  function buildConsumptionMirror(
    pemakaianNoLog: number,
    src: FormState,
  ): Omit<InventoryRow, "noLog" | "createdAt" | "updatedAt" | "createdBy"> {
    return {
      noInv: src.noInv,
      kodeBahan: src.kodeBahan,
      noBox: src.noBox,
      peruntukan: src.peruntukan,
      tanggal: src.tanggal,
      jenisBahan: src.jenisBahan,
      kategori: src.kategori,
      keluar: src.keluar,
      masuk: src.masuk,
      gudang: src.gudang,
      lokasiBarang: src.lokasiBarang,
      sumber: `pemakaian #${pemakaianNoLog}`,
      noJo: src.noJo,
      customer: src.customer,
      vendor: src.vendor,
      keterangan: `[Auto dari Pemakaian #${pemakaianNoLog}] ${src.keterangan}`.trim(),
      // Movement-only mirror — never inherit balance/cost from the pemakaian row
      qtyAwal: 0, susut: 0, adjust: 0, qtyAkhir: 0, harga: 0, jumlah: 0,
      linkedNoLog: pemakaianNoLog,
      linkedModule: "pemakaian",
      outputs: [],
      outputMirrors: [],
    };
  }

  function createOutputMirrors(
    pemakaianNoLog: number,
    next: FormState,
    username: string,
  ): { module: ModuleKey; noLog: number }[] {
    const list: { module: ModuleKey; noLog: number }[] = [];
    (next.outputs ?? []).forEach((o) => {
      if (!o.kodeBahan || !o.qty || !o.tujuan) return;
      const row = addRow(
        o.tujuan,
        {
          noInv: next.noInv,
          kodeBahan: o.kodeBahan,
          noBox: "",
          peruntukan: next.peruntukan,
          tanggal: next.tanggal,
          jenisBahan: o.jenisBahan,
          kategori: o.kategori,
          keluar: 0,
          masuk: o.qty,
          gudang: o.gudang,
          lokasiBarang: next.lokasiBarang,
          sumber: `pemakaian #${pemakaianNoLog} (output)`,
          noJo: next.noJo,
          customer: next.customer,
          vendor: next.vendor,
          keterangan: o.keterangan ?? `[Output dari Pemakaian #${pemakaianNoLog}]`,
          qtyAwal: 0,
          susut: 0,
          adjust: 0,
          qtyAkhir: 0,
          harga: 0,
          jumlah: 0,
          linkedNoLog: pemakaianNoLog,
          linkedModule: "pemakaian",
        },
        username,
      );
      list.push({ module: o.tujuan, noLog: row.noLog });
    });
    return list;
  }

  function syncMirrorOnEdit(prev: InventoryRow, next: FormState, username: string) {
    const prevModule = prev.linkedModule;
    const prevNoLog = prev.linkedNoLog;
    const nextModule = next.sumber as ModuleKey;
    if (prevModule && prevNoLog && prevModule === nextModule) {
      updateRow(
        prevModule,
        prevNoLog,
        {
          noInv: next.noInv,
          kodeBahan: next.kodeBahan,
          noBox: next.noBox,
          peruntukan: next.peruntukan,
          tanggal: next.tanggal,
          jenisBahan: next.jenisBahan,
          kategori: next.kategori,
          keluar: next.keluar,
          masuk: next.masuk,
          gudang: next.gudang,
          lokasiBarang: next.lokasiBarang,
          noJo: next.noJo,
          customer: next.customer,
          vendor: next.vendor,
          keterangan: `[Auto dari Pemakaian #${prev.noLog}] ${next.keterangan}`.trim(),
        },
        username,
      );
      return;
    }
    if (prevModule && prevNoLog) deleteRow(prevModule, prevNoLog, username);
    if (SUMBER_MODULES.includes(nextModule)) {
      const mirror = addRow(nextModule, buildConsumptionMirror(prev.noLog, next), username);
      updateRow(moduleKey, prev.noLog, { linkedNoLog: mirror.noLog, linkedModule: nextModule }, username);
    }
  }

  function save() {
    if (!user) return;
    if (isLocked(form.tanggal)) return toast.error("Periode ini terkunci");
    // Validate required fields based on module column config
    for (const k of requiredKeys) {
      const v = (form as Record<string, unknown>)[k];
      if (v === undefined || v === null || String(v).trim() === "") {
        const lbl = fields.find((f) => f.key === k)?.label ?? k;
        return toast.error(`${lbl} wajib diisi`);
      }
    }
    if (isPemakaian && !SUMBER_MODULES.includes(form.sumber as ModuleKey)) {
      toast.error("Sumber wajib dipilih (Bahan Baku / Barang Jadi / Barang Dalam Proses)");
      return;
    }
    const computed = computeRow(form) as FormState;

    // Negative-stock guard (warn but allow override) — only when reducing stock
    if (computed.keluar > 0 || computed.susut > 0) {
      const existing = stockByKodeGlobal.get(computed.kodeBahan) ?? 0;
      const prevConsumption = editing
        ? (editing.keluar || 0) + (editing.susut || 0)
        : 0;
      const projected = existing + prevConsumption - (computed.keluar + computed.susut);
      if (projected < 0) {
        const ok = confirm(
          `Peringatan: stok ${computed.kodeBahan} akan menjadi ${projected.toLocaleString("id-ID")} (minus). Lanjutkan?`,
        );
        if (!ok) return;
      }
    }

    if (editing) {
      updateRow(moduleKey, editing.noLog, computed, user.username);
      if (isPemakaian) {
        syncMirrorOnEdit(editing, computed, user.username);
        // re-sync outputs: hapus mirror lama, buat baru
        (editing.outputMirrors ?? []).forEach((m) => deleteRow(m.module, m.noLog, user.username));
        const newMirrors = createOutputMirrors(editing.noLog, computed, user.username);
        updateRow(moduleKey, editing.noLog, { outputMirrors: newMirrors }, user.username);
      }
      toast.success("Data diperbarui");
    } else {
      const created = addRow(moduleKey, computed, user.username);
      if (isPemakaian) {
        const sumberModule = computed.sumber as ModuleKey;
        const mirror = addRow(sumberModule, buildConsumptionMirror(created.noLog, computed), user.username);
        const outMirrors = createOutputMirrors(created.noLog, computed, user.username);
        updateRow(
          moduleKey,
          created.noLog,
          { linkedNoLog: mirror.noLog, linkedModule: sumberModule, outputMirrors: outMirrors },
          user.username,
        );
      }
      toast.success("Data ditambahkan");
    }
    setOpen(false);
  }

  function del(r: InventoryRow) {
    if (!user) return;
    if (isLocked(r.tanggal)) return toast.error("Periode terkunci");
    if (!confirm(`Hapus #${r.noLog}?`)) return;
    deleteRow(moduleKey, r.noLog, user.username);
    if (isPemakaian && r.linkedModule && r.linkedNoLog) {
      deleteRow(r.linkedModule, r.linkedNoLog, user.username);
    }
    if (isPemakaian && r.outputMirrors) {
      r.outputMirrors.forEach((m) => deleteRow(m.module, m.noLog, user.username));
    }
    toast.success("Dihapus");
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    try {
      const parsed = await importRowsFromFile(f, fields);
      const n = bulkAdd(moduleKey, parsed, user.username);
      toast.success(`${n} baris diimpor`);
    } catch (err) {
      toast.error("Gagal mengimpor: " + (err as Error).message);
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{MODULE_LABELS[moduleKey]}</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data {MODULE_LABELS[moduleKey].toLowerCase()} dengan integrasi penuh.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={onImport} />
          <Button variant="outline" size="sm" onClick={() => downloadTemplate(`template-${moduleKey}.xlsx`, fields)}>
            <FileSpreadsheet className="mr-1 h-4 w-4" />Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportRows(filtered, `${moduleKey}-${today()}.xlsx`, fields)}>
            <Download className="mr-1 h-4 w-4" />Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editing ? `Edit #${editing.noLog}` : "Tambah Entri"} — {MODULE_LABELS[moduleKey]}
                </DialogTitle>
              </DialogHeader>
              <DynamicForm
                fields={fields}
                form={form}
                setForm={setForm}
                settings={settings}
                isPemakaian={isPemakaian}
                requiredKeys={requiredKeys}
                kodeSuggestions={kodeSuggestions}
                stockByKode={stockByKodeGlobal}
              />
              {showOutputs && (
                <OutputsEditor
                  outputs={form.outputs ?? []}
                  onChange={(outs) => setForm({ ...form, outputs: outs })}
                  settings={settings}
                />
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={save}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Entri" value={rows.length} tone="primary" />
        <StatCard label="Total Masuk" value={totalMasuk} tone="success" />
        <StatCard label="Total Keluar" value={totalKeluar} tone="warning" />
        <StatCard label="Stok Saat Ini" value={stock} tone="info" />
      </div>

      <Card style={{ boxShadow: "var(--shadow-card)" }}>
        <CardContent className="p-3">
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="relative max-w-sm flex-1">
              <Label className="text-xs">Cari Global</Label>
              <Search className="absolute left-2 top-7 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." className="pl-8" />
            </div>
            <div>
              <Label className="text-xs">Dari Tanggal</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setDateFrom(""); setDateTo(""); setColFilters({}); }}>
              <X className="mr-1 h-3.5 w-3.5" />Reset
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length} / {rows.length}
            </div>
          </div>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left">
                <tr>
                  {fields.map((f) => (
                    <th key={f.key} className="whitespace-nowrap px-2 py-2 font-semibold">{f.label}</th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
                <tr className="bg-muted/30">
                  {fields.map((f) => (
                    <th key={f.key} className="px-1 py-1">
                      <Input
                        value={colFilters[f.key] ?? ""}
                        onChange={(e) => setColFilters({ ...colFilters, [f.key]: e.target.value })}
                        placeholder="Filter..."
                        className="h-7 text-xs"
                      />
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const locked = isLocked(r.tanggal);
                  return (
                    <tr key={r.noLog} className="border-t hover:bg-muted/30">
                      {fields.map((f) => (
                        <td key={f.key} className="whitespace-nowrap px-2 py-1.5">
                          {f.key === "noLog" ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="font-mono">{r.noLog}</Badge>
                              {r.linkedNoLog && r.linkedModule && (
                                <span
                                  title={`Terhubung ke ${MODULE_LABELS[r.linkedModule]} #${r.linkedNoLog}`}
                                  className="text-muted-foreground"
                                >
                                  <Link2 className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          ) : f.key === "sumber" && isPemakaian && SUMBER_MODULES.includes(r.sumber as ModuleKey) ? (
                            <Badge variant="secondary">{MODULE_LABELS[r.sumber as ModuleKey]}</Badge>
                          ) : f.type === "number" ? (
                            <span className="font-mono">{fmt(r[f.key] as number)}</span>
                          ) : (
                            String(r[f.key] ?? "")
                          )}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-2 py-1.5 text-right">
                        {locked ? (
                          <Lock className="inline h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Duplikasi" onClick={() => openDuplicate(r)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del(r)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={fields.length + 1} className="py-8 text-center text-muted-foreground">
                      Belum ada data
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-muted/40 font-semibold">
                  <tr>
                    {fields.map((f, i) => (
                      <td key={f.key} className="whitespace-nowrap px-2 py-1.5">
                        {i === 0 ? "Total" : NUMERIC_TOTAL_KEYS.has(f.key) ? (
                          <span className="font-mono">{fmt(colTotals[f.key])}</span>
                        ) : ""}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> baris terhubung antar modul</span>
            <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" /> auto-mirror Pemakaian → modul sumber</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DynamicForm({
  fields,
  form,
  setForm,
  settings,
  isPemakaian,
  requiredKeys,
  kodeSuggestions,
  stockByKode,
}: {
  fields: FieldDef[];
  form: FormState;
  setForm: (f: FormState) => void;
  settings: { peruntukan: string[]; jenisBahan: string[]; gudang: string[]; kategori: string[]; lokasiBarang: string[] };
  isPemakaian: boolean;
  requiredKeys: Set<string>;
  kodeSuggestions: string[];
  stockByKode: Map<string, number>;
}) {
  const live = computeRow(form) as FormState;
  const settingsMap: Record<string, string[] | undefined> = {
    peruntukan: settings.peruntukan,
    jenisBahan: settings.jenisBahan,
    kategori: settings.kategori,
    gudang: settings.gudang,
    lokasiBarang: settings.lokasiBarang,
  };
  const currentStock = form.kodeBahan ? stockByKode.get(form.kodeBahan) ?? 0 : null;
  return (
    <>
    {form.kodeBahan && currentStock !== null && (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
        Stok global <span className="font-mono font-semibold">{form.kodeBahan}</span>:{" "}
        <span className={"font-mono font-semibold " + (currentStock < 0 ? "text-destructive" : "text-foreground")}>
          {currentStock.toLocaleString("id-ID")}
        </span>
      </div>
    )}
    <datalist id="adsan-kode-suggest">
      {kodeSuggestions.map((k) => <option key={k} value={k} />)}
    </datalist>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.filter((f) => f.key !== "noLog").map((f) => {
        const k = f.key as string;
        const req = requiredKeys.has(k);
        const star = req ? " *" : "";
        if (k === "sumber" && isPemakaian) {
          return (
            <div key={k}>
              <Label className="text-xs">Sumber (Modul Referensi){req ? " *" : ""}</Label>
              <Select value={form.sumber || undefined} onValueChange={(v) => setForm({ ...form, sumber: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih modul sumber..." /></SelectTrigger>
                <SelectContent>
                  {SUMBER_MODULES.map((m) => (
                    <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        const opts = settingsMap[k];
        if (opts) {
          return (
            <FormSelect
              key={k}
              label={f.label + star}
              value={String((form as Record<string, unknown>)[k] ?? "")}
              options={opts}
              onChange={(v) => setForm({ ...form, [k]: v } as FormState)}
            />
          );
        }
        if (k === "keterangan") {
          return (
            <div key={k} className="sm:col-span-2">
              <Label className="text-xs">{f.label + star}</Label>
              <Textarea
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                rows={2}
              />
            </div>
          );
        }
        if (f.computed) {
          return (
            <div key={k}>
              <Label className="text-xs">{f.label} (otomatis)</Label>
              <Input value={fmt((live as Record<string, unknown>)[k])} readOnly className="bg-muted/40 font-mono" />
            </div>
          );
        }
        if (k === "kodeBahan") {
          return (
            <div key={k}>
              <Label className="text-xs">{f.label + star}</Label>
              <Input
                list="adsan-kode-suggest"
                value={form.kodeBahan}
                onChange={(e) => setForm({ ...form, kodeBahan: e.target.value })}
              />
            </div>
          );
        }
        return (
          <FormField
            key={k}
            label={f.label + star}
            type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
            value={String((form as Record<string, unknown>)[k] ?? "")}
            onChange={(v) =>
              setForm({ ...form, [k]: f.type === "number" ? Number(v) || 0 : v } as FormState)
            }
          />
        );
      })}
    </div>
    </>
  );
}

function OutputsEditor({
  outputs,
  onChange,
  settings,
}: {
  outputs: OutputItem[];
  onChange: (o: OutputItem[]) => void;
  settings: { jenisBahan: string[]; gudang: string[]; kategori: string[] };
}) {
  function update(i: number, patch: Partial<OutputItem>) {
    onChange(outputs.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function add() {
    onChange([
      ...outputs,
      {
        kodeBahan: "",
        jenisBahan: settings.jenisBahan[0] ?? "",
        kategori: settings.kategori[0] ?? "",
        gudang: settings.gudang[0] ?? "",
        tujuan: "barang-jadi",
        qty: 0,
        keterangan: "",
      },
    ]);
  }
  function remove(i: number) {
    onChange(outputs.filter((_, idx) => idx !== i));
  }
  return (
    <div className="mt-2 rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Output Produk (Multi)</div>
          <div className="text-xs text-muted-foreground">
            Untuk Mutasi / Repair / Regrading / Produksi — satu input dapat menghasilkan beberapa produk.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" />Tambah Output
        </Button>
      </div>
      {outputs.length === 0 && (
        <div className="py-2 text-center text-xs text-muted-foreground">Belum ada output</div>
      )}
      <div className="space-y-2">
        {outputs.map((o, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-md border bg-background p-2 sm:grid-cols-7">
            <Input placeholder="Kode" value={o.kodeBahan} onChange={(e) => update(i, { kodeBahan: e.target.value })} />
            <Select value={o.jenisBahan || undefined} onValueChange={(v) => update(i, { jenisBahan: v })}>
              <SelectTrigger><SelectValue placeholder="Jenis" /></SelectTrigger>
              <SelectContent>{settings.jenisBahan.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={o.kategori || undefined} onValueChange={(v) => update(i, { kategori: v })}>
              <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>{settings.kategori.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={o.gudang || undefined} onValueChange={(v) => update(i, { gudang: v })}>
              <SelectTrigger><SelectValue placeholder="Gudang" /></SelectTrigger>
              <SelectContent>{settings.gudang.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={o.tujuan} onValueChange={(v) => update(i, { tujuan: v as ModuleKey })}>
              <SelectTrigger><SelectValue placeholder="Tujuan" /></SelectTrigger>
              <SelectContent>
                {SUMBER_MODULES.map((m) => <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Qty" value={o.qty} onChange={(e) => update(i, { qty: Number(e.target.value) || 0 })} />
            <div className="flex gap-1">
              <Input placeholder="Ket." value={o.keterangan ?? ""} onChange={(e) => update(i, { keterangan: e.target.value })} />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const toneMap: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    info: "border-accent/30 bg-accent/5",
  };
  return (
    <Card className={toneMap[tone]} style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value.toLocaleString("id-ID")}</div>
      </CardContent>
    </Card>
  );
}