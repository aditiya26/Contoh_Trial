import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModuleKey =
  | "bahan-baku"
  | "barang-jadi"
  | "barang-proses"
  | "barang-perjalanan"
  | "pemakaian";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  "bahan-baku": "Bahan Baku",
  "barang-jadi": "Barang Jadi",
  "barang-proses": "Barang Dalam Proses",
  "barang-perjalanan": "Barang Dalam Perjalanan",
  "pemakaian": "Pemakaian",
};

/** Peruntukan yang menghasilkan banyak output (multi-produk dari satu input). */
export const MULTI_OUTPUT_PERUNTUKAN = [
  "Mutasi",
  "Repair",
  "Regrading",
  "Produksi",
  "Penjualan",
  "Pembelian",
];

export interface OutputItem {
  kodeBahan: string;
  jenisBahan: string;
  kategori: string;
  gudang: string;
  tujuan: ModuleKey; // modul tujuan output (bahan-baku / barang-jadi / barang-proses)
  qty: number;
  keterangan?: string;
}

export interface InventoryRow {
  noLog: number;
  noInv: string;
  kodeBahan: string;
  noBox: string;
  peruntukan: string;
  tanggal: string; // YYYY-MM-DD
  jenisBahan: string;
  kategori: string;
  keluar: number;
  masuk: number;
  gudang: string;
  lokasiBarang: string;
  sumber: string;
  noJo: string;
  customer: string;
  vendor: string;
  keterangan: string;
  qtyAwal: number;
  susut: number;
  adjust: number;
  qtyAkhir: number;
  harga: number;
  jumlah: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  /** When this row is linked to a row in another module (e.g. pemakaian ↔ source module) */
  linkedNoLog?: number;
  linkedModule?: ModuleKey;
  /** Pemakaian only: multi-output produk hasil mutasi/repair/regrading/produksi */
  outputs?: OutputItem[];
  /** Pemakaian only: referensi baris cermin output ke modul tujuan */
  outputMirrors?: { module: ModuleKey; noLog: number }[];
}

export type FieldDef = {
  key: keyof InventoryRow;
  label: string;
  type?: "number" | "date" | "text";
  /** Field dihitung otomatis (read-only di form). */
  computed?: boolean;
};

/** Daftar semua field yang mungkin (untuk export semua-kolom / laporan). */
export const ROW_FIELDS: FieldDef[] = [
  { key: "noLog", label: "No Log", type: "number" },
  { key: "tanggal", label: "Tanggal", type: "date" },
  { key: "noInv", label: "No. Inv" },
  { key: "kodeBahan", label: "Kode Bahan" },
  { key: "jenisBahan", label: "Jenis Bahan" },
  { key: "kategori", label: "Kategori" },
  { key: "noBox", label: "No Box" },
  { key: "gudang", label: "Gudang" },
  { key: "lokasiBarang", label: "Lokasi Barang" },
  { key: "peruntukan", label: "Peruntukan" },
  { key: "sumber", label: "Sumber" },
  { key: "qtyAwal", label: "Qty Awal", type: "number" },
  { key: "masuk", label: "Masuk", type: "number" },
  { key: "keluar", label: "Keluar", type: "number" },
  { key: "susut", label: "Susut", type: "number" },
  { key: "adjust", label: "Adjust", type: "number" },
  { key: "qtyAkhir", label: "Qty Akhir", type: "number", computed: true },
  { key: "harga", label: "Harga", type: "number" },
  { key: "jumlah", label: "Jumlah", type: "number", computed: true },
  { key: "noJo", label: "No JO" },
  { key: "customer", label: "Customer" },
  { key: "vendor", label: "Vendor" },
  { key: "keterangan", label: "Keterangan" },
];

const F = (k: keyof InventoryRow): FieldDef => ROW_FIELDS.find((f) => f.key === k)!;

