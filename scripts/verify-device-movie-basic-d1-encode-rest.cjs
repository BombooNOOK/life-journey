const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES = path.join(ROOT, "tmp/device-movie-samples");
const OUT = path.join(ROOT, "tmp/device-movie-basic-e2e");
const BASE = "http://127.0.0.1:3000";

const CASES = [
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

async function encode(browser, c) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  try {
    await page.goto(`${BASE}/preview/mori-log-device-movie`, {
      waitUntil: "networkidle",
      timeout: 180_000,
    });
    await page.waitForSelector('input[type="file"]', { state: "attached", timeout: 120_000 });
    // Playwright: hidden file inputs need force sometimes
    await page.setInputFiles('input[type="file"]', path.join(SAMPLES, c.file));
    await page.waitForFunction(
      () => window.__moriLogDeviceMovieProbe || window.__moriLogDeviceMovieProbeError,
      null,
      { timeout: 120_000 },
    );
    const probeErr = await page.evaluate(() => window.__moriLogDeviceMovieProbeError);
    if (probeErr) throw new Error(probeErr);
    await page
      .locator('input[type="radio"][name="decoration"]')
      .nth(c.decoration === "lantern" ? 0 : c.decoration === "owl" ? 1 : 2)
      .check();
    await page.fill('input[type="text"]', c.title);
    await page
      .locator('input[type="radio"][name="audio"]')
      .nth(c.audioMode === "mute" ? 1 : 0)
      .check();
    await page.locator('input[type="number"]').nth(0).fill("1");
    await page.locator('input[type="number"]').nth(1).fill("5");
    await page.getByRole("button", { name: "エンコード開始" }).click();
    await page.waitForFunction(
      () => window.__moriLogDeviceMovieResult || window.__moriLogDeviceMovieEncodeError,
      null,
      { timeout: 420_000 },
    );
    const out = await page.evaluate(async () => {
      const err = window.__moriLogDeviceMovieEncodeError;
      if (err) return { ok: false, err };
      const r = window.__moriLogDeviceMovieResult;
      return {
        ok: true,
        meta: {
          w: r.width,
          h: r.height,
          d: r.templateDecorationVariant,
          a: r.audioMode,
          bytes: r.movieBlob.size,
          encoder: r.diagnostics?.encoder,
        },
        movie: Array.from(new Uint8Array(await r.movieBlob.arrayBuffer())),
        poster: Array.from(new Uint8Array(await r.posterBlob.arrayBuffer())),
      };
    });
    if (!out.ok) throw new Error(JSON.stringify(out.err));
    fs.writeFileSync(path.join(OUT, `${c.id}.mp4`), Buffer.from(out.movie));
    fs.writeFileSync(path.join(OUT, `${c.id}.poster.jpg`), Buffer.from(out.poster));
    spawnSync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        "1",
        "-i",
        path.join(OUT, `${c.id}.mp4`),
        "-frames:v",
        "1",
        "-q:v",
        "2",
        path.join(OUT, `${c.id}.frame.jpg`),
      ],
      { encoding: "utf8" },
    );
    const probe = spawnSync(
      "ffprobe",
      ["-v", "error", "-print_format", "json", "-show_streams", path.join(OUT, `${c.id}.mp4`)],
      { encoding: "utf8" },
    );
    const info = JSON.parse(probe.stdout);
    const v = info.streams.find((s) => s.codec_type === "video");
    const a = info.streams.find((s) => s.codec_type === "audio");
    console.log(
      JSON.stringify(
        {
          id: c.id,
          meta: out.meta,
          ffprobe: `${v.width}x${v.height}`,
          audio: a?.codec_name || null,
        },
        null,
        2,
      ),
    );
  } finally {
    await page.close();
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const c of CASES) await encode(browser, c);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
