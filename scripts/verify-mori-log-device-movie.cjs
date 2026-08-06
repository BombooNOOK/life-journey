/**
 * 端末動画エンコード基盤の手動相当検証（Playwright + Chromium）。
 * 使い方: npm run dev 起動後に
 *   node scripts/verify-mori-log-device-movie.mjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES = path.join(ROOT, "tmp/device-movie-samples");
const OUT_DIR = path.join(ROOT, "tmp/device-movie-encode-out");
const BASE = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3000";

function ffprobeJson(filePath) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout);
}

function ensureGeneratedEdgeCases() {
  const longPath = path.join(SAMPLES, "case4-too-long-under-200mb.mp4");
  const shortPath = path.join(SAMPLES, "case4-too-short.mp4");
  if (!fs.existsSync(longPath)) {
    console.log("generating", path.basename(longPath));
    const r = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=640x360:d=61",
        "-f",
        "lavfi",
        "-i",
        "sine=f=440:d=61",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        longPath,
      ],
      { encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(r.stderr || "ffmpeg long failed");
  }
  if (!fs.existsSync(shortPath)) {
    console.log("generating", path.basename(shortPath));
    const r = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=640x360:d=2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        shortPath,
      ],
      { encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(r.stderr || "ffmpeg short failed");
  }
}

async function waitReady(page) {
  await page.goto(`${BASE}/preview/mori-log-device-movie`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForSelector('input[type="file"]', { timeout: 60_000 });
}

async function pickAndMaybeProbe(page, filePath) {
  await page.evaluate(() => {
    const w = window;
    w.__moriLogDeviceMovieProbe = null;
    w.__moriLogDeviceMovieProbeError = null;
    w.__moriLogDeviceMovieResult = null;
    w.__moriLogDeviceMovieEncodeError = null;
  });
  // 同一ファイル再選択でも change が飛ぶように一旦クリア
  await page.locator('input[type="file"]').evaluate((el) => {
    el.value = "";
  });
  await page.setInputFiles('input[type="file"]', filePath);
  try {
    await page.waitForFunction(
      () => {
        const w = window;
        return Boolean(w.__moriLogDeviceMovieProbeError) || Boolean(w.__moriLogDeviceMovieProbe);
      },
      null,
      { timeout: 180_000 },
    );
  } catch (error) {
    const dump = await page.evaluate(() => ({
      text: document.body?.innerText?.slice(0, 2000),
      probe: window.__moriLogDeviceMovieProbe,
      probeError: window.__moriLogDeviceMovieProbeError,
    }));
    console.error("probe wait failed", dump);
    throw error;
  }
}

async function runEncode(page, { startSec, durationSec, audioMode }) {
  await page.fill('input[type="number"]', ""); // first number may clear wrong - set by index
  const numbers = page.locator('input[type="number"]');
  await numbers.nth(0).fill(String(startSec));
  await numbers.nth(1).fill(String(durationSec));
  const radios = page.locator('input[type="radio"][name="audio"]');
  await radios.nth(audioMode === "mute" ? 1 : 0).check();
  await page.evaluate(() => {
    const w = window;
    w.__moriLogDeviceMovieResult = null;
    w.__moriLogDeviceMovieEncodeError = null;
  });
  await page.getByRole("button", { name: "エンコード開始" }).click();
  await page.waitForFunction(
    () => {
      const w = window;
      return Boolean(w.__moriLogDeviceMovieResult) || Boolean(w.__moriLogDeviceMovieEncodeError);
    },
    null,
    { timeout: 300_000 },
  );
  return page.evaluate(async () => {
    const w = window;
    if (w.__moriLogDeviceMovieEncodeError) {
      return { ok: false, error: w.__moriLogDeviceMovieEncodeError };
    }
    const r = w.__moriLogDeviceMovieResult;
    const movieBuf = new Uint8Array(await r.movieBlob.arrayBuffer());
    const posterBuf = new Uint8Array(await r.posterBlob.arrayBuffer());
    return {
      ok: true,
      meta: {
        mimeType: r.mimeType,
        fileExtension: r.fileExtension,
        durationSec: r.durationSec,
        width: r.width,
        height: r.height,
        audioMode: r.audioMode,
        diagnostics: r.diagnostics,
        movieBytes: r.movieBlob.size,
        posterBytes: r.posterBlob.size,
        posterType: r.posterBlob.type,
        templateId: r.templateId ?? null,
        templateVersion: r.templateVersion ?? null,
        templateDecorationVariant: r.templateDecorationVariant ?? null,
        createdDateKey: r.createdDateKey ?? null,
      },
      movieBuf: Array.from(movieBuf),
      posterBuf: Array.from(posterBuf),
    };
  });
}

function writeBuffers(name, out) {
  const moviePath = path.join(OUT_DIR, `${name}.${out.meta.fileExtension}`);
  const posterPath = path.join(OUT_DIR, `${name}.poster.jpg`);
  fs.writeFileSync(moviePath, Buffer.from(out.movieBuf));
  fs.writeFileSync(posterPath, Buffer.from(out.posterBuf));
  return { moviePath, posterPath };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  ensureGeneratedEdgeCases();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const report = [];

  try {
    await waitReady(page);

    // ---- case1 vertical + original audio ----
    {
      const name = "case1-original";
      console.log(">>", name);
      await pickAndMaybeProbe(page, path.join(SAMPLES, "case1MP4.MP4"));
      const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
      if (probeErr) throw new Error(`${name} probe: ${probeErr}`);
      const out = await runEncode(page, { startSec: 2, durationSec: 10, audioMode: "original" });
      if (!out.ok) throw new Error(`${name} encode: ${out.error.code} ${out.error.message}`);
      const paths = writeBuffers(name, out);
      const info = ffprobeJson(paths.moviePath);
      const v = info.streams.find((s) => s.codec_type === "video");
      const a = info.streams.find((s) => s.codec_type === "audio");
      const entry = {
        name,
        pass:
          out.meta.height > out.meta.width &&
          Boolean(a) &&
          out.meta.durationSec <= 10.01 &&
          out.meta.durationSec >= 3 &&
          out.meta.posterBytes > 0 &&
          out.meta.fileExtension === "mp4",
        meta: out.meta,
        probe: {
          video: `${v?.codec_name} ${v?.width}x${v?.height}`,
          audio: a?.codec_name || null,
          duration: info.format.duration,
        },
      };
      report.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }

    // ---- case2 mute (same case1 file) ----
    {
      const name = "case2-mute-on-case1";
      console.log(">>", name);
      await pickAndMaybeProbe(page, path.join(SAMPLES, "case1MP4.MP4"));
      const out = await runEncode(page, { startSec: 0, durationSec: 5, audioMode: "mute" });
      if (!out.ok) throw new Error(`${name} encode: ${out.error.code} ${out.error.message}`);
      const paths = writeBuffers(name, out);
      const info = ffprobeJson(paths.moviePath);
      const a = info.streams.find((s) => s.codec_type === "audio");
      const entry = {
        name,
        pass: !a && out.meta.audioMode === "mute" && out.meta.height > out.meta.width,
        meta: out.meta,
        probe: { audio: a?.codec_name || null, duration: info.format.duration },
      };
      report.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }

    // ---- case3 short whole ----
    {
      const name = "case3-short-whole";
      console.log(">>", name);
      await pickAndMaybeProbe(page, path.join(SAMPLES, "case3.MOV"));
      const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
      if (probeErr) throw new Error(`${name} probe: ${probeErr}`);
      const out = await runEncode(page, { startSec: 0, durationSec: 10, audioMode: "original" });
      if (!out.ok) throw new Error(`${name} encode: ${out.error.code} ${out.error.message}`);
      const paths = writeBuffers(name, out);
      const info = ffprobeJson(paths.moviePath);
      const v = info.streams.find((s) => s.codec_type === "video");
      const dur = Number(info.format.duration);
      const entry = {
        name,
        pass:
          out.meta.width >= out.meta.height &&
          out.meta.durationSec <= 8.52 &&
          out.meta.durationSec >= 3 &&
          dur <= out.meta.durationSec + 0.2 &&
          dur >= out.meta.durationSec - 0.2 &&
          out.meta.posterBytes > 0,
        meta: out.meta,
        probe: {
          video: `${v?.codec_name} ${v?.width}x${v?.height}`,
          duration: info.format.duration,
        },
      };
      report.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }

    // ---- case4 too large ----
    {
      const name = "case4-too-large";
      console.log(">>", name);
      await page.setInputFiles('input[type="file"]', path.join(SAMPLES, "case4.MOV"));
      await page.waitForFunction(
        () => Boolean(window.__moriLogDeviceMovieProbeError),
        null,
        { timeout: 180_000 },
      );
      const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
      const entry = {
        name,
        pass: typeof probeErr === "string" && probeErr.startsWith("SOURCE_TOO_LARGE"),
        probeError: probeErr,
      };
      report.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }

    // ---- case4 too long under 200MB ----
    {
      const name = "case4-too-long";
      console.log(">>", name);
      await page.setInputFiles(
        'input[type="file"]',
        path.join(SAMPLES, "case4-too-long-under-200mb.mp4"),
      );
      await page.waitForFunction(
        () => Boolean(window.__moriLogDeviceMovieProbeError),
        null,
        { timeout: 120_000 },
      );
      const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
      const entry = {
        name,
        pass: typeof probeErr === "string" && probeErr.startsWith("SOURCE_TOO_LONG"),
        probeError: probeErr,
      };
      report.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }

    // ---- case4 too short ----
    {
      const name = "case4-too-short";
      console.log(">>", name);
      await page.setInputFiles('input[type="file"]', path.join(SAMPLES, "case4-too-short.mp4"));
      await page.waitForFunction(
        () => Boolean(window.__moriLogDeviceMovieProbeError),
        null,
        { timeout: 120_000 },
      );
      const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
      const entry = {
        name,
        pass: typeof probeErr === "string" && probeErr.startsWith("SOURCE_TOO_SHORT"),
        probeError: probeErr,
      };
      report.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }
  } finally {
    await browser.close();
  }

  const failed = report.filter((r) => !r.pass);
  fs.writeFileSync(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log("\n=== summary ===");
  for (const r of report) console.log(r.pass ? "PASS" : "FAIL", r.name);
  if (failed.length) {
    process.exitCode = 1;
    console.error(`failed: ${failed.length}`);
  } else {
    console.log("all passed");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