/** Susunan kolom per modul (urutan tampil & form). */
export const MODULE_FIELDS: Record<ModuleKey, FieldDef[]> = {
  "bahan-baku": [
    F("noLog"), F("tanggal"), F("noInv"), F("kodeBahan"), F("jenisBahan"), F("kategori"),
    F("noBox"), F("gudang"), F("lokasiBarang"), F("peruntukan"), F("sumber"),
    F("qtyAwal"), F("masuk"), F("keluar"), F("susut"), F("adjust"), F("qtyAkhir"),
    F("harga"), F("jumlah"),
    F("noJo"), F("customer"), F("vendor"), F("keterangan"),
  ],
  "barang-jadi": [
    F("noLog"), F("tanggal"), F("noInv"), F("kodeBahan"), F("jenisBahan"), F("kategori"),
    F("noBox"), F("gudang"), F("lokasiBarang"), F("peruntukan"), F("sumber"),
    F("qtyAwal"), F("masuk"), F("keluar"), F("susut"), F("adjust"), F("qtyAkhir"),
    F("noJo"), F("customer"), F("keterangan"),
  ],
  "barang-proses": [
    F("noLog"), F("tanggal"), F("noInv"), F("kodeBahan"), F("jenisBahan"), F("kategori"),
    F("noBox"), F("gudang"), F("lokasiBarang"), F("peruntukan"), F("sumber"),
    F("qtyAwal"), F("masuk"), F("keluar"), F("qtyAkhir"),
    F("noJo"), F("keterangan"),
  ],
  "barang-perjalanan": [
    F("noLog"), F("tanggal"), F("noInv"), F("kodeBahan"), F("jenisBahan"), F("kategori"),
    F("gudang"), F("lokasiBarang"), F("peruntukan"), F("sumber"), F("vendor"), F("customer"),
    F("qtyAwal"), F("masuk"), F("keluar"), F("qtyAkhir"),
    F("noJo"), F("keterangan"),
  ],
  "pemakaian": [
    F("noLog"), F("tanggal"), F("noInv"), F("kodeBahan"), F("jenisBahan"), F("kategori"),
    F("noBox"), F("peruntukan"), F("sumber"), F("gudang"), F("lokasiBarang"),
    F("masuk"), F("keluar"),
    F("noJo"), F("customer"), F("vendor"), F("keterangan"),
  ],
};

export interface ModuleColumnConfig {
  key: keyof InventoryRow;
  visible: boolean;
  required: boolean;
}

const REQUIRED_DEFAULTS: Partial<Record<keyof InventoryRow, boolean>> = {
  kodeBahan: true,
  tanggal: true,
};

export function defaultModuleColumns(m: ModuleKey): ModuleColumnConfig[] {
  return MODULE_FIELDS[m].map((f) => ({
    key: f.key,
    visible: true,
    required: !!REQUIRED_DEFAULTS[f.key],
  }));
}

function defaultAllModuleColumns(): Record<ModuleKey, ModuleColumnConfig[]> {
  return {
    "bahan-baku": defaultModuleColumns("bahan-baku"),
    "barang-jadi": defaultModuleColumns("barang-jadi"),
    "barang-proses": defaultModuleColumns("barang-proses"),
    "barang-perjalanan": defaultModuleColumns("barang-perjalanan"),
    "pemakaian": defaultModuleColumns("pemakaian"),
  };
}

/** Effective ordered FieldDef list for a module based on settings (fallback to defaults). */
export function getModuleFields(
  m: ModuleKey,
  moduleColumns?: Record<ModuleKey, ModuleColumnConfig[]>,
): FieldDef[] {
  const cfg = moduleColumns?.[m] ?? defaultModuleColumns(m);
  return cfg
    .filter((c) => c.visible)
    .map((c) => ROW_FIELDS.find((f) => f.key === c.key))
    .filter((x): x is FieldDef => !!x);
}

export function getRequiredKeys(
  m: ModuleKey,
  moduleColumns?: Record<ModuleKey, ModuleColumnConfig[]>,
): Set<string> {
  const cfg = moduleColumns?.[m] ?? defaultModuleColumns(m);
  return new Set(cfg.filter((c) => c.required && c.visible).map((c) => c.key as string));
}

export function computeRow<T extends Partial<InventoryRow>>(r: T): T {
  const qtyAwal = Number(r.qtyAwal ?? 0) || 0;
  const masuk = Number(r.masuk ?? 0) || 0;
  const keluar = Number(r.keluar ?? 0) || 0;
  const susut = Number(r.susut ?? 0) || 0;
  const adjust = Number(r.adjust ?? 0) || 0;
  const harga = Number(r.harga ?? 0) || 0;
  const qtyAkhir = qtyAwal + masuk - keluar - susut + adjust;
  return { ...r, qtyAwal, masuk, keluar, susut, adjust, harga, qtyAkhir, jumlah: qtyAkhir * harga };
}

