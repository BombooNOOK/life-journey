/**
 * 調査スクリプト向け: 本番 Neon への誤接続と Network transfer 急増を防ぐガード。
 * 通常開発はローカル DB（docs/DEV_DATABASE.md）。
 */

export type DatabaseHostKind = "missing" | "local" | "neon" | "remote";

export type SafeDatabaseGuardOptions = {
  /** スクリプトファイル名（ログ用） */
  scriptName: string;
  /**
   * photoDataUrl 本文または全行スキャン（length/LIKE 含む）で Neon egress が大きい。
   * 本番では ALLOW_PROD_PHOTO_DATA_URL_READ=1 も必要。
   */
  readsPhotoDataUrl?: boolean;
  /** 日記本文・コメントなど、1冊あたり数 MB 級の読み取りがあり得る */
  readsLargeJournalPayload?: boolean;
  /** INSERT/DELETE 等（スモークテスト） */
  mutatesDatabase?: boolean;
};

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

export function formatDatabaseHostLabel(databaseUrl: string): string {
  if (!databaseUrl.trim()) return "(DATABASE_URL unset)";
  try {
    const u = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
    const db = u.pathname.replace(/^\//, "").split("?")[0] || "(no db name)";
    const port = u.port ? `:${u.port}` : "";
    return `${u.hostname}${port}/${db}`;
  } catch {
    return "(DATABASE_URL parse failed)";
  }
}

export function classifyDatabaseHost(databaseUrl: string): DatabaseHostKind {
  if (!databaseUrl.trim()) return "missing";
  try {
    const u = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
    const host = u.hostname.toLowerCase();
    if (LOCAL_HOSTNAMES.has(host)) return "local";
    if (host.endsWith(".neon.tech") || host.includes(".neon.tech")) return "neon";
    return "remote";
  } catch {
    return "missing";
  }
}

function printProdWarningLines(options: SafeDatabaseGuardOptions, label: string): void {
  console.error("");
  console.error("╔══════════════════════════════════════════════════════════════════╗");
  console.error("║  WARNING: Production-like database connection                   ║");
  console.error("╚══════════════════════════════════════════════════════════════════╝");
  console.error(`  script: ${options.scriptName}`);
  console.error(`  target: ${label}`);
  console.error("  Neon Network transfer is billed on data read from the database.");
  console.error("  Prefer local DB: npm run db:local:up && npm run db:local:sync");
  console.error("  See docs/DEV_DATABASE.md and docs/PROD_DATABASE_INVESTIGATION.md");
  if (options.readsPhotoDataUrl) {
    console.error("");
    console.error("  *** This script scans JournalEntry.photoDataUrl (VERY HIGH egress). ***");
    console.error("  *** One run can read ~5+ MB per book of photos; full table = sum of all photos. ***");
  }
  if (options.readsLargeJournalPayload) {
    console.error("");
    console.error("  *** This script reads full diary entry payloads (content, comments). ***");
    console.error("  *** Each book can be ~0.02–5+ MB depending on app version and photos. ***");
  }
  if (options.mutatesDatabase) {
    console.error("");
    console.error("  *** This script WRITES or DELETES rows. Do not run against production. ***");
  }
  console.error("");
}

/**
 * 接続先を表示し、本番 Neon 相当では明示オプションなしで process.exit(1)。
 * ローカル（127.0.0.1 等）ではそのまま続行。
 */
export function requireSafeDatabaseUrl(options: SafeDatabaseGuardOptions): void {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const label = formatDatabaseHostLabel(databaseUrl);
  const kind = classifyDatabaseHost(databaseUrl);

  console.log(`DATABASE_HOST: ${label} (${kind})`);

  if (kind === "missing") {
    console.error("DATABASE_URL is not set. Use .env.local with local Postgres (see docs/DEV_DATABASE.md).");
    process.exit(1);
  }

  if (kind === "local") {
    return;
  }

  const isNeon = kind === "neon";
  const needsProdAck = isNeon || kind === "remote";

  if (!needsProdAck) return;

  printProdWarningLines(options, label);

  if (options.mutatesDatabase && process.env.ALLOW_PROD_DB_MUTATION !== "1") {
    console.error("Refusing to run mutating script on non-local database.");
    console.error("If you truly intend this (NOT recommended): ALLOW_PROD_DB_MUTATION=1");
    process.exit(1);
  }

  if (options.readsPhotoDataUrl) {
    if (process.env.ALLOW_PROD_PHOTO_DATA_URL_READ !== "1") {
      console.error("Refusing: photoDataUrl-heavy read on non-local database.");
      console.error("To run once with acknowledgement (minimize repeats):");
      console.error("  ALLOW_PROD_DB=1 ALLOW_PROD_PHOTO_DATA_URL_READ=1 npx tsx scripts/...");
      process.exit(1);
    }
  }

  if (process.env.ALLOW_PROD_DB !== "1") {
    console.error("Refusing to run on non-local database without explicit opt-in.");
    console.error("To run once with acknowledgement:");
    console.error("  ALLOW_PROD_DB=1 npx tsx scripts/<script>.ts");
    if (options.readsPhotoDataUrl) {
      console.error("  (photo scripts also need ALLOW_PROD_PHOTO_DATA_URL_READ=1)");
    }
    process.exit(1);
  }

  console.warn("ALLOW_PROD_DB=1 acknowledged — proceeding. Record run count and estimated MB read.");
}
