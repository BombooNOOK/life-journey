import { readFileSync } from "node:fs";
import path from "node:path";

export function splitPipeList(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i]!;
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export function readCsvRecords(filename: string): Record<string, string>[] {
  const filePath = path.join(process.cwd(), "docs", filename);
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw);
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key.trim(), (cells[index] ?? "").trim()])),
  );
}

export function tsStringLiteral(value: string): string {
  return JSON.stringify(value);
}

export function tsStringArray(values: string[]): string {
  return `[${values.map((v) => tsStringLiteral(v)).join(", ")}]`;
}