export interface ActivityLog {
  id: string;
  ts: string;
  user: string;
  module: ModuleKey | "setting" | "auth" | "todo" | "dashboard";
  action: string;
  detail?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Settings {
  peruntukan: string[];
  jenisBahan: string[];
  gudang: string[];
  kategori: string[];
  lokasiBarang: string[];
  lockedUntil: string | null; // entries with tanggal <= this are locked
  dashboardWidgets: { id: string; visible: boolean }[];
  moduleColumns: Record<ModuleKey, ModuleColumnConfig[]>;
}

interface DataState {
  counters: Record<ModuleKey, number>;
  data: Record<ModuleKey, InventoryRow[]>;
  todos: TodoItem[];
  logs: ActivityLog[];
  settings: Settings;
  addRow: (m: ModuleKey, row: Omit<InventoryRow, "noLog" | "createdAt" | "updatedAt" | "createdBy">, user: string) => InventoryRow;
  updateRow: (m: ModuleKey, noLog: number, patch: Partial<InventoryRow>, user: string) => void;
  deleteRow: (m: ModuleKey, noLog: number, user: string) => void;
  bulkAdd: (m: ModuleKey, rows: Partial<InventoryRow>[], user: string) => number;
  addTodo: (text: string, user: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateSettings: (patch: Partial<Settings>, user: string) => void;
  log: (l: Omit<ActivityLog, "id" | "ts">) => void;
  isLocked: (tanggal: string) => boolean;
  seedSampleData: (user: string) => void;
  resetAllData: (user: string) => void;
}

const DEFAULT_SETTINGS: Settings = {
  peruntukan: ["Produksi", "Mutasi", "Repair", "Regrading", "Penjualan", "Pembelian", "Sample", "Stok", "Maintenance"],
  jenisBahan: ["Kain", "Benang", "Aksesoris", "Packaging", "Sparepart"],
  gudang: ["Gudang Utama", "Gudang Produksi", "Gudang Finishing"],
  kategori: ["A", "B", "C"],
  lokasiBarang: ["Rak A1", "Rak A2", "Rak B1", "Rak B2", "Area Loading"],
  lockedUntil: null,
  dashboardWidgets: [
    { id: "stock-summary", visible: true },
    { id: "module-counts", visible: true },
    { id: "recent-activity", visible: true },
    { id: "low-stock", visible: true },
    { id: "todo", visible: true },
    { id: "chart-movements", visible: true },
  ],
  moduleColumns: defaultAllModuleColumns(),
};

const emptyData = (): Record<ModuleKey, InventoryRow[]> => ({
  "bahan-baku": [],
  "barang-jadi": [],
  "barang-proses": [],
  "barang-perjalanan": [],
  "pemakaian": [],
});

const emptyCounters = (): Record<ModuleKey, number> => ({
  "bahan-baku": 0,
  "barang-jadi": 0,
  "barang-proses": 0,
  "barang-perjalanan": 0,
  "pemakaian": 0,
});

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      counters: emptyCounters(),
      data: emptyData(),
      todos: [],
      logs: [],
      settings: DEFAULT_SETTINGS,

      isLocked: (tanggal) => {
        const lock = get().settings.lockedUntil;
        if (!lock) return false;
        return tanggal <= lock;
      },

      addRow: (m, row, user) => {
        const next = get().counters[m] + 1;
        const now = new Date().toISOString();
        const computed = computeRow(row);
        const full: InventoryRow = {
          ...(computed as Omit<InventoryRow, "noLog" | "createdAt" | "updatedAt" | "createdBy">),
          noLog: next,
          createdAt: now,
          updatedAt: now,
          createdBy: user,
        };
        set((s) => ({
          counters: { ...s.counters, [m]: next },
          data: { ...s.data, [m]: [full, ...s.data[m]] },
        }));
        get().log({ user, module: m, action: "create", detail: `#${next} ${row.kodeBahan}` });
        return full;
      },

      updateRow: (m, noLog, patch, user) => {
        set((s) => ({
          data: {
            ...s.data,
            [m]: s.data[m].map((r) =>
              r.noLog === noLog
                ? (computeRow({ ...r, ...patch, updatedAt: new Date().toISOString() }) as InventoryRow)
                : r,
            ),
          },
        }));
        get().log({ user, module: m, action: "update", detail: `#${noLog}` });
      },

      deleteRow: (m, noLog, user) => {
        set((s) => ({ data: { ...s.data, [m]: s.data[m].filter((r) => r.noLog !== noLog) } }));
        get().log({ user, module: m, action: "delete", detail: `#${noLog}` });
      },

