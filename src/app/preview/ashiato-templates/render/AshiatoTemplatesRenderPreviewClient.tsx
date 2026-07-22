"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DiaryBookAshiatoEntryPreviewPage } from "@/components/journal/DiaryBookAshiatoEntryPreviewPage";
import { DiaryBookPageViewport } from "@/components/journal/DiaryBookPageViewport";
import {
  ASHIATO_COMPANION_TEMPLATE_SLUGS,
  ashiatoPageTemplateOptions,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import { getAshiatoPageTemplateLayout } from "@/lib/journal/ashiatoPageTemplateLayout";
import { getAshiatoHorizontalBodyCapacity } from "@/lib/journal/ashiatoEntryRender";

const SAMPLE_BODY_SHORT =
  "今日は森のなかをゆっくり歩きました。木漏れ日がやわらかくて、心がほどけていくようです。短い言葉でも、あしあととして残しておきたい一日でした。";

/** 装飾との重なり確認用：枠を埋める長文 */
const SAMPLE_BODY_LONG = [
  "今日は森のなかをゆっくり歩きました。木漏れ日がやわらかくて、心がほどけていくようです。",
  "短い言葉でも、あしあととして残しておきたい一日でした。道ばたの小さな花や、足元のどんぐりにも目がとまります。",
  "カフェで温かいお茶をいただきながら、ノートを開いて今日の気持ちを書いてみました。特別な出来事がなくても、日々を丁寧に残すこと自体が、自分らしい歩みの証なのかもしれません。",
  "帰り際、風が葉を揺らす音を聞きながら、また明日も小さなあしあとを残していこうと思いました。季節の移ろいを感じられる日々に、そっと感謝を添えて。",
  "夜になってからも、森の匂いがどこか懐かしく思い出されます。ページのすみに残る余白も、今の自分にはちょうどよい間隔です。",
].join("");

const SAMPLE_COMMENT =
  "穏やかな一日の記録、とても素敵ですね。特別な出来事がなくても、日々を丁寧に残すこと自体が、あなたらしい歩みの証です。";

const SAMPLE_PHOTO = "/images/home-mock/demo-journal-photo.png";

const COMPANION_LABELS: Record<(typeof ASHIATO_COMPANION_TEMPLATE_SLUGS)[number], string> = {
  drfukuro: "フクロウ",
  harinezumi: "ハリネズミ",
  namakemono: "ナマケモノ",
  risu: "リス",
  kerosion: "ケロシオン",
};

const COMPANION_TYPE_BY_SLUG = {
  drfukuro: "owl",
  harinezumi: "hedgehog",
  namakemono: "sloth",
  risu: "squirrel",
  kerosion: "frog",
} as const;

type SampleBodyLength = "short" | "long";

export function AshiatoTemplatesRenderPreviewClient() {
  const [templateId, setTemplateId] = useState<AshiatoPageTemplateId>("mori_enikki");
  const [companionSlug, setCompanionSlug] =
    useState<(typeof ASHIATO_COMPANION_TEMPLATE_SLUGS)[number]>("drfukuro");
  const [bodyLength, setBodyLength] = useState<SampleBodyLength>("short");

  const meta = useMemo(
    () => ashiatoPageTemplateOptions.find((o) => o.id === templateId)!,
    [templateId],
  );
  const layout = useMemo(() => getAshiatoPageTemplateLayout(templateId), [templateId]);
  const sampleBody = bodyLength === "long" ? SAMPLE_BODY_LONG : SAMPLE_BODY_SHORT;
  const bodyCapacity = useMemo(() => {
    if (layout.bodyWritingMode !== "horizontal" || !layout.slots.body) return null;
    return getAshiatoHorizontalBodyCapacity("standard", layout.slots.body, layout.bodyTextLayout);
  }, [layout]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
        サンプル写真・本文・読み解きを重ねた本番と同じ描画です。森テンプレは背景＋写真枠オーバーレイを重ねて表示します。
      </div>

      <div className="flex flex-wrap gap-2">
        {ashiatoPageTemplateOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTemplateId(opt.id)}
            className={[
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              templateId === opt.id
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {meta.files.kind === "companion" ? (
        <div className="flex flex-wrap gap-2">
          {ASHIATO_COMPANION_TEMPLATE_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCompanionSlug(slug)}
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                companionSlug === slug
                  ? "bg-stone-800 text-white"
                  : "border border-stone-300 bg-white text-stone-700",
              ].join(" ")}
            >
              {COMPANION_LABELS[slug]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-500">
          このテンプレはキャラ共通（レイヤー型）です。本文は
          {layout.bodyWritingMode === "vertical" ? "縦書き" : "横書き"}です。
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-500">本文サンプル:</span>
        {(
          [
            ["short", "短め"],
            ["long", "長め（装飾チェック）"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setBodyLength(id)}
            className={[
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              bodyLength === id
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm text-stone-700">
        <span className="font-semibold text-stone-900">{meta.label}</span>
        <span className="ml-2 text-xs text-stone-500">{meta.category}</span>
        {bodyCapacity ? (
          <span className="ml-2 text-xs text-stone-500">
            本文上限 {bodyCapacity.maxBindingChars}字（{bodyCapacity.maxLines}行・装飾インデント込み）
          </span>
        ) : null}
      </p>

      <DiaryBookPageViewport>
        <DiaryBookAshiatoEntryPreviewPage
          pageTemplate={templateId}
          companionType={COMPANION_TYPE_BY_SLUG[companionSlug]}
          mood="calm"
          activity="family_friends"
          content={sampleBody}
          comment={SAMPLE_COMMENT}
          photoSrc={SAMPLE_PHOTO}
          previewDate={new Date("2026-06-05T10:00:00.000Z")}
          diaryNumbers={{ today: 5, month: 3, year: 8 }}
          contentFontMode="standard"
          kanteiOrderExists
        />
      </DiaryBookPageViewport>

      <p className="text-center text-xs text-stone-500">
        <Link href="/preview/ashiato-templates" className="underline-offset-2 hover:underline">
          表紙・かたち選択へ
        </Link>
        {" · "}
        <Link href="/preview/ashiato-templates/layout" className="underline-offset-2 hover:underline">
          レイアウト定規へ
        </Link>
        {" · "}
        <Link href="/preview" className="underline-offset-2 hover:underline">
          プレビュー一覧
        </Link>
      </p>
    </div>
  );
}
