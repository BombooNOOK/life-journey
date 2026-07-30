"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { JournalSocialPostImageDownloadButton } from "@/components/journal/JournalSocialPostImageDownloadButton";
import {
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  JournalSocialPostImagePhotoAdjustEditor,
} from "@/components/journal/JournalSocialPostImagePhotoAdjustEditor";
import {
  MoriLog3komaPhotoFields,
  type Mori3komaExtraPhoto,
} from "@/components/journal/MoriLog3komaPhotoFields";
import { MoriLogTemplatePicker } from "@/components/journal/MoriLogTemplatePicker";
import {
  assembleMoriLogCardTextSlots,
  emptyMoriLogCardFieldValues,
  moriLogCardFieldsForTemplate,
  resolveMoriLogCardHitokotoPrompt,
  type MoriLogCardFieldDef,
  type MoriLogCardFieldKind,
  type MoriLogCardFieldValues,
  type MoriLogCardHitokotoPromptId,
} from "@/lib/journal/moriLog/moriLogCardFields";
import {
  DEFAULT_MORI_3KOMA_PANEL_ASSIGNMENT,
  serializeMori3komaPanelAssignment,
  type Mori3komaPanelAssignment,
} from "@/lib/journal/moriLog/moriLog3komaPhotos";
import { formatSocialPostDateScrapbook } from "@/lib/journal/social-post-image/dateFormat";
import {
  appendJournalSocialPostPhotoAdjustToSearchParams,
  journalSocialPostPhotoAdjustEquals,
  type JournalSocialPostPhotoAdjust,
} from "@/lib/journal/social-post-image/photoAdjust";
import {
  clearJournalSocialPostPhotoAdjustFromStorage,
  getDefaultOrStoredPhotoAdjust,
  writeJournalSocialPostPhotoAdjustToStorage,
} from "@/lib/journal/social-post-image/photoAdjustStorage";
import {
  DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE,
  extractSocialPostBodyText,
  SOCIAL_POST_SUBTITLE_MAX_CHARS,
  socialPostTitleMaxChars,
} from "@/lib/journal/social-post-image/textExtract";
import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  isMoriAshiatoTemplateId,
  resolveJournalSocialPostDesignSize,
  resolveJournalSocialPostTextMode,
  type JournalSocialPostTemplateId,
} from "@/lib/journal/social-post-image/templates";
import type { MoriAshiatoTemplateId } from "@/lib/journal/social-post-image/moriAshiatoTemplates";

type SurfaceLabels = {
  previewHeading?: string;
  titleLabel?: string;
  downloadLabel?: string;
  previewAlt?: string;
};

type Props = {
  entryId: string;
  content: string;
  /** 日付表示・カード日付用（あしあと入力日） */
  createdAt?: string;
  hasPhoto?: boolean;
  photoSrc?: string | null;
  surfaceLabels?: SurfaceLabels;
  onCardExported?: (params: {
    templateId: JournalSocialPostTemplateId;
    title: string;
  }) => void | Promise<void>;
};

function appendTextParams(
  params: URLSearchParams,
  title: string,
  subtitle: string,
  templateId: JournalSocialPostTemplateId,
  moriSlots?: { body: string; comment: string; promptLabel: string; summary: string } | null,
): void {
  params.set("title", title);
  if (templateId === "sns03") {
    params.set("subtitle", subtitle);
  }
  if (moriSlots && isMoriAshiatoTemplateId(templateId)) {
    params.set("body", moriSlots.body);
    params.set("comment", moriSlots.comment);
    params.set("promptLabel", moriSlots.promptLabel);
    params.set("summary", moriSlots.summary);
  }
}

function buildPreviewUrl(
  entryId: string,
  title: string,
  subtitle: string,
  templateId: JournalSocialPostTemplateId,
  photoAdjust: JournalSocialPostPhotoAdjust,
  cacheKey: number,
  moriSlots?: { body: string; comment: string; promptLabel: string; summary: string } | null,
): string {
  const params = new URLSearchParams({ template: templateId, t: String(cacheKey) });
  appendTextParams(params, title, subtitle, templateId, moriSlots);
  appendJournalSocialPostPhotoAdjustToSearchParams(params, photoAdjust);
  return `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image?${params.toString()}`;
}