      bulkAdd: (m, rows, user) => {
        let counter = get().counters[m];
        const now = new Date().toISOString();
        const made: InventoryRow[] = rows.map((r) => {
          counter += 1;
          const base = {
            noLog: counter,
            noInv: String(r.noInv ?? ""),
            kodeBahan: String(r.kodeBahan ?? ""),
            noBox: String(r.noBox ?? ""),
            peruntukan: String(r.peruntukan ?? ""),
            tanggal: String(r.tanggal ?? new Date().toISOString().slice(0, 10)),
            jenisBahan: String(r.jenisBahan ?? ""),
            kategori: String(r.kategori ?? ""),
            keluar: Number(r.keluar ?? 0) || 0,
            masuk: Number(r.masuk ?? 0) || 0,
            gudang: String(r.gudang ?? ""),
            lokasiBarang: String(r.lokasiBarang ?? ""),
            sumber: String(r.sumber ?? ""),
            noJo: String(r.noJo ?? ""),
            customer: String(r.customer ?? ""),
            vendor: String(r.vendor ?? ""),
            keterangan: String(r.keterangan ?? ""),
            qtyAwal: Number(r.qtyAwal ?? 0) || 0,
            susut: Number(r.susut ?? 0) || 0,
            adjust: Number(r.adjust ?? 0) || 0,
            qtyAkhir: 0,
            harga: Number(r.harga ?? 0) || 0,
            jumlah: 0,
            createdAt: now,
            updatedAt: now,
            createdBy: user,
          };
          return computeRow(base) as InventoryRow;
        });
        set((s) => ({
          counters: { ...s.counters, [m]: counter },
          data: { ...s.data, [m]: [...made.reverse(), ...s.data[m]] },
        }));
        get().log({ user, module: m, action: "import", detail: `${made.length} rows` });
        return made.length;
      },

      addTodo: (text, user) => {
        const t: TodoItem = { id: uid(), text, done: false, createdBy: user, createdAt: new Date().toISOString() };
        set((s) => ({ todos: [t, ...s.todos] }));
        get().log({ user, module: "todo", action: "add", detail: text });
      },
      toggleTodo: (id) =>
        set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

      updateSettings: (patch, user) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        get().log({ user, module: "setting", action: "update", detail: Object.keys(patch).join(", ") });
      },

      log: (l) =>
        set((s) => ({
          logs: [{ ...l, id: uid(), ts: new Date().toISOString() }, ...s.logs].slice(0, 2000),
        })),

      resetAllData: (user) => {
        set({ counters: emptyCounters(), data: emptyData() });
        get().log({ user, module: "setting", action: "reset", detail: "all data cleared" });
      },

