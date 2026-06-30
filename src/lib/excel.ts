import * as XLSX from "xlsx";
import { ROW_FIELDS, type InventoryRow, type FieldDef } from "./store";

export function exportRows(rows: InventoryRow[], filename: string, fields: FieldDef[] = ROW_FIELDS) {
  const data = rows.map((r) => {
    const o: Record<string, unknown> = {};
    fields.forEach((f) => (o[f.label] = r[f.key]));
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

export async function importRowsFromFile(
  file: File,
  fields: FieldDef[] = ROW_FIELDS,
): Promise<Partial<InventoryRow>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return json.map((row) => {
    const out: Partial<InventoryRow> = {};
    fields.forEach((f) => {
      const v = row[f.label] ?? row[f.key as string];
      if (v !== undefined && v !== "") {
        if (f.type === "number") (out as Record<string, unknown>)[f.key] = Number(v) || 0;
        else if (f.type === "date") {
          // accept Date, number, or string
          if (typeof v === "number") {
            const d = XLSX.SSF.parse_date_code(v);
            if (d) (out as Record<string, unknown>)[f.key] = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
          } else (out as Record<string, unknown>)[f.key] = String(v).slice(0, 10);
        } else (out as Record<string, unknown>)[f.key] = String(v);
      }
    });
    return out;
  });
}

export function downloadTemplate(filename: string, fields: FieldDef[] = ROW_FIELDS) {
  const header: Record<string, string> = {};
  fields.filter((f) => f.key !== "noLog" && !f.computed).forEach((f) => (header[f.label] = ""));
  const ws = XLSX.utils.json_to_sheet([header]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, filename);
}