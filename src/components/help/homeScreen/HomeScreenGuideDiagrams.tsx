import Image from "next/image";

import { APP_DISPLAY_NAME } from "@/lib/branding/appDisplayName";

const APP_ICON_SRC = "/icons/icon-192.png";

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-semibold text-white shadow-sm"
      aria-hidden
    >
      {n}
    </span>
  );
}

function Callout({
  step,
  label,
  className,
}: {
  step: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-[11px] font-medium text-emerald-900 sm:text-xs ${className ?? ""}`}
    >
      <StepBadge n={step} />
      <span>{label}</span>
    </div>
  );
}

function AppIcon({ size = 28 }: { size?: number }) {
  return (
    <Image
      src={APP_ICON_SRC}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-[22%] shadow-sm"
      aria-hidden
    />
  );
}

function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <rect x="5" y="14" width="14" height="7" rx="1.5" />
    </svg>
  );
}

function IosAddHomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" />
      <path d="M10 7v6M7 10h6" strokeLinecap="round" />
    </svg>
  );
}

function IphoneSafariBottomBar() {
  return (
    <div className="px-2 pb-2 pt-1">
      <div className="flex items-center gap-1 rounded-full border border-stone-200/90 bg-[#f4f3ef]/95 px-2 py-1.5 shadow-sm">
        <span className="px-1 text-[11px] text-stone-500" aria-hidden>
          ‹
        </span>
        <span className="flex h-5 w-5 items-center justify-center text-[9px] text-stone-400" aria-hidden>
          ▢
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[8px] text-stone-500">
          <span className="truncate">life-journey-zeta…</span>
          <span className="shrink-0 text-stone-400" aria-hidden>
            ↻
          </span>
        </div>
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200/90 text-stone-600 ring-2 ring-emerald-300/80 ring-offset-1">
          ···
        </span>
      </div>
    </div>
  );
}

function IphoneSafariPhone() {
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="overflow-hidden rounded-[1.65rem] border-[3px] border-stone-300 bg-stone-100 shadow-md">
        <div className="flex items-center justify-between bg-white/95 px-3 py-1 text-[8px] text-stone-500">
          <span>6:19</span>
          <span className="tracking-wide">100%</span>
        </div>
        <div className="min-h-[132px] bg-gradient-to-b from-[#fffdf9] to-emerald-50/30 px-3 py-3">
          <p className="text-[9px] font-medium text-stone-700">{APP_DISPLAY_NAME}</p>
          <div className="mt-2 rounded-xl border border-emerald-100/80 bg-white/80 p-2 shadow-sm">
            <p className="text-[8px] font-semibold leading-snug text-stone-800">数字で紡ぐ、人生の旅</p>
            <div className="mt-2 flex justify-center">
              <AppIcon size={24} />
            </div>
          </div>
        </div>
        <IphoneSafariBottomBar />
      </div>
    </div>
  );
}

function SafariMoreMenu() {
  const items = [
    { label: "共有", icon: "share", highlight: true },
    { label: "ブックマークに追加", icon: "🔖" },
    { label: "ブックマークの追加先…", icon: "📖" },
    { label: "新規タブ", icon: "+" },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2.5 border-b border-stone-100 px-3 py-2.5 text-[10px] last:border-b-0 ${
            "highlight" in item && item.highlight
              ? "bg-emerald-50/90 font-semibold text-emerald-900"
              : "text-stone-700"
          }`}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {item.icon === "share" ? <IosShareIcon className="h-3.5 w-3.5" /> : item.icon}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function IosShareSheet() {
  const listItems = [
    { label: "リーディングリストに追加", icon: "👓" },
    { label: "ブックマークの追加先…", icon: "📖" },
    { label: "ページを検索", icon: "🔍" },
    { label: "ホーム画面に追加", icon: "add-home", highlight: true },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-[#f2f1ed]/95 shadow-md">
      <div className="flex items-start gap-2 border-b border-stone-200/70 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white">
          <AppIcon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-stone-800">Life Journey…</p>
          <p className="truncate text-[8px] text-stone-500">life-journey-zeta…</p>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-300/70 text-[9px] text-stone-600">
          ×
        </span>
      </div>

      <div className="mx-2 mb-2 mt-2 overflow-hidden rounded-xl bg-[#ececea]">
        {listItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 border-b border-white/70 px-3 py-2 text-[9px] last:border-b-0 ${
              "highlight" in item && item.highlight
                ? "bg-emerald-50/90 font-semibold text-emerald-900"
                : "text-stone-700"
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px]">
              {item.icon === "add-home" ? <IosAddHomeIcon className="h-3.5 w-3.5" /> : item.icon}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IphoneChromePhone() {
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="overflow-hidden rounded-[1.65rem] border-[3px] border-stone-300 bg-stone-100 shadow-md">
        <div className="flex items-center justify-between bg-white/95 px-3 py-1 text-[8px] text-stone-500">
          <span>6:32</span>
          <span className="tracking-wide">99%</span>
        </div>
        <div className="border-b border-stone-200 bg-[#f7f6f3] px-2 py-1.5">
          <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1">
            <span className="text-[8px] text-stone-400" aria-hidden>
              ◎
            </span>
            <span className="min-w-0 flex-1 truncate text-[8px] text-stone-600">life-journey-zeta…</span>
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-emerald-300/80 ring-offset-1">
              <IosShareIcon className="h-3 w-3" />
            </span>
          </div>
        </div>
        <div className="min-h-[118px] bg-gradient-to-b from-[#fffdf9] to-emerald-50/30 px-3 py-3">
          <p className="text-[9px] font-medium text-stone-700">{APP_DISPLAY_NAME}</p>
          <div className="mt-2 rounded-xl border border-emerald-100/80 bg-white/80 p-2 shadow-sm">
            <p className="text-[8px] font-semibold leading-snug text-stone-800">数字で紡ぐ、人生の旅</p>
            <div className="mt-2 flex justify-center">
              <AppIcon size={24} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-around border-t border-stone-200 bg-white px-2 py-1.5 text-[10px] text-stone-500">
          <span aria-hidden>‹</span>
          <span aria-hidden>›</span>
          <span aria-hidden>＋</span>
          <span className="rounded border border-stone-300 px-1 text-[8px]" aria-hidden>
            9
          </span>
          <span aria-hidden>···</span>
        </div>
      </div>
    </div>
  );
}

function ChromeShareMenu() {
  const mainItems = [
    "リーディングリストに追加",
    "ブックマークを編集",
    "ページ内を検索",
    "印刷",
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-300/80 bg-[#ececea] shadow-md">
      <div className="flex items-start gap-2 border-b border-stone-300/60 px-3 py-2.5">
        <AppIcon size={22} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-stone-800">Life Journey…</p>
          <p className="truncate text-[8px] text-stone-500">life-journey-zeta…</p>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-400/50 text-[9px] text-stone-700">
          ×
        </span>
      </div>

      <div className="space-y-2 p-2">
        <div className="overflow-hidden rounded-xl bg-[#f5f4f0]">
          {mainItems.map((item) => (
            <div key={item} className="border-b border-stone-200/70 px-3 py-2 text-[9px] text-stone-700 last:border-b-0">
              {item}
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl bg-[#f5f4f0]">
          <div className="flex items-center gap-2 bg-emerald-50/90 px-3 py-2.5 text-[9px] font-semibold text-emerald-900">
            <IosAddHomeIcon className="h-3.5 w-3.5" />
            <span>ホーム画面に追加</span>
          </div>
          <div className="border-t border-stone-200/70 px-3 py-2 text-[9px] text-stone-700">新規クイックメモに追加</div>
        </div>
      </div>
    </div>
  );
}

function IosAddToHomeDialog() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-center text-[10px] font-medium text-stone-700">ホーム画面に追加</p>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-stone-100 bg-stone-50/80 px-2.5 py-2">
        <AppIcon size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-stone-800">{APP_DISPLAY_NAME}</p>
          <p className="mt-0.5 text-[8px] text-stone-500">表示名を確認できます</p>
        </div>
      </div>
      <div className="mt-2.5 flex justify-end gap-2 border-t border-stone-100 pt-2">
        <span className="rounded-md px-2 py-1 text-[9px] text-stone-500">キャンセル</span>
        <span className="rounded-md bg-blue-500 px-2.5 py-1 text-[9px] font-semibold text-white shadow-sm">
          追加
        </span>
      </div>
    </div>
  );
}

function HomeScreenIconPreview() {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-b from-[#ebeae6] to-[#e3e2de] p-4 shadow-inner">
      <div className="mx-auto flex w-fit flex-col items-center gap-1.5">
        <AppIcon size={52} />
        <span className="max-w-[72px] text-center text-[8px] leading-tight text-stone-700">
          Life Journey Diary
        </span>
      </div>
    </div>
  );
}

export function IphoneSafariHomeScreenDiagram() {
  return (
    <div
      className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-[#faf8f5] via-white to-emerald-50/40 p-4 sm:p-5"
      aria-label="iPhone Safariでのホーム画面追加の図解"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
        <div className="space-y-3">
          <IphoneSafariPhone />
          <Callout step={2} label="画面下の「···」をタップ" className="justify-center" />
        </div>

        <div className="space-y-3">
          <SafariMoreMenu />
          <Callout step={3} label="「共有」を選ぶ" />
        </div>

        <div className="space-y-3">
          <IosShareSheet />
          <Callout step={4} label="一覧から「ホーム画面に追加」を選ぶ" />
          <p className="text-center text-[10px] text-stone-500">※一覧が長い場合は下へスクロール</p>
        </div>

        <div className="space-y-3">
          <IosAddToHomeDialog />
          <Callout step={5} label="表示名を確認して「追加」" />
          <HomeScreenIconPreview />
          <p className="text-center text-[10px] text-stone-600">ホーム画面にこのアイコンが追加されます</p>
        </div>
      </div>
    </div>
  );
}

export function IphoneChromeHomeScreenDiagram() {
  return (
    <div
      className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-[#faf8f5] via-white to-emerald-50/40 p-4 sm:p-5"
      aria-label="iPhone Chromeでのホーム画面追加の図解"
    >
      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="space-y-3">
          <IphoneChromePhone />
          <Callout step={2} label="アドレスバー右の共有（□↑）をタップ" className="justify-center" />
        </div>

        <div className="space-y-3">
          <ChromeShareMenu />
          <Callout step={3} label="「ホーム画面に追加」を選ぶ" />
          <p className="text-center text-[10px] text-stone-500">※下の方にある場合はスクロール</p>
        </div>

        <div className="space-y-3">
          <IosAddToHomeDialog />
          <Callout step={4} label="表示名を確認して「追加」" />
          <HomeScreenIconPreview />
          <Callout step={5} label="ホーム画面にこのアイコンが追加されます" />
        </div>
      </div>
    </div>
  );
}

export function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 text-sm leading-relaxed text-stone-700">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50/90 text-xs font-semibold text-emerald-800/80"
            aria-hidden
          >
            {index + 1}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}