function buildDownloadUrl(
  entryId: string,
  title: string,
  subtitle: string,
  templateId: JournalSocialPostTemplateId,
  photoAdjust: JournalSocialPostPhotoAdjust,
  moriSlots?: { body: string; comment: string; promptLabel: string; summary: string } | null,
): string {
  const params = new URLSearchParams({ template: templateId, download: "1" });
  appendTextParams(params, title, subtitle, templateId, moriSlots);
  appendJournalSocialPostPhotoAdjustToSearchParams(params, photoAdjust);
  return `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image?${params.toString()}`;
}

function appendPhotoAdjustToJsonBody(
  body: Record<string, unknown>,
  photoAdjust: JournalSocialPostPhotoAdjust,
): void {
  body.focusX = photoAdjust.focusX;
  body.focusY = photoAdjust.focusY;
  body.scale = photoAdjust.scale;
}

function buildThreeKomaJsonBody(input: {
  title: string;
  subtitle: string;
  templateId: JournalSocialPostTemplateId;
  photoAdjust: JournalSocialPostPhotoAdjust;
  moriSlots?: { body: string; comment: string; promptLabel: string; summary: string } | null;
  panelAssignment: Mori3komaPanelAssignment;
  extras: [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null];
  download?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    template: input.templateId,
    title: input.title,
    panelSources: serializeMori3komaPanelAssignment(input.panelAssignment),
  };
  if (input.download) body.download = "1";
  if (input.moriSlots && isMoriAshiatoTemplateId(input.templateId)) {
    body.body = input.moriSlots.body;
    body.comment = input.moriSlots.comment;
    body.promptLabel = input.moriSlots.promptLabel;
    body.summary = input.moriSlots.summary;
  }
  appendPhotoAdjustToJsonBody(body, input.photoAdjust);
  if (input.extras[0]?.jpegBase64) body.extra0Base64 = input.extras[0].jpegBase64;
  if (input.extras[1]?.jpegBase64) body.extra1Base64 = input.extras[1].jpegBase64;
  return body;
}

function buildThreeKomaGetUrl(input: {
  entryId: string;
  title: string;
  subtitle: string;
  templateId: JournalSocialPostTemplateId;
  photoAdjust: JournalSocialPostPhotoAdjust;
  moriSlots?: { body: string; comment: string; promptLabel: string; summary: string } | null;
  panelAssignment: Mori3komaPanelAssignment;
  download?: boolean;
  cacheKey?: number;
}): string {
  const params = new URLSearchParams({ template: input.templateId });
  if (input.download) params.set("download", "1");
  if (input.cacheKey != null) params.set("t", String(input.cacheKey));
  appendTextParams(params, input.title, input.subtitle, input.templateId, input.moriSlots);
  appendJournalSocialPostPhotoAdjustToSearchParams(params, input.photoAdjust);
  params.set("panelSources", serializeMori3komaPanelAssignment(input.panelAssignment));
  return `/api/journal/entries/${encodeURIComponent(input.entryId)}/social-post-image?${params.toString()}`;
}

function threeKomaAssignmentNeedsExtras(
  assignment: Mori3komaPanelAssignment,
  extras: [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null],
): boolean {
  return assignment.some((source, index) => {
    if (source === "extra0") return extras[0] != null;
    if (source === "extra1") return extras[1] != null;
    void index;
    return false;
  });
}

export type JournalSocialPostImagePanelHandle = {
  /** いまの設定でカード PNG を取得（ムービー用） */
  getCardPngBlob: () => Promise<Blob>;
  getCardMeta: () => { templateId: JournalSocialPostTemplateId; title: string };
};

