/**
 * トップページ用モックスクショを 390px 幅で撮る。
 *
 * ## 自動モード（ログイン不要・Cursor / CI 向け）
 *   npm run capture:home-mock:auto journal
 *   npm run capture:home-mock:auto all
 *
 * `/home-mock-preview/*` の公開プレビューページを headless で撮影します。
 *
 * ## 手動モード（本番画面をそのまま撮りたいとき）
 *   npm run capture:home-mock journal
 *   → ブラウザでログイン後 Enter
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import readline from "node:readline";

import { chromium, type Browser } from "playwright";
import sharp from "sharp";

const VIEWPORT_WIDTH = 390;
const VIEWPORT_HEIGHT = 844;

const CHROME_ARGS = ["--disable-features=MacAppCodeSignClone"];

const TARGETS = {
  journal: {
    path: "/journal",
    previewPath: "/home-mock-preview/journal",
    outputFile: "mock-journal-entry.png",
    label: "あしあと入力画面",
    assetsKey: "journalEntry" as const,
    captureMode: "fullPage" as const,
  },
  journalPreview: {
    path: "/journal/preview",
    previewPath: "/home-mock-preview/journal-preview",
    outputFile: "mock-journal-preview.png",
    label: "あしあとプレビュー画面",
    assetsKey: "journalPreview" as const,
    captureMode: "fullPage" as const,
  },
  bookshelf: {
    path: "/orders/bookshelf",
    previewPath: "/home-mock-preview/bookshelf",
    outputFile: "mock-bookshelf.png",
    label: "本棚画面",
    assetsKey: "bookshelf" as const,
    captureMode: "fullPage" as const,
  },
  diaryBook: {
    path: "/orders/bookshelf",
    previewPath: "/home-mock-preview/diary-book",
    outputFile: "mock-diary-book.png",
    label: "あしあとブック製本イメージ",
    assetsKey: "diaryBook" as const,
    captureMode: "element" as const,
    elementSelector: "img[alt='製本された Life Journey Diary']",
  },
} as const;

type TargetKey = keyof typeof TARGETS;

function waitForEnter(prompt: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function assertDevServer(baseUrl: string, previewPath?: string): Promise<void> {
  const checkPath = previewPath ?? "/login";
  try {
    const res = await fetch(`${baseUrl}${checkPath}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const html = await res.text();
    if (!html.includes("/_next/")) {
      throw new Error("Next.js の静的ファイル参照が見つかりません");
    }
  } catch (error) {
    console.error("");
    console.error("開発サーバーに接続できませんでした。");
    console.error(`確認URL: ${baseUrl}${checkPath}`);
    console.error("");
    console.error("先に別ターミナルで、プロジェクトフォルダ内から次を実行してください:");
    console.error("  npm run dev");
    console.error("");
    if (error instanceof Error) {
      console.error(`詳細: ${error.message}`);
    }
    process.exit(1);
  }
}

async function launchBrowser(auto: boolean): Promise<Browser> {
  if (auto) {
    console.log("自動モード: Playwright Chromium（headless）");
    return chromium.launch({
      headless: true,
      args: CHROME_ARGS,
    });
  }

  const preferChrome = process.env.MOCK_CAPTURE_BROWSER?.trim() !== "chromium";
  if (preferChrome) {
    try {
      console.log("通常の Google Chrome で開きます（ログインしやすい設定）");
      return await chromium.launch({
        headless: false,
        channel: "chrome",
        args: CHROME_ARGS,
      });
    } catch {
      console.warn("Google Chrome が見つからないため、Playwright 付属ブラウザを使います。");
    }
  }

  console.log("Playwright 付属ブラウザで使います");
  return chromium.launch({ headless: false, args: CHROME_ARGS });
}

async function assertStylesLoaded(page: import("playwright").Page): Promise<void> {
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  if (stylesheetCount === 0) {
    console.warn("");
    console.warn("⚠ スタイルシートが読み込まれていません（文字だけの画面になっている可能性）");
    console.warn("");
    return;
  }

  console.log(`スタイル読み込みOK（stylesheet: ${stylesheetCount}, body背景: ${bodyBg}）`);
}

function updateHomeProductMockAssets(
  assetsKey: (typeof TARGETS)[TargetKey]["assetsKey"],
  width: number,
  height: number,
) {
  const assetsPath = join(process.cwd(), "src/lib/home/homeProductMockAssets.ts");
  const content = readFileSync(assetsPath, "utf8");
  const imageSrc = `HOME_PRODUCT_MOCK_IMAGES.${assetsKey}`;
  const pattern = new RegExp(
    `(imageSrc: ${imageSrc.replace(".", "\\.")},[\\s\\S]*?imageWidth: )\\d+([\\s\\S]*?imageHeight: )\\d+`,
  );

  if (!pattern.test(content)) {
    console.warn(`⚠ ${assetsPath} の imageWidth / imageHeight を自動更新できませんでした`);
    return;
  }

  const next = content.replace(pattern, `$1${width}$2${height}`);
  writeFileSync(assetsPath, next, "utf8");
  console.log(`更新しました: ${assetsPath} (${assetsKey} → ${width} x ${height})`);
}

async function captureTarget(
  page: import("playwright").Page,
  baseUrl: string,
  target: (typeof TARGETS)[TargetKey],
  auto: boolean,
  outputDir: string,
  updateAssets: boolean,
): Promise<{ width: number; height: number; outputPath: string }> {
  const outputPath = join(outputDir, target.outputFile);
  mkdirSync(dirname(outputPath), { recursive: true });

  const url = auto ? `${baseUrl}${target.previewPath}` : `${baseUrl}${target.path}`;

  if (!auto) {
    console.log("");
    console.log("次の操作をブラウザで行ってください:");
    console.log(`  1. ログインする`);
    console.log(`  2. ${target.path} を開く`);
    console.log("");
    await waitForEnter("準備できたら Enter を押してください（今見えている画面を撮影します）… ");
  } else {
    console.log(`撮影URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
    await page.waitForTimeout(800);
  }

  await assertStylesLoaded(page);

  if (target.captureMode === "element" && target.elementSelector) {
    const element = page.locator(target.elementSelector).first();
    await element.waitFor({ state: "visible", timeout: 30_000 });
    await element.screenshot({
      path: outputPath,
      type: "png",
    });
  } else {
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      type: "png",
    });
  }

  const meta = await sharp(outputPath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width < 100) {
    throw new Error(`幅が 100px 未満です (${width}px)。撮影に失敗した可能性があります。`);
  }

  if (target.captureMode === "fullPage" && width < 350) {
    throw new Error(`幅が 350px 未満です (${width}px)。撮影に失敗した可能性があります。`);
  }

  if (updateAssets) {
    updateHomeProductMockAssets(target.assetsKey, width, height);
  } else {
    console.log(`assets 更新スキップ（一時出力先: ${outputDir}）`);
  }
  return { width, height, outputPath };
}

async function main() {
  const args = process.argv.slice(2);
  const auto = args.includes("--auto");
  const targetArg = (args.find((a) => a !== "--auto") ?? "journal") as TargetKey | "all";

  if (targetArg !== "all" && !TARGETS[targetArg]) {
    console.error("使い方:");
    console.error("  npm run capture:home-mock [journal|journalPreview|bookshelf|diaryBook]");
    console.error("  npm run capture:home-mock:auto [journal|journalPreview|bookshelf|diaryBook|all]");
    process.exit(1);
  }

  const baseUrl = process.env.MOCK_CAPTURE_BASE_URL?.trim() || "http://127.0.0.1:3000";
  const outputDir =
    process.env.MOCK_CAPTURE_OUT_DIR?.trim() ||
    join(process.cwd(), "public/images/home-mock");
  const updateAssets = !process.env.MOCK_CAPTURE_OUT_DIR?.trim();
  const keys: TargetKey[] =
    targetArg === "all"
      ? (["journal", "journalPreview", "bookshelf", "diaryBook"] as TargetKey[])
      : [targetArg];

  console.log(`モード: ${auto ? "自動（ログイン不要）" : "手動（ログイン必要）"}`);
  console.log(`ベースURL: ${baseUrl}`);
  console.log(`出力先: ${outputDir}`);
  console.log(`assets 更新: ${updateAssets ? "する" : "しない"}`);
  console.log(`ビューポート: ${VIEWPORT_WIDTH} x ${VIEWPORT_HEIGHT}`);
  console.log("");

  await assertDevServer(baseUrl, auto ? TARGETS[keys[0]!].previewPath : undefined);

  const browser = await launchBrowser(auto);
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  if (!auto) {
    console.log("まずログイン画面を開きます…");
    await page.goto(`${baseUrl}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
    await assertStylesLoaded(page);
  }

  try {
    for (const key of keys) {
      const target = TARGETS[key];
      console.log("");
      console.log(`--- ${target.label} ---`);
      const result = await captureTarget(page, baseUrl, target, auto, outputDir, updateAssets);
      console.log(`保存: ${result.outputPath}`);
      console.log(`サイズ: ${result.width} x ${result.height}px`);
    }
  } finally {
    await browser.close();
  }

  console.log("");
  console.log("完了しました。トップページのモック画像を確認してください。");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
