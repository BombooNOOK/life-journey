/**
 * Phase D2「森の音楽」実エンコード E2E（Playwright Chromium）。
 *
 * - 横長 + projector001 / 縦長 + projector002 / 正方形 + projector003
 * - original / mute 回帰
 *
 * 前提: npm run dev（127.0.0.1:3000）とサンプル動画
 *   node scripts/verify-device-movie-basic-d2-bgm-e2e.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES = path.join(ROOT, "tmp/device-movie-samples");
const OUT = path.join(ROOT, "tmp/device-movie-basic-d2-e2e");
const BASE = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3000";

const CASES = [
  {
    id: "landscape-bgm-a",
    file: "d1-landscape-16x9.mp4",
    decoration: "lantern",
    title: "ひだまりBGM",
    audioMode: "bgm",
    bgmId: "projector001",
  },
  {
    id: "portrait-bgm-b",
    file: "d1-portrait-9x16.mp4",
    decoration: "owl",
    title: "縦のあしあとBGM",
    audioMode: "bgm",
    bgmId: "projector002",
  },
  {
    id: "square-bgm-c",
    file: "d1-square-1x1.mp4",
    decoration: "quill",
    title: "",
    audioMode: "bgm",
    bgmId: "projector003",
  },
  {
    id: "landscape-original",
    file: "d1-landscape-16x9.mp4",
    decoration: "lantern",
    title: "元音声",
    audioMode: "original",
    bgmId: null,
  },
  {
    id: "portrait-mute",
    file: "d1-portrait-9x16.mp4",
    decoration: "owl",
    title: "音なし",
    audioMode: "mute",
    bgmId: null,
  },
];

function ffprobe(filePath) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout);
}

async function mockDonguri(page) {
  await page.route("**/api/loghouse/donguri/mori-log-device-movie/status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        firstFreeAvailable: true,
        balance: 10,
        paidCost: 2,
      }),
    });
  });
  await page.route("**/api/loghouse/donguri/mori-log-device-movie/confirm", async (route) => {
    const body = route.request().postDataJSON() || {};
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        mediaId: body.mediaId,
        chargeType: "first_free",
        amount: 0,
        balance: 10,
        alreadyProcessed: false,
      }),
    });
  });
}

async function encodeOnPreviewPage(browser, c) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  try {
    let loaded = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await page.goto(`${BASE}/preview/mori-log-device-movie`, {
          waitUntil: "domcontentloaded",
          timeout: 120_000,
        });
        await page.waitForSelector('input[type="file"]', {
          state: "attached",
          timeout: 45_000,
        });
        loaded = true;
        break;
      } catch (err) {
        console.warn(`${c.id} page load attempt ${attempt} failed`, String(err && err.message ? err.message : err));
        if (attempt === 3) throw err;
        await page.waitForTimeout(1500);
      }
    }
    if (!loaded) throw new Error("preview page failed to load");

    await page.evaluate(() => {
      window.__moriLogDeviceMovieProbe = null;
      window.__moriLogDeviceMovieProbeError = null;
      window.__moriLogDeviceMovieResult = null;
      window.__moriLogDeviceMovieEncodeError = null;
    });

    await page
      .locator(`input[type="radio"][name="decoration"]`)
      .nth(c.decoration === "lantern" ? 0 : c.decoration === "owl" ? 1 : 2)
      .check();
    await page.fill('input[type="text"]', c.title);

    if (c.audioMode === "original") {
      await page.getByText("動画の音を使う", { exact: true }).click();
    } else if (c.audioMode === "bgm") {
      await page.getByText("森の音楽をつける", { exact: true }).click();
      await page.getByLabel("BGM").waitFor({ timeout: 15_000 });
      await page.getByLabel("BGM").selectOption(c.bgmId);
    } else {
      await page.getByText("音なし", { exact: true }).click();
    }

    await page.setInputFiles('input[type="file"]', path.join(SAMPLES, c.file));
    await page.waitForFunction(
      () => window.__moriLogDeviceMovieProbe || window.__moriLogDeviceMovieProbeError,
      null,
      { timeout: 240_000 },
    );
    const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
    if (probeErr) throw new Error(`${c.id} probe: ${probeErr}`);

    const numbers = page.locator('input[type="number"]');
    await numbers.nth(0).fill("1");
    await numbers.nth(1).fill("5");

    await page.getByRole("button", { name: "エンコード開始" }).click();
    await page.waitForFunction(
      () => window.__moriLogDeviceMovieResult || window.__moriLogDeviceMovieEncodeError,
      null,
      { timeout: 420_000 },
    );

    const out = await page.evaluate(async () => {
      const w = window;
      if (w.__moriLogDeviceMovieEncodeError) {
        return { ok: false, error: w.__moriLogDeviceMovieEncodeError };
      }
      const r = w.__moriLogDeviceMovieResult;
      return {
        ok: true,
        meta: {
          mimeType: r.mimeType,
          fileExtension: r.fileExtension,
          durationSec: r.durationSec,
          width: r.width,
          height: r.height,
          audioMode: r.audioMode,
          bgmId: r.bgmId ?? null,
          bgmName: r.bgmName ?? null,
          templateId: r.templateId,
          templateDecorationVariant: r.templateDecorationVariant,
          encoder: r.diagnostics?.encoder,
          movieBytes: r.movieBlob.size,
          posterBytes: r.posterBlob.size,
        },
        movieBuf: Array.from(new Uint8Array(await r.movieBlob.arrayBuffer())),
        posterBuf: Array.from(new Uint8Array(await r.posterBlob.arrayBuffer())),
      };
    });
    if (!out.ok) throw new Error(`${c.id} encode: ${out.error.code} ${out.error.message}`);
    return out;
  } finally {
    await page.close();
  }
}

