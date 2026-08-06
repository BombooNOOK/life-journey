/**
 * 同一 Wi‑Fi の iPhone Safari 向けに、LAN IP + HTTPS で next dev を起動する。
 * WebCodecs は Secure Context が必要なため HTTP の 192.168.x.x では不足しやすい。
 *
 * 使い方: npm run dev:lan:https
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certsDir = path.join(root, ".certs");
const certFile = path.join(certsDir, "lan-cert.pem");
const keyFile = path.join(certsDir, "lan-key.pem");
const caCopy = path.join(certsDir, "rootCA.pem");
const port = process.env.PORT || "3000";

function getLanIp() {
  const en0 = spawnSync("ipconfig", ["getifaddr", "en0"], { encoding: "utf8" });
  if (en0.status === 0 && en0.stdout.trim()) return en0.stdout.trim();
  const en1 = spawnSync("ipconfig", ["getifaddr", "en1"], { encoding: "utf8" });
  if (en1.status === 0 && en1.stdout.trim()) return en1.stdout.trim();
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const e of entries || []) {
      if (e.family === "IPv4" && !e.internal) return e.address;
    }
  }
  return null;
}

function ensureMkcert() {
  const which = spawnSync("which", ["mkcert"], { encoding: "utf8" });
  if (which.status !== 0) {
    console.error("mkcert がありません。先に: brew install mkcert");
    process.exit(1);
  }
}

function ensureCerts(lanIp) {
  fs.mkdirSync(certsDir, { recursive: true });
  const caroot = spawnSync("mkcert", ["-CAROOT"], { encoding: "utf8" });
  const caRootPath = (caroot.stdout || "").trim();
  const caSrc = path.join(caRootPath, "rootCA.pem");
  if (fs.existsSync(caSrc)) {
    fs.copyFileSync(caSrc, caCopy);
  }

  const needsRegen =
    !fs.existsSync(certFile) ||
    !fs.existsSync(keyFile) ||
    !fs.readFileSync(certFile, "utf8").includes(lanIp);

  if (needsRegen) {
    console.log(`証明書を生成します（localhost + ${lanIp}）…`);
    const r = spawnSync(
      "mkcert",
      ["-cert-file", certFile, "-key-file", keyFile, "localhost", "127.0.0.1", "::1", lanIp],
      { stdio: "inherit", cwd: root },
    );
    if (r.status !== 0) process.exit(r.status || 1);
  }
}

function killPort3000() {
  const killer = path.join(root, "scripts/kill-port.mjs");
  if (fs.existsSync(killer)) {
    spawnSync(process.execPath, [killer, port], { stdio: "inherit", cwd: root });
  }
}

const lanIp = getLanIp();
if (!lanIp) {
  console.error("LAN IP を取得できませんでした。Wi‑Fi 接続を確認してください。");
  process.exit(1);
}

ensureMkcert();
ensureCerts(lanIp);
killPort3000();

console.log("");
console.log("=== iPhone Safari 実機検証 ===");
console.log(`Mac LAN IP: ${lanIp}`);
console.log(`検証URL:   https://${lanIp}:${port}/preview/mori-log-device-movie`);
console.log("");
console.log("初回のみ（推奨）:");
console.log(`  1. Mac で必要なら: mkcert -install（パスワード入力・任意）`);
console.log(`  2. iPhone Safari で https://${lanIp}:${port}/api/dev/mkcert-root-ca?format=cer を開き、`);
console.log("     「プロファイルを許可」→ 設定 > 一般 > VPNとデバイス管理 でインストール");
console.log("  3. 設定 > 一般 > 情報 > 証明書信頼設定 でルートを有効化");
console.log("  4. 再び検証URLを開く");
console.log("");
console.log("HTTP は WebCodecs 不可の可能性が高いので使わないでください。");
console.log("");

const env = {
  ...process.env,
  DEV_LAN_HOST: lanIp,
  NEXT_PUBLIC_APP_URL: `https://${lanIp}:${port}`,
};

const child = spawn(
  "npx",
  [
    "next",
    "dev",
    "--hostname",
    "0.0.0.0",
    "--port",
    port,
    "--experimental-https",
    "--experimental-https-key",
    keyFile,
    "--experimental-https-cert",
    certFile,
  ],
  { cwd: root, env, stdio: "inherit" },
);

child.on("exit", (code) => process.exit(code ?? 0));
