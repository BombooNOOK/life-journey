/**
 * AI-5.2 local E2E harness operator helpers (local disposable only).
 *
 * Usage:
 *   npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts seed
 *   npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts cleanup
 *   npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts probe-next
 *   npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts gate
 */
import { assertLocalDisposableDatabaseUrl } from "../src/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  cleanupLocalE2eActorFixture,
  seedLocalE2eActorFixture,
} from "../src/lib/localE2eHarness/seedLocalE2eActor";
import { evaluateLocalE2eHarnessGate } from "../src/lib/localE2eHarness/gate";

const cmd = process.argv[2] ?? "help";

async function probeNext() {
  const base = (process.env.LJD_LOCAL_E2E_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const url = new URL(base);
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error("probe_host_not_loopback");
  }
  const home = await fetch(`${base}/`, { method: "GET", redirect: "manual" });
  console.log(JSON.stringify({ probe: "home", status: home.status, ok: home.status > 0 }, null, 2));
  const status = await fetch(`${base}/api/local-e2e/status`, {
    method: "GET",
    headers: { Host: "127.0.0.1:3000" },
  });
  console.log(
    JSON.stringify(
      {
        probe: "harness_status",
        status: status.status,
        body: await status.json().catch(() => null),
      },
      null,
      2,
    ),
  );
}

async function main() {
  if (cmd === "help") {
    console.log("commands: seed | cleanup | probe-next | gate");
    return;
  }
  if (cmd === "gate") {
    const gate = evaluateLocalE2eHarnessGate({ requestHost: "127.0.0.1" });
    console.log(
      JSON.stringify(
        {
          ok: gate.ok,
          reason: gate.reason,
          actorEmail: gate.actorEmail,
          db: { host: gate.db.host, port: gate.db.port, database: gate.db.database },
        },
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "probe-next") {
    await probeNext();
    return;
  }
  assertLocalDisposableDatabaseUrl();
  if (cmd === "seed") {
    const fixture = await seedLocalE2eActorFixture();
    console.log(JSON.stringify({ seeded: true, email: fixture.email, profileId: fixture.profileId }, null, 2));
    return;
  }
  if (cmd === "cleanup") {
    await cleanupLocalE2eActorFixture();
    console.log(JSON.stringify({ cleaned: true }, null, 2));
    return;
  }
  throw new Error(`unknown_command:${cmd}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
