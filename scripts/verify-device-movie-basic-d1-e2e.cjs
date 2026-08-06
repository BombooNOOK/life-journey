/**
 * Phase D1「森の映写便り」実エンコード E2E（Playwright Chromium）。
 *
 * 1) /preview/mori-log-device-movie … 3パターン焼き込み＋音声
 * 2) /preview/hitoyasumi?view=movie_compose … UI（下書き→再開→完成→一覧→詳細）
 *    どんぐり API は未ログインのため route mock
 *
 * 前提: npm run dev（127.0.0.1:3000）
 *   node scripts/verify-device-movie-basic-d1-e2e.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES = path.join(ROOT, "tmp/device-movie-samples");
const OUT = path.join(ROOT, "tmp/device-movie-basic-e2e");
const BASE = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3000";

const CASES = [
  {
    id: "landscape-lantern",
    file: "d1-landscape-16x9.mp4",
    decoration: "lantern",
    title: "ひだまりの午後",
    audioMode: "original",
  },
  {
    id: "portrait-owl",
    file: "d1-portrait-9x16.mp4",
    decoration: "owl",
    title: "縦のあしあと",
    audioMode: "mute",
  },
  {
    id: "square-quill",
    file: "d1-square-1x1.mp4",
    decoration: "quill",
    title: "",
    audioMode: "original",
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

function extractFrame(moviePath, outJpg, timeSec = 0.5) {
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-ss", String(timeSec), "-i", moviePath, "-frames:v", "1", "-q:v", "2", outJpg],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffmpeg frame failed: ${r.stderr}`);
}

function probeBlackFringe(posterPath) {
  const script = `
from PIL import Image
im = Image.open(${JSON.stringify(posterPath)}).convert('RGB')
w,h = im.size
vx,vy,vw,vh = int(0.074*w), int(0.065*h), int(0.851*w), int(0.701*h)
pts = [
  (vx-2, vy+40), (vx+40, vy-2),
  (vx+vw+2, vy+40), (vx+vw-40, vy-2),
  (vx+8, vy+8), (vx+vw-8, vy+8), (vx+8, vy+vh-8),
]
blackish=0
samples=[]
px=im.load()
for x,y in pts:
  x=max(0,min(w-1,x)); y=max(0,min(h-1,y))
  r,g,b=px[x,y]
  samples.append(((x,y),(r,g,b)))
  if r<18 and g<18 and b<18:
    blackish += 1
print(f"blackish={blackish}/{len(pts)}")
for s in samples:
  print(s)
`;
  const r = spawnSync("python3", ["-c", script], { encoding: "utf8" });
  return {
    ok: r.status === 0,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
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
  await page.goto(`${BASE}/preview/mori-log-device-movie`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForSelector('input[type="file"]', { timeout: 60_000 });

  await page.evaluate(() => {
    const w = window;
    w.__moriLogDeviceMovieProbe = null;
    w.__moriLogDeviceMovieProbeError = null;
    w.__moriLogDeviceMovieResult = null;
    w.__moriLogDeviceMovieEncodeError = null;
  });

  await page
    .locator(`input[type="radio"][name="decoration"]`)
    .nth(c.decoration === "lantern" ? 0 : c.decoration === "owl" ? 1 : 2)
    .check();
  await page.fill('input[type="text"]', c.title);
  const radios = page.locator('input[type="radio"][name="audio"]');
  await radios.nth(c.audioMode === "mute" ? 1 : 0).check();

  await page.locator('input[type="file"]').evaluate((el) => {
    el.value = "";
  });
  await page.setInputFiles('input[type="file"]', path.join(SAMPLES, c.file));
  try {
    await page.waitForFunction(
      () => window.__moriLogDeviceMovieProbe || window.__moriLogDeviceMovieProbeError,
      null,
      { timeout: 240_000 },
    );
  } catch (e) {
    await page.screenshot({ path: path.join(OUT, `${c.id}-probe-timeout.png`), fullPage: true });
    const dump = await page.evaluate(() => ({
      text: document.body?.innerText?.slice(0, 1500),
      probe: window.__moriLogDeviceMovieProbe,
      err: window.__moriLogDeviceMovieProbeError,
    }));
    throw new Error(`${c.id} probe timeout ${JSON.stringify(dump)}`);
  }
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
        templateId: r.templateId,
        templateVersion: r.templateVersion,
        templateDecorationVariant: r.templateDecorationVariant,
        createdDateKey: r.createdDateKey,
        encoder: r.diagnostics?.encoder,
        movieBytes: r.movieBlob.size,
        posterBytes: r.posterBlob.size,
      },
      movieBuf: Array.from(new Uint8Array(await r.movieBlob.arrayBuffer())),
      posterBuf: Array.from(new Uint8Array(await r.posterBlob.arrayBuffer())),
    };
  });
  if (!out.ok) throw new Error(`${c.id} encode: ${out.error.code} ${out.error.message}`);

  return { ...out, reencodeDecoration: out.meta.templateDecorationVariant };
  } finally {
    await page.close();
  }
}

async function chairFlow(page, c) {
  await mockDonguri(page);
  const url = `${BASE}/preview/hitoyasumi?view=movie_compose&decoration=${c.decoration}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector("text=森の映写便りをつくる", { timeout: 60_000 });

  const newBtn = page.getByRole("button", { name: "新しい動画から作る" });
  if (await newBtn.count()) {
    await newBtn.click();
  }

  await page.setInputFiles('input[type="file"]', path.join(SAMPLES, c.file));
  await page.getByRole("button", { name: "つぎへ" }).first().waitFor({ timeout: 60_000 });
  await page.getByRole("button", { name: "つぎへ" }).first().click();
  await page.getByRole("button", { name: "つぎへ" }).first().click();
  if (c.audioMode === "mute") {
    await page.getByRole("button", { name: "音なし" }).click();
  } else {
    await page.getByRole("button", { name: "動画の音を使う" }).click();
  }
  await page.getByRole("button", { name: "つぎへ" }).first().click();
  if (c.title) {
    await page.locator("input[type='text']").fill(c.title);
  } else {
    await page.locator("input[type='text']").fill("");
  }
  await page.getByRole("button", { name: "プレビューをつくる" }).click();
  await page.waitForFunction(
    () => window.__deviceMovieComposer?.step === "preview" && window.__deviceMovieComposer?.result,
    null,
    { timeout: 420_000 },
  );
  const previewSnap = await page.evaluate(() => ({
    ...window.__deviceMovieComposer,
    resultDecoration: window.__deviceMovieComposer?.result?.templateDecorationVariant,
  }));
  await page.screenshot({ path: path.join(OUT, `${c.id}-preview-ui.png`), fullPage: true });

  // 下書き保存
  const draftSaved = await page.evaluate(async () => {
    if (typeof window.__deviceMovieComposerSaveDraft !== "function") {
      return { ok: false, error: "save hook missing" };
    }
    try {
      const meta = await window.__deviceMovieComposerSaveDraft();
      return { ok: true, ...meta };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });
  if (!draftSaved.ok) throw new Error(`${c.id} draft save: ${draftSaved.error}`);

  // 下書き再開
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
    decoration: window.__deviceMovieComposer?.decoration,
    resultDecoration: window.__deviceMovieComposer?.result?.templateDecorationVariant,
    draftId: window.__deviceMovieComposer?.draftId,
  }));
  await page.screenshot({ path: path.join(OUT, `${c.id}-draft-resume.png`), fullPage: true });

  // 完成
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
    decoration: window.__deviceMovieComposer?.decoration,
  }));
  await page.screenshot({ path: path.join(OUT, `${c.id}-done.png`), fullPage: true });

  await page.getByRole("button", { name: "椅子の一覧を見る" }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `${c.id}-browse.png`), fullPage: true });

  // 詳細：映写機プレートや動画サムネを探して開く
  const candidates = page.locator("button[aria-label]");
  const count = await candidates.count();
  let opened = false;
  for (let i = 0; i < count; i++) {
    const label = (await candidates.nth(i).getAttribute("aria-label")) || "";
    if (/映写|ムービー|森ログ/.test(label)) {
      await candidates.nth(i).click();
      opened = true;
      break;
    }
  }
  if (!opened) {
    // fallback: click first thumbnail-like button in browse
    const thumb = page.locator("button").filter({ has: page.locator("img") }).first();
    if (await thumb.count()) {
      await thumb.click();
      opened = true;
    }
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `${c.id}-detail.png`), fullPage: true });
  const detailHasVideo = await page.locator("video").count();

  return {
    previewSnap,
    draftSaved,
    resumeSnap,
    doneSnap,
    openedDetail: opened,
    detailHasVideo,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const c of CASES) {
    const p = path.join(SAMPLES, c.file);
    if (!fs.existsSync(p)) throw new Error(`missing sample ${p}`);
  }

  const browser = await chromium.launch({ headless: true });
  const report = { cases: [], ok: true };

  try {
    for (const c of CASES) {
      console.log(">> preview encode", c.id);
      const enc = await encodeOnPreviewPage(browser, c);
      const moviePath = path.join(OUT, `${c.id}.mp4`);
      const posterPath = path.join(OUT, `${c.id}.poster.jpg`);
      const framePath = path.join(OUT, `${c.id}.frame.jpg`);
      fs.writeFileSync(moviePath, Buffer.from(enc.movieBuf));
      fs.writeFileSync(posterPath, Buffer.from(enc.posterBuf));
      extractFrame(moviePath, framePath, 1.0);
      const info = ffprobe(moviePath);
      const v = info.streams.find((s) => s.codec_type === "video");
      const a = info.streams.find((s) => s.codec_type === "audio");
      const fringe = probeBlackFringe(posterPath);
      const ratio = Number(v.width) / Number(v.height);
      const entry = {
        id: c.id,
        decorationRequested: c.decoration,
        decorationGot: enc.meta.templateDecorationVariant,
        reencodeDecoration: enc.reencodeDecoration,
        decorationStable: enc.meta.templateDecorationVariant === enc.reencodeDecoration,
        size: `${enc.meta.width}x${enc.meta.height}`,
        ffprobe: `${v?.width}x${v?.height}`,
        ratio4x5: Math.abs(ratio - 0.8) < 0.002,
        audioMode: enc.meta.audioMode,
        hasAudioTrack: Boolean(a),
        audioExpectationOk:
          c.audioMode === "mute" ? !a : Boolean(a),
        durationSec: enc.meta.durationSec,
        encoder: enc.meta.encoder,
        fringe,
        paths: { moviePath, posterPath, framePath },
      };
      if (
        !entry.ratio4x5 ||
        entry.decorationGot !== c.decoration ||
        !entry.decorationStable ||
        !entry.audioExpectationOk
      ) {
        report.ok = false;
      }
      report.cases.push(entry);
      console.log(JSON.stringify(entry, null, 2));
    }

    for (const c of CASES) {
      console.log(">> chair flow", c.id);
      const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
      try {
        const flow = await chairFlow(page, c);
        const slot = report.cases.find((x) => x.id === c.id);
        slot.chairFlow = {
          previewDecoration: flow.previewSnap?.resultDecoration,
          draftId: flow.draftSaved.id,
          draftDecoration: flow.draftSaved.decoration,
          resumeDecoration: flow.resumeSnap?.resultDecoration,
          doneMediaId: flow.doneSnap?.confirmedMediaId,
          openedDetail: flow.openedDetail,
          detailHasVideo: flow.detailHasVideo,
        };
        if (
          flow.previewSnap?.resultDecoration !== c.decoration ||
          flow.resumeSnap?.resultDecoration !== c.decoration ||
          !flow.doneSnap?.confirmedMediaId
        ) {
          report.ok = false;
        }
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