async function chairFlowBgm(page, c) {
  await mockDonguri(page);
  const url = `${BASE}/preview/hitoyasumi?view=movie_compose&decoration=${c.decoration}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector("text=森の映写便りをつくる", { timeout: 60_000 });

  const newBtn = page.getByRole("button", { name: "新しい動画から作る" });
  if (await newBtn.count()) {
    await newBtn.click();
    await page.waitForTimeout(400);
  }

  const samplePath = path.join(SAMPLES, c.file);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 30_000 }),
    page.getByText("動画を選ぶ", { exact: true }).click(),
  ]);
  await chooser.setFiles(samplePath);

  await page.waitForFunction(
    () => {
      const body = document.body?.innerText || "";
      if (!body.includes("つぎへ")) return false;
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        (b.textContent || "").includes("つぎへ"),
      );
      return Boolean(btn && !btn.disabled);
    },
    null,
    { timeout: 180_000 },
  );
  await page.getByRole("button", { name: "つぎへ", exact: true }).click(); // trim
  await page.getByRole("button", { name: "つぎへ", exact: true }).click(); // audio

  if (c.audioMode === "mute") {
    await page.getByRole("button", { name: "音なし" }).click();
  } else if (c.audioMode === "bgm") {
    await page.getByRole("button", { name: "森の音楽をつける" }).click();
    const trackTitle =
      c.bgmId === "projector002"
        ? "映写機の曲 2"
        : c.bgmId === "projector003"
          ? "映写機の曲 3"
          : "映写機の曲 1";
    await page
      .locator("button[aria-pressed]")
      .filter({ hasText: trackTitle })
      .first()
      .click();
  } else {
    await page.getByRole("button", { name: "動画の音を使う" }).click();
  }
  await page.getByRole("button", { name: "つぎへ" }).first().click();

  if (c.title) await page.locator("input[type='text']").fill(c.title);
  else await page.locator("input[type='text']").fill("");

  await page.getByRole("button", { name: "プレビューをつくる" }).click();
  await page.waitForFunction(
    () => window.__deviceMovieComposer?.step === "preview" && window.__deviceMovieComposer?.result,
    null,
    { timeout: 420_000 },
  );
  const previewSnap = await page.evaluate(() => ({
    step: window.__deviceMovieComposer?.step,
    audioMode: window.__deviceMovieComposer?.audioMode,
    bgmId: window.__deviceMovieComposer?.bgmId,
    resultAudioMode: window.__deviceMovieComposer?.result?.audioMode,
    resultBgmId: window.__deviceMovieComposer?.result?.bgmId,
    resultBgmName: window.__deviceMovieComposer?.result?.bgmName,
  }));

  const draftSaved = await page.evaluate(async () => {
    try {
      const meta = await window.__deviceMovieComposerSaveDraft();
      return { ok: true, ...meta };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });
  if (!draftSaved.ok) throw new Error(`${c.id} draft save: ${draftSaved.error}`);

  await page.goto(
    `${BASE}/preview/hitoyasumi?view=movie_compose&draftId=${encodeURIComponent(draftSaved.id)}&decoration=${c.decoration}`,
    { waitUntil: "domcontentloaded" },
  );
  await page.waitForFunction(
    () => window.__deviceMovieComposer?.step === "preview" && window.__deviceMovieComposer?.result,
    null,
    { timeout: 120_000 },
  );
  const resumeSnap = await page.evaluate(() => ({
    audioMode: window.__deviceMovieComposer?.audioMode,
    bgmId: window.__deviceMovieComposer?.bgmId,
    resultBgmId: window.__deviceMovieComposer?.result?.bgmId,
    resultBgmName: window.__deviceMovieComposer?.result?.bgmName,
    body: document.body.innerText.slice(0, 1200),
  }));

  await page.getByRole("button", { name: "この一場面を残す" }).click();
  await page.waitForFunction(
    () =>
      window.__deviceMovieComposer?.step === "done" ||
      document.body.innerText.includes("森ログムービーができました"),
    null,
    { timeout: 180_000 },
  );
  const doneSnap = await page.evaluate(() => ({
    step: window.__deviceMovieComposer?.step,
    confirmedMediaId: window.__deviceMovieComposer?.confirmedMediaId,
  }));

  return { previewSnap, draftSaved, resumeSnap, doneSnap };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const c of CASES) {
    const p = path.join(SAMPLES, c.file);
    if (!fs.existsSync(p)) throw new Error(`missing sample ${p}`);
  }

  const browser = await chromium.launch({ headless: true });
  const report = { cases: [], ok: true };
  const skipEncode = process.env.D2_SKIP_ENCODE === "1";

  try {
    if (skipEncode) {
      const prevPath = path.join(OUT, "report.json");
      if (!fs.existsSync(prevPath)) throw new Error("D2_SKIP_ENCODE requires existing report.json");
      const prev = JSON.parse(fs.readFileSync(prevPath, "utf8"));
      report.cases = prev.cases || [];
      report.ok = prev.cases?.every((c) => c.ok !== false) ?? true;
      console.log(">> skip encode, reuse", prevPath);
    } else {
    for (const c of CASES) {
      console.log(">> preview encode", c.id);
      const enc = await encodeOnPreviewPage(browser, c);
      const moviePath = path.join(OUT, `${c.id}.mp4`);
      const posterPath = path.join(OUT, `${c.id}.poster.jpg`);
      fs.writeFileSync(moviePath, Buffer.from(enc.movieBuf));
      fs.writeFileSync(posterPath, Buffer.from(enc.posterBuf));
      const info = ffprobe(moviePath);
      const v = info.streams.find((s) => s.codec_type === "video");
      const a = info.streams.find((s) => s.codec_type === "audio");
      const videoDur = Number(v?.duration ?? info.format?.duration ?? 0);
      const audioDur = Number(a?.duration ?? 0);
      const entry = {
        id: c.id,
        requested: { audioMode: c.audioMode, bgmId: c.bgmId },
        got: {
          audioMode: enc.meta.audioMode,
          bgmId: enc.meta.bgmId,
          bgmName: enc.meta.bgmName,
          size: `${enc.meta.width}x${enc.meta.height}`,
          durationSec: enc.meta.durationSec,
          encoder: enc.meta.encoder,
        },
        ffprobe: {
          video: v ? `${v.codec_name} ${v.width}x${v.height}` : null,
          audio: a ? `${a.codec_name} ch=${a.channels}` : null,
          videoDur,
          audioDur,
          avDelta: a ? Math.abs(videoDur - audioDur) : null,
        },
        checks: {
          audioModeOk: enc.meta.audioMode === c.audioMode,
          bgmIdOk: c.audioMode !== "bgm" || enc.meta.bgmId === c.bgmId,
          hasAudioTrack:
            c.audioMode === "mute" ? !a : Boolean(a),
          aacOk: c.audioMode === "mute" ? !a : a?.codec_name === "aac",
          avAligned: !a || Math.abs(videoDur - audioDur) < 0.35,
        },
        paths: { moviePath, posterPath },
      };
      entry.ok = Object.values(entry.checks).every(Boolean);
      if (!entry.ok) report.ok = false;
      report.cases.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }
    }

    // chair: BGM 1本 + original + mute を軽く確認
    const chairCases = [CASES[0], CASES[3], CASES[4]];
    for (const c of chairCases) {
      console.log(">> chair flow", c.id);
      const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
      try {
        const flow = await chairFlowBgm(page, c);
        const slot = report.cases.find((x) => x.id === c.id);
        slot.chairFlow = {
          preview: flow.previewSnap,
          resume: {
            audioMode: flow.resumeSnap.audioMode,
            bgmId: flow.resumeSnap.bgmId,
            resultBgmId: flow.resumeSnap.resultBgmId,
            lockedCopy:
              c.audioMode === "bgm"
                ? /この下書きでは「映写機の曲/.test(flow.resumeSnap.body)
                : null,
          },
          doneMediaId: flow.doneSnap.confirmedMediaId,
        };
        if (
          flow.previewSnap.resultAudioMode !== c.audioMode ||
          (c.audioMode === "bgm" && flow.resumeSnap.resultBgmId !== c.bgmId) ||
          !flow.doneSnap.confirmedMediaId
        ) {
          report.ok = false;
          slot.chairFlowOk = false;
        } else {
          slot.chairFlowOk = true;
        }
        await page.screenshot({
          path: path.join(OUT, `${c.id}-chair.png`),
          fullPage: true,
        });
      } catch (e) {
        report.ok = false;
        const slot = report.cases.find((x) => x.id === c.id);
        slot.chairFlowError = String(e && e.message ? e.message : e);
        console.error(c.id, "chair flow error", e);
        await page.screenshot({
          path: path.join(OUT, `${c.id}-chair-error.png`),
          fullPage: true,
        });
      } finally {
        await page.close();
      }
    }

    fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
    console.log("wrote", path.join(OUT, "report.json"));
    if (!report.ok) process.exitCode = 2;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
