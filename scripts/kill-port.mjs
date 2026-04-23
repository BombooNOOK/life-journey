#!/usr/bin/env node
/**
 * 指定ポートで LISTEN しているプロセスを終了（macOS / Linux）。
 * 失敗しても終了コード 0（ポートが空なら何もしない）。
 */
import { execSync } from "node:child_process";
import { platform } from "node:os";

const port = process.argv[2] ?? "3000";
if (platform() === "win32") {
  console.warn("kill-port: Windows は未対応。手動でプロセスを終了してください。");
  process.exit(0);
}
try {
  execSync(`lsof -tiTCP:${port} -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null`, {
    stdio: "ignore",
  });
} catch {
  /* ignore */
}