      seedSampleData: (user) => {
        get().resetAllData(user);
        const { addRow } = get();
        const td = (n: number) => {
          const d = new Date();
          d.setDate(d.getDate() - n);
          return d.toISOString().slice(0, 10);
        };
        const blank = {
          noInv: "", noBox: "", peruntukan: "Stok", jenisBahan: "Kain", kategori: "A",
          keluar: 0, masuk: 0, gudang: "Gudang Utama", lokasiBarang: "Rak A1", sumber: "Pembelian Awal",
          noJo: "", customer: "", vendor: "PT Sumber Makmur", keterangan: "Data contoh",
          qtyAwal: 0, susut: 0, adjust: 0, qtyAkhir: 0, harga: 0, jumlah: 0,
        };
        // 5 Bahan Baku awal
        const bb = [
          { kodeBahan: "BB-001", noBox: "BX-01", jenisBahan: "Kain", kategori: "A", qtyAwal: 0, masuk: 1000, harga: 25000, tanggal: td(20) },
          { kodeBahan: "BB-002", noBox: "BX-02", jenisBahan: "Benang", kategori: "B", qtyAwal: 0, masuk: 500, harga: 8000, tanggal: td(19) },
          { kodeBahan: "BB-003", noBox: "BX-03", jenisBahan: "Aksesoris", kategori: "A", qtyAwal: 0, masuk: 2000, harga: 1500, tanggal: td(18) },
          { kodeBahan: "BB-004", noBox: "BX-04", jenisBahan: "Packaging", kategori: "C", qtyAwal: 0, masuk: 1500, harga: 1200, tanggal: td(17) },
          { kodeBahan: "BB-005", noBox: "BX-05", jenisBahan: "Sparepart", kategori: "B", qtyAwal: 0, masuk: 100, harga: 75000, tanggal: td(16) },
        ];
        bb.forEach((x) => addRow("bahan-baku", { ...blank, ...x }, user));
        // 5 Barang Jadi awal
        const bj = [
          { kodeBahan: "BJ-001", noBox: "PK-01", qtyAwal: 0, masuk: 200, gudang: "Gudang Finishing", tanggal: td(15), customer: "PT Retail Jaya" },
          { kodeBahan: "BJ-002", noBox: "PK-02", qtyAwal: 0, masuk: 150, gudang: "Gudang Finishing", tanggal: td(14), customer: "CV Mitra Sukses" },
          { kodeBahan: "BJ-003", noBox: "PK-03", qtyAwal: 0, masuk: 80, gudang: "Gudang Finishing", tanggal: td(13), customer: "PT Retail Jaya" },
          { kodeBahan: "BJ-004", noBox: "PK-04", qtyAwal: 0, masuk: 120, gudang: "Gudang Finishing", tanggal: td(12), customer: "Toko Sentosa" },
          { kodeBahan: "BJ-005", noBox: "PK-05", qtyAwal: 0, masuk: 90, gudang: "Gudang Finishing", tanggal: td(11), customer: "PT Distribusi Cepat" },
        ];
        bj.forEach((x) => addRow("barang-jadi", { ...blank, ...x, jenisBahan: "Kain", sumber: "Hasil Produksi" }, user));
        // 5 Barang Dalam Proses
        const bp = [
          { kodeBahan: "WIP-001", qtyAwal: 0, masuk: 300, gudang: "Gudang Produksi", tanggal: td(10), noJo: "JO-0001" },
          { kodeBahan: "WIP-002", qtyAwal: 0, masuk: 250, gudang: "Gudang Produksi", tanggal: td(9), noJo: "JO-0002" },
          { kodeBahan: "WIP-003", qtyAwal: 0, masuk: 180, gudang: "Gudang Produksi", tanggal: td(8), noJo: "JO-0003" },
          { kodeBahan: "WIP-004", qtyAwal: 0, masuk: 220, gudang: "Gudang Produksi", tanggal: td(7), noJo: "JO-0004" },
          { kodeBahan: "WIP-005", qtyAwal: 0, masuk: 160, gudang: "Gudang Produksi", tanggal: td(6), noJo: "JO-0005" },
        ];
        bp.forEach((x) => addRow("barang-proses", { ...blank, ...x, sumber: "Proses Produksi" }, user));
        // 5 Barang Dalam Perjalanan
        const bdp = [
          { kodeBahan: "BB-001", qtyAwal: 0, masuk: 500, vendor: "PT Sumber Makmur", tanggal: td(5) },
          { kodeBahan: "BB-002", qtyAwal: 0, masuk: 300, vendor: "CV Bahan Prima", tanggal: td(4) },
          { kodeBahan: "BJ-001", qtyAwal: 0, keluar: 100, customer: "PT Retail Jaya", tanggal: td(3) },
          { kodeBahan: "BJ-003", qtyAwal: 0, keluar: 50, customer: "CV Mitra Sukses", tanggal: td(2) },
          { kodeBahan: "BB-003", qtyAwal: 0, masuk: 800, vendor: "PT Aksesoris Mandiri", tanggal: td(1) },
        ];
        bdp.forEach((x) => addRow("barang-perjalanan", { ...blank, ...x, sumber: "Pengiriman" }, user));
        // 5 Pemakaian (akan auto-mirror ke source module)
        const helper = (
          partial: Partial<InventoryRow>,
          sumber: ModuleKey,
          outputs?: OutputItem[],
        ) => {
          const created = addRow(
            "pemakaian",
            { ...blank, ...partial, sumber, outputs } as Omit<
              InventoryRow,
              "noLog" | "createdAt" | "updatedAt" | "createdBy"
            >,
            user,
          );
          // mirror konsumsi ke source
          const mirror = addRow(
            sumber,
            {
              ...blank,
              kodeBahan: created.kodeBahan,
              jenisBahan: created.jenisBahan,
              kategori: created.kategori,
              gudang: created.gudang,
              peruntukan: created.peruntukan,
              tanggal: created.tanggal,
              masuk: created.masuk,
              keluar: created.keluar,
              sumber: `pemakaian #${created.noLog}`,
              keterangan: `[Auto dari Pemakaian #${created.noLog}]`,
              linkedNoLog: created.noLog,
              linkedModule: "pemakaian",
            } as Omit<InventoryRow, "noLog" | "createdAt" | "updatedAt" | "createdBy">,
            user,
          );
          // mirror outputs ke modul tujuan masing-masing
          const outMirrors: { module: ModuleKey; noLog: number }[] = [];
          (outputs ?? []).forEach((o) => {
            const om = addRow(
              o.tujuan,
              {
                ...blank,
                kodeBahan: o.kodeBahan,
                jenisBahan: o.jenisBahan,
                kategori: o.kategori,
                gudang: o.gudang,
                peruntukan: created.peruntukan,
                tanggal: created.tanggal,
                masuk: o.qty,
                sumber: `pemakaian #${created.noLog} (output)`,
                keterangan: o.keterangan ?? `[Output dari Pemakaian #${created.noLog}]`,
                linkedNoLog: created.noLog,
                linkedModule: "pemakaian",
              } as Omit<InventoryRow, "noLog" | "createdAt" | "updatedAt" | "createdBy">,
              user,
            );
            outMirrors.push({ module: o.tujuan, noLog: om.noLog });
          });
          get().updateRow(
            "pemakaian",
            created.noLog,
            { linkedNoLog: mirror.noLog, linkedModule: sumber, outputMirrors: outMirrors },
            user,
          );
        };
        helper(
          { kodeBahan: "BB-001", peruntukan: "Produksi", keluar: 200, tanggal: td(5), noJo: "JO-0001" },
          "bahan-baku",
          [{ kodeBahan: "WIP-101", jenisBahan: "Kain", kategori: "A", gudang: "Gudang Produksi", tujuan: "barang-proses", qty: 180, keterangan: "Hasil produksi" }],
        );
        helper(
          { kodeBahan: "WIP-001", peruntukan: "Produksi", keluar: 100, tanggal: td(4), noJo: "JO-0002" },
          "barang-proses",
          [
            { kodeBahan: "BJ-101", jenisBahan: "Kain", kategori: "A", gudang: "Gudang Finishing", tujuan: "barang-jadi", qty: 80 },
            { kodeBahan: "BJ-102", jenisBahan: "Kain", kategori: "B", gudang: "Gudang Finishing", tujuan: "barang-jadi", qty: 15 },
          ],
        );
        helper(
          { kodeBahan: "BJ-001", peruntukan: "Mutasi", keluar: 50, tanggal: td(3), customer: "PT Retail Jaya" },
          "barang-jadi",
          [{ kodeBahan: "BJ-001", jenisBahan: "Kain", kategori: "A", gudang: "Gudang Utama", tujuan: "barang-jadi", qty: 50, keterangan: "Mutasi antar gudang" }],
        );
        helper(
          { kodeBahan: "BJ-002", peruntukan: "Regrading", keluar: 30, tanggal: td(2) },
          "barang-jadi",
          [
            { kodeBahan: "BJ-002A", jenisBahan: "Kain", kategori: "A", gudang: "Gudang Finishing", tujuan: "barang-jadi", qty: 20, keterangan: "Grade A" },
            { kodeBahan: "BJ-002B", jenisBahan: "Kain", kategori: "B", gudang: "Gudang Finishing", tujuan: "barang-jadi", qty: 10, keterangan: "Grade B" },
          ],
        );
        helper(
          { kodeBahan: "BB-002", peruntukan: "Sample", keluar: 20, tanggal: td(1), customer: "CV Mitra Sukses" },
          "bahan-baku",
        );
        get().log({ user, module: "setting", action: "seed", detail: "data contoh dimuat" });
      },
    }),
    {
      name: "adsan-erp-data",
      version: 3,
      migrate: (state: unknown, version: number) => {
        const s = (state as Partial<DataState>) ?? {};
        const settings = { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) };
        if (!settings.moduleColumns) settings.moduleColumns = defaultAllModuleColumns();
        if (!settings.lokasiBarang) settings.lokasiBarang = DEFAULT_SETTINGS.lokasiBarang;
        // Ensure new peruntukan options exist
        ["Penjualan", "Pembelian"].forEach((p) => {
          if (!settings.peruntukan.includes(p)) settings.peruntukan.push(p);
        });
        // Backfill noInv / lokasiBarang on existing rows
        const data = s.data ?? emptyData();
        (Object.keys(data) as ModuleKey[]).forEach((m) => {
          data[m] = (data[m] ?? []).map((r) => ({
            ...r,
            noInv: (r as InventoryRow).noInv ?? "",
            lokasiBarang: (r as InventoryRow).lokasiBarang ?? "",
          }));
        });
        void version;
        return { ...s, settings, data } as DataState;
      },
    },
  ),
);