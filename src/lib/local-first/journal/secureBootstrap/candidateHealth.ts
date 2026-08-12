import {
  LOCAL_JOURNAL_EXPECTED_COLUMNS,
  LOCAL_JOURNAL_EXPECTED_TABLES,
} from "@/lib/local-first/journal/database";
import { LOCAL_JOURNAL_SCHEMA_USER_VERSION } from "@/lib/local-first/journal/types";
import type { CandidateHealth } from "@/lib/local-first/journal/secureBootstrap/types";

export function missingExpectedTables(tables: string[]): string[] {
  const have = new Set(tables);
  return LOCAL_JOURNAL_EXPECTED_TABLES.filter((name) => !have.has(name));
}

export function unexpectedTables(tables: string[]): string[] {
  const expected = new Set<string>(LOCAL_JOURNAL_EXPECTED_TABLES);
  return tables.filter((name) => !expected.has(name) && !name.startsWith("sqlite_"));
}

export function columnMismatches(
  columns: Record<string, string[]>,
): string[] {
  const mismatches: string[] = [];
  for (const table of LOCAL_JOURNAL_EXPECTED_TABLES) {
    const have = (columns[table] ?? []).join(",");
    const want = LOCAL_JOURNAL_EXPECTED_COLUMNS[table].join(",");
    if (have !== want) mismatches.push(table);
  }
  return mismatches;
}

export function classifyCandidateHealth(input: {
  exists: boolean;
  encrypted: boolean | null;
  userVersion: number | null;
  tables: string[];
  columns?: Record<string, string[]>;
}): CandidateHealth {
  if (!input.exists) {
    return { status: "missing", reason: null };
  }
  if (input.encrypted === false) {
    return { status: "abnormal", reason: "plaintext_candidate" };
  }
  if (input.encrypted == null) {
    return { status: "abnormal", reason: "encryption_unknown" };
  }
  if (input.userVersion !== LOCAL_JOURNAL_SCHEMA_USER_VERSION) {
    return { status: "abnormal", reason: "user_version_mismatch" };
  }
  const missing = missingExpectedTables(input.tables);
  if (missing.length > 0) {
    return { status: "abnormal", reason: `missing_tables:${missing.join(",")}` };
  }
  const extra = unexpectedTables(input.tables);
  if (extra.length > 0) {
    return { status: "abnormal", reason: `unexpected_tables:${extra.join(",")}` };
  }
  if (input.columns) {
    const drifted = columnMismatches(input.columns);
    if (drifted.length > 0) {
      return { status: "abnormal", reason: `columns:${drifted.join(",")}` };
    }
  }
  return { status: "ready", reason: null };
}
