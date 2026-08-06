const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES = path.join(ROOT, "tmp/device-movie-samples");
const OUT = path.join(ROOT, "tmp/device-movie-basic-e2e");
const BASE = "http://127.0.0.1:3000";

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

async function mockDonguri(page) {
  await page.route("**/api/loghouse/donguri/mori-log-device-movie/status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ firstFreeAvailable: true, balance: 10, paidCost: 2 }),
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

async function chairFlow(page, c) {
  await mockDonguri(page);
  await page.goto(
    `${BASE}/preview/hitoyasumi?view=movie_compose&decoration=${c.decoration}`,
    { waitUntil: "networkidle", timeout: 180_000 },
  );
  await page.waitForSelector("text=森の映写便りをつくる", { timeout: 60_000 });
  const newBtn = page.getByRole("button", { name: "新しい動画から作る" });
  if (await newBtn.count()) await newBtn.click();

  await page.setInputFiles('input[type="file"]', path.join(SAMPLES, c.file));
  await page.getByRole("button", { name: "つぎへ" }).first().waitFor({ timeout: 90_000 });
  await page.getByRole("button", { name: "つぎへ" }).first().click();
  await page.getByRole("button", { name: "つぎへ" }).first().click();
  if (c.audioMode === "mute") await page.getByRole("button", { name: "音なし" }).click();
  else await page.getByRole("button", { name: "動画の音を使う" }).click();
  await page.getByRole("button", { name: "つぎへ" }).first().click();
  await page.locator("input[type='text']").fill(c.title);
  await page.getByRole("button", { name: "プレビューをつくる" }).click();
  await page.waitForFunction(
    () => window.__deviceMovieComposer?.step === "preview" && window.__deviceMovieComposer?.result,
    null,
    { timeout: 420_000 },
  );
  const preview = await page.evaluate(() => ({
    decoration: window.__deviceMovieComposer?.result?.templateDecorationVariant,
    w: window.__deviceMovieComposer?.result?.width,
    h: window.__deviceMovieComposer?.result?.height,
  }));
  await page.screenshot({ path: path.join(OUT, `${c.id}-preview-ui.png`), fullPage: true });

  const draft = await page.evaluate(async () => {
    const meta = await window.__deviceMovieComposerSaveDraft();
    return meta;
  });

  await page.goto(
    `${BASE}/preview/hitoyasumi?view=movie_compose&draftId=${encodeURIComponent(draft.id)}&decoration=${c.decoration}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForFunction(
    () => window.__deviceMovieComposer?.step === "preview" && window.__deviceMovieComposer?.result,
    null,
    { timeout: 120_000 },
  );
  const resume = await page.evaluate(() => ({
    decoration: window.__deviceMovieComposer?.result?.templateDecorationVariant,
    draftId: window.__deviceMovieComposer?.draftId,
  }));
  await page.screenshot({ path: path.join(OUT, `${c.id}-draft-resume.png`), fullPage: true });

  // remake preview once to check decoration stable
  // (already on preview from draft - stay)
  await page.getByRole("button", { name: "この一場面を残す" }).click();
  await page.waitForFunction(
    () =>
      window.__deviceMovieComposer?.step === "done" ||
      document.body.innerText.includes("森ログムービーができました"),
    null,
    { timeout: 180_000 },
  );
  const done = await page.evaluate(() => ({
    step: window.__deviceMovieComposer?.step,
    mediaId: window.__deviceMovieComposer?.confirmedMediaId,
    decoration: window.__deviceMovieComposer?.decoration,
  }));
  await page.screenshot({ path: path.join(OUT, `${c.id}-done.png`), fullPage: true });

  await page.getByRole("button", { name: "椅子の一覧を見る" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${c.id}-browse.png`), fullPage: true });

  const withLabel = page.locator("button[aria-label]");
  const n = await withLabel.count();
  let opened = false;
  for (let i = 0; i < n; i++) {
    const label = (await withLabel.nth(i).getAttribute("aria-label")) || "";
    if (/映写|ムービー/.test(label)) {
      await withLabel.nth(i).click();
      opened = true;
      break;
    }
  }
  if (!opened) {
    const thumb = page.locator("button").filter({ has: page.locator("img") }).first();
    if (await thumb.count()) {
      await thumb.click();
      opened = true;
    }
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${c.id}-detail.png`), fullPage: true });
  const detailHasVideo = (await page.locator("video").count()) > 0;

  return { preview, draft, resume, done, opened, detailHasVideo };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = [];
  try {
    for (const c of CASES) {
      console.log(">>", c.id);
      const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
      try {
        const r = await chairFlow(page, c);
        console.log(JSON.stringify({ id: c.id, ...r }, null, 2));
        report.push({ id: c.id, ok: true, ...r });
      } catch (e) {
        console.error(c.id, e);
        await page.screenshot({
          path: path.join(OUT, `${c.id}-chair-error.png`),
          fullPage: true,
        });
        report.push({ id: c.id, ok: false, error: String(e && e.message ? e.message : e) });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  require("fs").writeFileSync(
    path.join(OUT, "chair-report.json"),
    JSON.stringify(report, null, 2),
  );
  if (report.some((r) => !r.ok)) process.exitCode = 2;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