function parseCardImageErrorMessage(status: number, contentType: string, text: string): string {
  if (status === 413) {
    return "写真のデータが大きすぎます。別の写真で再度お試しください。";
  }
  if (contentType.includes("application/json") || text.trim().startsWith("{")) {
    try {
      const json = JSON.parse(text) as { error?: string };
      return json.error || "カード画像を取得できませんでした。";
    } catch {
      return "カード画像を取得できませんでした。";
    }
  }
  return "カード画像を取得できませんでした。";
}

export const JournalSocialPostImagePanel = forwardRef<JournalSocialPostImagePanelHandle, Props>(
  function JournalSocialPostImagePanel(
    {
      entryId,
      content,
      createdAt,
      hasPhoto = false,
      photoSrc,
      surfaceLabels,
      onCardExported,
    },
    ref,
  ) {
  const previewHeading = surfaceLabels?.previewHeading ?? "投稿画像プレビュー";
  const titleLabel = surfaceLabels?.titleLabel ?? "投稿画像用タイトル";
  const downloadLabel = surfaceLabels?.downloadLabel ?? "画像を保存";
  const previewAlt = surfaceLabels?.previewAlt ?? "SNS投稿画像プレビュー";
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState(DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE);
  const [moriFields, setMoriFields] = useState<MoriLogCardFieldValues>(emptyMoriLogCardFieldValues);
  const [templateId, setTemplateId] = useState<JournalSocialPostTemplateId>("chiisana_ashiato");
  const [photoAdjustDraft, setPhotoAdjustDraft] = useState<JournalSocialPostPhotoAdjust>(
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const [appliedPhotoAdjust, setAppliedPhotoAdjust] = useState<JournalSocialPostPhotoAdjust>(
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [debouncedSubtitle, setDebouncedSubtitle] = useState(DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE);
  const [debouncedMoriSlots, setDebouncedMoriSlots] = useState<{
    title: string;
    body: string;
    comment: string;
    summary: string;
    promptLabel: string;
  } | null>(null);
  const [debouncedTemplateId, setDebouncedTemplateId] = useState<JournalSocialPostTemplateId>("chiisana_ashiato");
  const [debouncedThreeKomaAssignment, setDebouncedThreeKomaAssignment] =
    useState<Mori3komaPanelAssignment>(DEFAULT_MORI_3KOMA_PANEL_ASSIGNMENT);
  const [photoAdjustEpoch, setPhotoAdjustEpoch] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [threeKomaExtras, setThreeKomaExtras] = useState<
    [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null]
  >([null, null]);
  const [threeKomaAssignment, setThreeKomaAssignment] = useState<Mori3komaPanelAssignment>(
    DEFAULT_MORI_3KOMA_PANEL_ASSIGNMENT,
  );
  const [previewDisplayUrl, setPreviewDisplayUrl] = useState("");
  const previewBlobUrlRef = useRef<string | null>(null);
  const previewRequestIdRef = useRef(0);

  const bodyPreview = useMemo(
    () => extractSocialPostBodyText(content, templateId),
    [content, templateId],
  );
  const photoDisplaySrc = photoSrc?.trim() ?? "";
  const showPhotoAdjust = hasPhoto && photoDisplaySrc.length > 0;
  const templatePhoto = JOURNAL_SOCIAL_POST_TEMPLATES[templateId].photo;
  const hasPendingPhotoApply = !journalSocialPostPhotoAdjustEquals(photoAdjustDraft, appliedPhotoAdjust);
  const templateLayout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  const designSize = resolveJournalSocialPostDesignSize(templateLayout);
  const textMode = resolveJournalSocialPostTextMode(templateLayout);
  const isSns03 = textMode === "sns03";
  const isMoriCard = isMoriAshiatoTemplateId(templateId);
  const isThreeKoma = templateId === "kyou_no_3koma_ashiato";
  const moriFieldDefs = moriLogCardFieldsForTemplate(templateId);
  const titleMaxChars = socialPostTitleMaxChars(templateId);

  const entryDateLabel = useMemo(() => {
    if (!createdAt) return null;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return formatSocialPostDateScrapbook(date);
  }, [createdAt]);

  const assembledMoriSlots = useMemo(() => {
    if (!isMoriCard) return null;
    return assembleMoriLogCardTextSlots(templateId as MoriAshiatoTemplateId, moriFields);
  }, [isMoriCard, moriFields, templateId]);

  const previewTitle = isMoriCard ? (debouncedMoriSlots?.title ?? "") : debouncedTitle;
  const previewMoriSlots = useMemo(() => {
    if (!isMoriCard || !debouncedMoriSlots) return null;
    return {
      body: debouncedMoriSlots.body,
      comment: debouncedMoriSlots.comment,
      promptLabel: debouncedMoriSlots.promptLabel,
      summary: debouncedMoriSlots.summary,
    };
  }, [isMoriCard, debouncedMoriSlots]);

  const usesThreeKomaTemplate = debouncedTemplateId === "kyou_no_3koma_ashiato";
  const threeKomaNeedsUpload = threeKomaAssignmentNeedsExtras(
    debouncedThreeKomaAssignment,
    threeKomaExtras,
  );

  const postEndpoint = `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image`;

  const buildThreeKomaRequestBody = useCallback(
    (download = false) =>
      buildThreeKomaJsonBody({
        title: previewTitle,
        subtitle: debouncedSubtitle,
        templateId: debouncedTemplateId,
        photoAdjust: appliedPhotoAdjust,
        moriSlots: previewMoriSlots,
        panelAssignment: debouncedThreeKomaAssignment,
        extras: threeKomaExtras,
        download,
      }),
    [
      appliedPhotoAdjust,
      debouncedSubtitle,
      debouncedTemplateId,
      debouncedThreeKomaAssignment,
      previewMoriSlots,
      previewTitle,
      threeKomaExtras,
    ],
  );

  const downloadUrl = usesThreeKomaTemplate
    ? threeKomaNeedsUpload
      ? postEndpoint
      : buildThreeKomaGetUrl({
          entryId,
          title: previewTitle,
          subtitle: debouncedSubtitle,
          templateId: debouncedTemplateId,
          photoAdjust: appliedPhotoAdjust,
          moriSlots: previewMoriSlots,
          panelAssignment: debouncedThreeKomaAssignment,
          download: true,
        })
    : buildDownloadUrl(
        entryId,
        previewTitle,
        debouncedSubtitle,
        debouncedTemplateId,
        appliedPhotoAdjust,
        previewMoriSlots,
      );

  /** 中身が変わったときだけ再生成する指紋（参照の揺れでは回さない） */
  const previewFingerprint = useMemo(() => {
    const extrasFingerprint = threeKomaExtras
      .map((extra) => (extra ? `${extra.jpegBase64.length}:${extra.jpegBase64.slice(0, 24)}` : "-"))
      .join("|");
    return JSON.stringify({
      entryId,
      templateId: debouncedTemplateId,
      title: previewTitle,
      subtitle: debouncedSubtitle,
      mori: previewMoriSlots,
      photoAdjust: appliedPhotoAdjust,
      photoAdjustEpoch,
      panelAssignment: debouncedThreeKomaAssignment,
      extrasFingerprint,
      threeKomaNeedsUpload,
    });
  }, [
    appliedPhotoAdjust,
    debouncedSubtitle,
    debouncedTemplateId,
    debouncedThreeKomaAssignment,
    entryId,
    photoAdjustEpoch,
    previewMoriSlots,
    previewTitle,
    threeKomaExtras,
    threeKomaNeedsUpload,
  ]);

  useEffect(() => {
    if (!showPhotoAdjust) {
      setPhotoAdjustDraft(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
      setAppliedPhotoAdjust(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
      return;
    }
    const stored = getDefaultOrStoredPhotoAdjust(entryId, templateId);
    setPhotoAdjustDraft(stored);
    setAppliedPhotoAdjust(stored);
    setPhotoAdjustEpoch((value) => value + 1);
  }, [entryId, templateId, showPhotoAdjust]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTitle(title);
      setDebouncedSubtitle(subtitle);
      setDebouncedMoriSlots(assembledMoriSlots);
      setDebouncedTemplateId(templateId);
      setDebouncedThreeKomaAssignment(threeKomaAssignment);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [assembledMoriSlots, subtitle, templateId, threeKomaAssignment, title]);

  useEffect(() => {
    let cancelled = false;
    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;
    setLoadingPreview(true);
    setPreviewError(null);

    const revokeBlob = () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
    };

    const settleIfCurrent = (url: string) => {
      if (cancelled || previewRequestIdRef.current !== requestId) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        return;
      }
      revokeBlob();
      if (url.startsWith("blob:")) {
        previewBlobUrlRef.current = url;
      }
      setPreviewDisplayUrl(url);
      // loading は img.onLoad で落とす（表示完了までオーバーレイを維持）
    };

    void (async () => {
      try {
        if (usesThreeKomaTemplate && threeKomaNeedsUpload) {
          const res = await fetch(postEndpoint, {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildThreeKomaRequestBody(false)),
          });
          if (!res.ok) {
            const text = await res.text();
            const contentType = res.headers.get("Content-Type") ?? "";
            if (res.status === 413) {
              throw new Error("写真のデータが大きすぎます。別の写真で再度お試しください。");
            }
            if (contentType.includes("application/json") || text.trim().startsWith("{")) {
              try {
                const json = JSON.parse(text) as { error?: string };
                throw new Error(json.error || "プレビューの生成に失敗しました。");
              } catch (parseError) {
                if (
                  parseError instanceof Error &&
                  parseError.message !== "プレビューの生成に失敗しました。"
                ) {
                  throw parseError;
                }
              }
            }
            throw new Error("プレビューの生成に失敗しました。しばらくしてからお試しください。");
          }
          const blob = await res.blob();
          settleIfCurrent(URL.createObjectURL(blob));
          return;
        }

        const nextUrl = usesThreeKomaTemplate
          ? buildThreeKomaGetUrl({
              entryId,
              title: previewTitle,
              subtitle: debouncedSubtitle,
              templateId: debouncedTemplateId,
              photoAdjust: appliedPhotoAdjust,
              moriSlots: previewMoriSlots,
              panelAssignment: debouncedThreeKomaAssignment,
              cacheKey: requestId,
            })
          : buildPreviewUrl(
              entryId,
              previewTitle,
              debouncedSubtitle,
              debouncedTemplateId,
              appliedPhotoAdjust,
              requestId,
              previewMoriSlots,
            );
        settleIfCurrent(nextUrl);
      } catch (error) {
        if (cancelled || previewRequestIdRef.current !== requestId) return;
        setLoadingPreview(false);
        setPreviewError(
          error instanceof Error && error.message
            ? error.message
            : "プレビューの生成に失敗しました。しばらくしてからお試しください。",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // previewFingerprint が変わったときだけ再生成。関数／オブジェクト参照では回さない。
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint に入力を集約
  }, [previewFingerprint]);

  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
    };
  }, []);

  const handlePhotoAdjustReset = () => {
    setPhotoAdjustDraft(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
    clearJournalSocialPostPhotoAdjustFromStorage(entryId, templateId);
  };

  const handleApplyPhotoAdjust = useCallback(() => {
    setAppliedPhotoAdjust(photoAdjustDraft);
    writeJournalSocialPostPhotoAdjustToStorage(entryId, templateId, photoAdjustDraft);
    setPhotoAdjustEpoch((value) => value + 1);
  }, [entryId, photoAdjustDraft, templateId]);

  useImperativeHandle(
    ref,
    () => ({
      getCardMeta: () => ({
        templateId: debouncedTemplateId,
        title: previewTitle,
      }),
      getCardPngBlob: async () => {
        // プレビューがもう出ているなら、それを流用（再生成待ちで 0% 固まりを避ける）
        if (previewDisplayUrl && !loadingPreview) {
          try {
            const cached = await fetch(previewDisplayUrl, { credentials: "same-origin" });
            if (cached.ok) {
              const blob = await cached.blob();
              if (blob.size > 0) return blob;
            }
          } catch {
            // 下の本取得へ
          }
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 65_000);
        try {
          let res: Response;
          if (usesThreeKomaTemplate && threeKomaNeedsUpload) {
            res = await fetch(postEndpoint, {
              method: "POST",
              credentials: "same-origin",
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(buildThreeKomaRequestBody(true)),
              signal: controller.signal,
            });
          } else {
            const url = new URL(downloadUrl, window.location.origin);
            url.searchParams.set("_cb", String(Date.now()));
            res = await fetch(url.toString(), {
              credentials: "same-origin",
              cache: "no-store",
              signal: controller.signal,
            });
          }
          if (!res.ok) {
            const text = await res.text();
            throw new Error(
              parseCardImageErrorMessage(res.status, res.headers.get("Content-Type") ?? "", text),
            );
          }
          const blob = await res.blob();
          if (!blob.size) throw new Error("カード画像を取得できませんでした。");
          return blob;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error("カード画像の取得がタイムアウトしました。");
          }
          throw error;
        } finally {
          window.clearTimeout(timeoutId);
        }
      },
    }),
    [
      buildThreeKomaRequestBody,
      debouncedTemplateId,
      downloadUrl,
      loadingPreview,
      postEndpoint,
      previewDisplayUrl,
      previewTitle,
      threeKomaNeedsUpload,
      usesThreeKomaTemplate,
    ],
  );

  const setMoriField = (kind: MoriLogCardFieldKind, value: string) => {
    setMoriFields((prev) => ({ ...prev, [kind]: value }));
  };

  const setHitokotoPrompt = (promptId: MoriLogCardHitokotoPromptId) => {
    setMoriFields((prev) => ({ ...prev, hitokotoPromptId: promptId }));
  };

  const renderMoriField = (field: MoriLogCardFieldDef) => {
    const maxLines = field.maxLines ?? 1;
    const multiline = maxLines > 1;
    const value = moriFields[field.kind] ?? "";
    const prompts = field.hitokotoPrompts;

    const control = multiline ? (
      <textarea
        value={value}
        onChange={(event) => setMoriField(field.kind, event.target.value)}
        placeholder={
          prompts?.length
            ? (resolveMoriLogCardHitokotoPrompt(field, moriFields.hitokotoPromptId)?.placeholder ??
              field.placeholder)
            : field.placeholder
        }
        maxLength={field.maxChars}
        rows={Math.min(maxLines + 1, 4)}
        className="w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-base leading-relaxed text-stone-900"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(event) => setMoriField(field.kind, event.target.value)}
        placeholder={
          prompts?.length
            ? (resolveMoriLogCardHitokotoPrompt(field, moriFields.hitokotoPromptId)?.placeholder ??
              field.placeholder)
            : field.placeholder
        }
        maxLength={field.maxChars}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
      />
    );

    const hint = (
      <p className="text-xs leading-relaxed text-stone-500">
        {field.hint ? `${field.hint} · ` : null}
        最大 {field.maxChars} 文字
        {multiline ? `・${maxLines}行まで（改行できます）` : null}
        。あしあと本体には保存されません。
      </p>
    );

    if (prompts?.length) {
      const selected = resolveMoriLogCardHitokotoPrompt(field, moriFields.hitokotoPromptId);
      const selectedId = selected?.id ?? prompts[0]!.id;
      return (
        <div key={field.kind} className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-stone-800">どんな言葉を残しますか？</legend>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => setHitokotoPrompt(prompt.id)}
                  className={[
                    "min-h-[44px] rounded-md border px-3 py-2 text-sm",
                    selectedId === prompt.id
                      ? "border-emerald-700 bg-emerald-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-800">{selected?.label ?? field.label}</span>
            {control}
            {hint}
          </label>
        </div>
      );
    }

    return (
      <label key={field.kind} className="block space-y-2">
        <span className="text-sm font-medium text-stone-800">{field.label}</span>
        {control}
        {hint}
      </label>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <MoriLogTemplatePicker value={templateId} onChange={setTemplateId} />

        {isMoriCard && moriFieldDefs ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
              <p className="text-xs font-medium text-stone-600">日付（あしあとの入力日）</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-800">
                {entryDateLabel ?? "（日付を読み込み中）"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                カードにはこの日付がそのまま載ります。あしあと本文とは別に、下の欄だけを入力してください。
              </p>
            </div>

            {moriFieldDefs.map((field) => renderMoriField(field))}

            {isThreeKoma ? (
              <MoriLog3komaPhotoFields
                hasMainPhoto={hasPhoto}
                mainPhotoSrc={photoDisplaySrc || null}
                extras={threeKomaExtras}
                assignment={threeKomaAssignment}
                onExtrasChange={setThreeKomaExtras}
                onAssignmentChange={setThreeKomaAssignment}
              />
            ) : null}
          </div>
        ) : isSns03 ? (
          <>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-stone-800">
                {surfaceLabels?.titleLabel ?? "タイトル"}
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="画像上部の大見出し"
                maxLength={titleMaxChars}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              画像上部の大見出しです。空欄のままだと載せません。最大 {titleMaxChars} 文字（1行）。
            </p>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-stone-800">サブタイトル</span>
              <input
                type="text"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                placeholder={DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE}
                maxLength={SOCIAL_POST_SUBTITLE_MAX_CHARS}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              緑の帯に載る短い一文です。空欄のままだと「{DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE}」が使われます。
            </p>
            <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
              <p className="text-xs font-medium text-stone-600">本文（画像に載る抜粋・自動）</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-800">
                {bodyPreview || "（本文なし）"}
              </p>
            </div>
          </>
        ) : (
          <>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-stone-800">{titleLabel}</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="SNS用のタイトルを入力"
                maxLength={titleMaxChars}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              あしあと本体には保存されません。最大 {titleMaxChars} 文字（1行）。
            </p>
            <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
              <p className="text-xs font-medium text-stone-600">本文（画像に載る抜粋・自動）</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-800">
                {bodyPreview || "（本文なし）"}
              </p>
            </div>
          </>
        )}

        {showPhotoAdjust ? (
          <div className="mt-4">
            <JournalSocialPostImagePhotoAdjustEditor
              photoSrc={photoDisplaySrc}
              targetWidth={templatePhoto.width}
              targetHeight={templatePhoto.height}
              adjust={photoAdjustDraft}
              onChange={setPhotoAdjustDraft}
              onReset={handlePhotoAdjustReset}
              onApply={handleApplyPhotoAdjust}
              hasPendingApply={hasPendingPhotoApply}
              applyingPreview={loadingPreview && !hasPendingPhotoApply}
            />
            {isThreeKoma ? (
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                あしあとの写真を使っているコマに、このトリミングが反映されます。追加写真は中央寄せで入ります。
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-900">{previewHeading}</h2>
          <JournalSocialPostImageDownloadButton
            href={downloadUrl}
            buildJsonBody={
              usesThreeKomaTemplate && threeKomaNeedsUpload
                ? () => buildThreeKomaRequestBody(true)
                : undefined
            }
            label={downloadLabel}
            onDownloaded={() =>
              onCardExported?.({
                templateId: debouncedTemplateId,
                title: previewTitle,
              })
            }
          />
        </div>

        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-[#faf8f5] shadow-sm">
          <div
            className="relative w-full"
            style={{ aspectRatio: `${designSize.widthPx} / ${designSize.heightPx}` }}
          >
            {loadingPreview ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-stone-100/70 px-4 text-center text-sm text-stone-600">
                画像を作っています…
                <br />
                初回は10秒ほどかかることがあります
              </div>
            ) : null}
            {previewError ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50 px-4 text-center text-sm text-red-700">
                {previewError}
              </div>
            ) : null}
            {previewDisplayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewDisplayUrl}
                alt={previewAlt}
                className="h-full w-full object-contain"
                onLoad={() => {
                  setLoadingPreview(false);
                  setPreviewError(null);
                }}
                onError={() => {
                  setLoadingPreview(false);
                  setPreviewError("プレビューの生成に失敗しました。しばらくしてからお試しください。");
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
  },
);
