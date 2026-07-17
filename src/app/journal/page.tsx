"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";

import { JournalCompanionPicker } from "@/components/journal/JournalCompanionPicker";
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import {
  JOURNAL_CONTENT_HELP,
  JOURNAL_FONT_SIZE_HELP,
} from "@/lib/journal/journalInputHelpCopy";
import {
  formatJournalRecordPageTitle,
  journalBodyInputHeading,
} from "@/lib/journal/journalRecordDateDisplay";
import { JournalWritingComposer } from "@/components/journal/JournalWritingComposer";
import { JournalContentLengthAlerts } from "@/components/journal/JournalContentLengthAlerts";
import { DiaryTagInput } from "@/components/journal/DiaryTagInput";
import { JournalFootprintActions } from "@/components/journal/JournalFootprintActions";
import {
  JournalLocalDraftBanner,
  JOURNAL_LOCAL_DRAFT_PHOTO_NOTICE,
} from "@/components/journal/JournalLocalDraftBanner";
import { DonguriFootprintModal } from "@/components/loghouse/DonguriFootprintModal";
import { JournalSaveStoryTransitionOverlay } from "@/components/journal/JournalSaveStoryTransitionOverlay";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { useEnsureActiveViewerProfile } from "@/hooks/useEnsureActiveViewerProfile";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import { LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import {
  pickSaveAfterAnimalMessage,
  waitForSaveTransitionMinimum,
  type SaveAfterAnimalPick,
} from "@/lib/journal/journalSaveAfterAnimalMessages";
import { prefetchJournalPreview } from "@/lib/journal/journalPreviewPrefetch";
import {
  preloadSaveTransitionAnimalAsset,
  preloadSaveTransitionOpeningAssets,
} from "@/lib/journal/saveTransitionAssets";
import {
  journalCalendarPathForMonth,
  journalListPathForMonth,
  journalPreviewPath,
  resolveJournalEntryMonthKey,
} from "@/lib/journal/journalNav";
import {
  CONTENT_FONT_MODE_LABELS_JA,
  CONTENT_FONT_MODES,
  DEFAULT_CONTENT_FONT_MODE,
  type ContentFontMode,
  JOURNAL_CONTENT_SOFT_MAX_BY_MODE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";
import {
  countBodyLayoutLines,
  getDiaryBodyLineLimit,
  isDiaryBodyOverLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import type { JournalNumerologyDebug } from "@/lib/journal/journalNumerologyDebug";
import {
  activityOptions,
  moodOptions,
  normalizeCompanionType,
  type ActivityId,
  type CompanionType,
  type DiaryDesignId,
  type MoodId,
} from "@/lib/journal/meta";
import {
  extractTagsFromContent,
  formatDiaryTagsForInput,
  mergeTagsIntoContent,
} from "@/lib/journal/diaryTags";
import {
  readJournalCompanionPreference,
  writeJournalCompanionPreference,
} from "@/lib/journal/journalCompanionPreference";
import {
  clearLegacyJournalCompanionHandoff,
  clearCompanionWritingEditSession,
  readCompanionWritingEditSession,
  readLegacyJournalCompanionHandoff,
  updateCompanionWritingEditSessionEmphasis,
  writeCompanionWritingPreviewGuide,
  type CompanionWritingEditSession,
  type JournalCompanionHandoffFocus,
} from "@/lib/journal/companionWriting/session";
import { scrollJournalEditSectionIntoView } from "@/lib/journal/companionWriting/editSectionScroll";
import { isCompanionEditZoneActive } from "@/lib/journal/companionWriting/editZoneHighlight";
import { COMPANION_WRITING_EDIT_ZONE_SPOTLIGHT_MS } from "@/lib/journal/companionWriting/types";
import { CompanionWritingJournalGuide } from "@/components/journal/companion-writing/CompanionWritingJournalGuide";
import { CompanionWritingJournalGuideDock } from "@/components/journal/companion-writing/CompanionWritingJournalGuideDock";
import { companionWritingZoneSectionClass } from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { CompanionWritingZoneHint } from "@/components/journal/companion-writing/CompanionWritingZoneHint";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import { useEntitlement } from "@/components/entitlement/useEntitlement";
import { useJournalLocalDraft } from "@/hooks/useJournalLocalDraft";
import { writeDonguriBalanceHint } from "@/lib/loghouse/donguriBalanceHint";
import {
  BTN_CLOSE,
  BTN_CONTINUE_DRAFT,
  BTN_REWRITE_DRAFT,
  DONGURI_DRAFT_RESET_CONFIRM,
  DONGURI_DRAFT_RESUME_BODY,
  DONGURI_DRAFT_RESUME_TITLE,
} from "@/lib/loghouse/donguriFootprintCopy";
import { DONGURI_DIARY_SAVE_COST } from "@/lib/loghouse/donguriTypes";
import {
  buildJournalLocalDraftKey,
  isJournalLocalDraftFeatureEnabled,
  readJournalLocalDraft,
  type JournalLocalDraftFormSnapshot,
  type JournalLocalDraftPayload,
} from "@/lib/journal/journalLocalDraftStorage";

const JOURNAL_EDIT_LOADING_LABEL = "フクロウ先生が日記を開いています…";
const CALENDAR_RETURN_LOADING_LABEL = "カレンダーに戻っています…";

type Entry = {
  id: string;
  content: string;
  createdAt: string;
  mood: MoodId;
  activity: ActivityId;
  companionType: string;
  designTheme?: DiaryDesignId;
  contentFontMode?: string;
  /** 一覧 API では hasPhoto のみ。編集 GET では photoSrc（Blob/legacy 共通） */
  photoDataUrl?: string | null;
  photoSrc?: string | null;
  hasPhoto?: boolean;
  generatedComment: string | null;
  includeInBook: boolean;
  /** 単件 GET などで付与。編集時に URL の profile と揃えるために使う */
  profileId?: string;
  /** GET `?numerologyDebug=1` のときのみ */
  numerologyDebug?: JournalNumerologyDebug;
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDateInputValueUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  return (
    probe.getFullYear() === y &&
    probe.getMonth() === m - 1 &&
    probe.getDate() === d
  );
}

/** 日記写真はテンプレ上おおよそ5cm角の製本表示を想定し、720pxで十分な解像度を確保する */
async function compressToSquareDataUrl(file: File, offsetPercent: number): Promise<string> {
  const imageBitmap = await createImageBitmap(file);
  const targetSize = 720;
  const primaryMime = "image/webp";
  const primaryQuality = 0.72;
  const fallbackMime = "image/jpeg";
  const fallbackQuality = 0.72;
  const offset = Math.max(0, Math.min(100, offsetPercent)) / 100;

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像処理の初期化に失敗しました。");

  const sourceSide = Math.min(imageBitmap.width, imageBitmap.height);
  let sx = 0;
  let sy = 0;
  if (imageBitmap.width > imageBitmap.height) {
    sx = Math.round((imageBitmap.width - sourceSide) * offset);
  } else if (imageBitmap.height > imageBitmap.width) {
    sy = Math.round((imageBitmap.height - sourceSide) * offset);
  }
  ctx.drawImage(imageBitmap, sx, sy, sourceSide, sourceSide, 0, 0, targetSize, targetSize);
  imageBitmap.close();

  const primary = canvas.toDataURL(primaryMime, primaryQuality);
  // Safari 等で webp が使えない環境を考慮して jpeg にフォールバック
  if (primary.startsWith("data:image/webp")) return primary;
  return canvas.toDataURL(fallbackMime, fallbackQuality);
}

function JournalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { entitlement, loading: entitlementLoading } = useEntitlement();
  const editingId = searchParams.get("edit");
  const canWriteJournal =
    entitlement?.canUseContinuedFeatures || entitlement?.canCreateFirstJournal;
  const canEditJournal = entitlement?.canUseContinuedFeatures ?? true;
  const showJournalForm =
    entitlementLoading ||
    (editingId ? canEditJournal : canWriteJournal);
  const profileId = (searchParams.get("profile") ?? "").trim();
  const dateFromQuery = searchParams.get("date");
  const preferDraftFromQuery = searchParams.get("preferDraft") === "1";
  const freshDraftFromQuery = searchParams.get("freshDraft") === "1";
  const resumeDraftFromQuery = searchParams.get("resumeDraft") === "1";
  const focusFromQuery = searchParams.get("focus");
  const showNumerologyDebug = searchParams.get("numerologyDebug") === "1";
  const showSyncDebug = searchParams.get("syncDebug") === "1";
  const showAuthDebug =
    showNumerologyDebug ||
    showSyncDebug ||
    process.env.NODE_ENV === "development";
  const safeReturnTo = useMemo(
    () => parseSafeJournalReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );
  const returnToIsCalendar = safeReturnTo?.startsWith("/orders/calendar") ?? false;
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateInputValue(new Date()));
  const [mood, setMood] = useState<MoodId>("calm");
  const [activity, setActivity] = useState<ActivityId>("record_anyway");
  const [companionType, setCompanionType] = useState<CompanionType>(() =>
    readJournalCompanionPreference(),
  );
  const designTheme: DiaryDesignId = "simple_plain";
  const [contentFontMode, setContentFontMode] = useState<ContentFontMode>(DEFAULT_CONTENT_FONT_MODE);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [existingPhotoSrc, setExistingPhotoSrc] = useState<string>("");
  const [photoDirty, setPhotoDirty] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [cropOffset, setCropOffset] = useState(50);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(() => Boolean(editingId));
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serverViewerEmail, setServerViewerEmail] = useState<string | null>(null);
  const profileState = useEnsureActiveViewerProfile({
    urlProfileId: profileId,
    syncProfileToUrl: true,
    redirectIfMissing: "/orders",
  });
  const effectiveProfileId = profileState.effectiveProfileId || profileId;
  const [error, setError] = useState<string | null>(null);
  const [numerologyDebug, setNumerologyDebug] = useState<JournalNumerologyDebug | null>(null);
  const [owlRegenLoading, setOwlRegenLoading] = useState(false);
  const [navigatingToPreview, setNavigatingToPreview] = useState(false);
  const [saveTransition, setSaveTransition] = useState<{
    animal: SaveAfterAnimalPick;
    guardianColorName: string | null;
    guardianColorResolved: boolean;
  } | null>(null);
  const [navigatingToCalendar, setNavigatingToCalendar] = useState(false);
  const [kanteiOrderExists, setKanteiOrderExists] = useState<boolean | undefined>(undefined);
  const [editLoadFailed, setEditLoadFailed] = useState(false);
  const [editServerSnapshot, setEditServerSnapshot] =
    useState<JournalLocalDraftFormSnapshot | null>(null);
  const [companionEditSession, setCompanionEditSession] =
    useState<CompanionWritingEditSession | null>(null);
  const [companionGuideMode, setCompanionGuideMode] = useState<"overlay" | "dock" | null>(null);
  const [companionActiveFocus, setCompanionActiveFocus] =
    useState<JournalCompanionHandoffFocus | null>(null);
  const [companionSpotlightFocus, setCompanionSpotlightFocus] =
    useState<JournalCompanionHandoffFocus | null>(null);
  const [acornBalance, setAcornBalance] = useState<number | null>(null);
  const [preferDraftMode, setPreferDraftMode] = useState(preferDraftFromQuery);
  const [serverDraftDialog, setServerDraftDialog] = useState<
    "none" | "resume" | "resetConfirm"
  >("none");
  const [pendingServerDraft, setPendingServerDraft] = useState<{
    content: string;
    mood: string;
    activity: string;
    companionType: string;
    contentFontMode: string;
    photoSrc: string | null;
  } | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const editLoadGenerationRef = useRef(0);
  const saveTransitionStartedAtRef = useRef<number | null>(null);
  const saveTransitionAnimalShownAtRef = useRef<number | null>(null);
  const companionSpotlightTimerRef = useRef<number | null>(null);

  const focusCompanionSection = useCallback((focus: JournalCompanionHandoffFocus) => {
    updateCompanionWritingEditSessionEmphasis(focus);
    setCompanionEditSession((prev) => (prev ? { ...prev, emphasis: focus } : prev));
    setCompanionActiveFocus(focus);
    setCompanionGuideMode("dock");
    setCompanionSpotlightFocus(focus);
    scrollJournalEditSectionIntoView(focus);

    if (focus === "photo") {
      photoInputRef.current?.click();
    } else {
      window.setTimeout(() => {
        document.getElementById("journal-content")?.focus({ preventScroll: true });
      }, 320);
    }

    if (companionSpotlightTimerRef.current !== null) {
      window.clearTimeout(companionSpotlightTimerRef.current);
    }
    companionSpotlightTimerRef.current = window.setTimeout(() => {
      setCompanionSpotlightFocus(null);
      companionSpotlightTimerRef.current = null;
    }, COMPANION_WRITING_EDIT_ZONE_SPOTLIGHT_MS);
  }, []);

  const resetJournalFormState = useCallback(() => {
    setContent("");
    setTagInput("");
    setMood("calm");
    setActivity("record_anyway");
    setCompanionType(readJournalCompanionPreference());
    setContentFontMode(DEFAULT_CONTENT_FONT_MODE);
    setEntryDate(toDateInputValue(new Date()));
    setPhotoDataUrl("");
    setExistingPhotoSrc("");
    setPhotoDirty(false);
    setSelectedPhotoFile(null);
    setCropOffset(50);
    setProcessingPhoto(false);
    setNumerologyDebug(null);
    setLoadingEdit(false);
    setOwlRegenLoading(false);
    setNavigatingToPreview(false);
    setSaveTransition(null);
    saveTransitionStartedAtRef.current = null;
    saveTransitionAnimalShownAtRef.current = null;
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }, []);

  const applyLocalDraft = useCallback((draft: JournalLocalDraftPayload) => {
    setContent(draft.content);
    setMood(draft.mood);
    setActivity(draft.activity);
    setEntryDate(draft.entryDate);
    setContentFontMode(normalizeContentFontMode(draft.contentFontMode));
    setError(null);
  }, []);

  const journalLocalDraftActive =
    isJournalLocalDraftFeatureEnabled() &&
    Boolean(showJournalForm) &&
    Boolean(user?.email?.trim()) &&
    profileState.ready &&
    Boolean(effectiveProfileId || profileId || user?.email);

  const localDraft = useJournalLocalDraft({
    enabled: journalLocalDraftActive,
    viewerEmail: user?.email ?? null,
    profileId: effectiveProfileId,
    editingId,
    entryDate,
    mood,
    activity,
    content,
    contentFontMode,
    loadingEdit,
    editLoadFailed,
    editServerSnapshot,
    autosavePaused:
      saving ||
      processingPhoto ||
      saveTransition != null ||
      navigatingToPreview ||
      navigatingToCalendar ||
      Boolean(deletingId),
    onApplyDraft: applyLocalDraft,
  });

  const monthKeyFromEditingContext = useCallback((): string | null => {
    return resolveJournalEntryMonthKey({ entryDateYmd: entryDate });
  }, [entryDate]);

  const navigateToEntryMonthCalendar = useCallback(
    (monthKey: string | null) => {
      setNavigatingToCalendar(true);
      router.push(
        monthKey ? journalCalendarPathForMonth(monthKey) : "/orders/calendar",
      );
    },
    [router],
  );

  const beginCalendarReturn = useCallback(
    (href: string) => {
      if (navigatingToCalendar) return;
      setNavigatingToCalendar(true);
      router.push(href);
    },
    [navigatingToCalendar, router],
  );

  const cancelEditingAndReturnToCalendar = useCallback(() => {
    if (navigatingToCalendar) return;
    const monthKey = monthKeyFromEditingContext();
    editLoadGenerationRef.current += 1;
    setNavigatingToCalendar(true);
    resetJournalFormState();
    navigateToEntryMonthCalendar(monthKey);
  }, [
    monthKeyFromEditingContext,
    navigateToEntryMonthCalendar,
    navigatingToCalendar,
    resetJournalFormState,
  ]);

  useEffect(() => {
    if (authLoading || !profileState.ready) return;

    const clientEmail = user?.email?.trim().toLowerCase() ?? "";
    if (!clientEmail) {
      setServerViewerEmail(null);
      return;
    }

    let cancelled = false;
    setError(null);

    void (async () => {
      try {
        try {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: clientEmail }),
          });
          const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
          const sessionData = (await sessionRes.json()) as { email?: string | null };
          if (!cancelled) {
            setServerViewerEmail((sessionData.email ?? null) ? String(sessionData.email).toLowerCase() : null);
          }
        } catch {
          if (!cancelled) {
            setServerViewerEmail(null);
          }
        }
      } finally {
        /* session sync only */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.email, profileState.ready]);

  useEffect(() => {
    void preloadSaveTransitionOpeningAssets();
  }, []);

  useEffect(() => {
    if (editingId) return;
    if (!dateFromQuery || !isValidDateInput(dateFromQuery)) {
      setEntryDate(toDateInputValue(new Date()));
      return;
    }
    setEntryDate(dateFromQuery);
  }, [editingId, dateFromQuery]);

  useEffect(() => {
    setPreferDraftMode(preferDraftFromQuery);
  }, [preferDraftFromQuery]);

  useEffect(() => {
    if (editingId || !effectiveProfileId || !profileState.ready) return;
    let cancelled = false;
    void (async () => {
      try {
        const qs = new URLSearchParams({ profileId: effectiveProfileId });
        const res = await fetch(`/api/loghouse/donguri/status?${qs.toString()}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as { balance?: number };
        if (!cancelled && typeof data.balance === "number") {
          setAcornBalance(data.balance);
          if (data.balance < DONGURI_DIARY_SAVE_COST) {
            setPreferDraftMode(true);
          }
        }
      } catch {
        // ignore
      }

      if (freshDraftFromQuery) return;

      try {
        const dateKey = isValidDateInput(dateFromQuery ?? "")
          ? (dateFromQuery as string)
          : entryDate;
        const draftQs = new URLSearchParams({
          dateKey,
          profileId: effectiveProfileId,
        });
        const draftRes = await fetch(`/api/journal/drafts?${draftQs.toString()}`, {
          credentials: "same-origin",
        });
        const draftData = (await draftRes.json()) as {
          draft?: {
            content?: string;
            mood?: string;
            activity?: string;
            companionType?: string;
            contentFontMode?: string;
            hasPhoto?: boolean;
            photoSrc?: string | null;
          } | null;
        };
        if (cancelled || !draftRes.ok || !draftData.draft) return;
        const d = draftData.draft;
        const photoSrc = d.hasPhoto && d.photoSrc ? d.photoSrc : null;
        const hasMeaningfulDraft = Boolean((d.content ?? "").trim() || photoSrc);
        setPendingServerDraft({
          content: d.content ?? "",
          mood: d.mood ?? "calm",
          activity: d.activity ?? "record_anyway",
          companionType: d.companionType ?? "owl",
          contentFontMode: d.contentFontMode ?? "standard",
          photoSrc,
        });
        if (!hasMeaningfulDraft) return;
        if (resumeDraftFromQuery) {
          setContent(d.content ?? "");
          setMood((d.mood ?? "calm") as MoodId);
          setActivity((d.activity ?? "record_anyway") as ActivityId);
          setCompanionType((d.companionType ?? "owl") as CompanionType);
          setContentFontMode((d.contentFontMode ?? "standard") as ContentFontMode);
          if (photoSrc) {
            setExistingPhotoSrc(photoSrc);
            setPhotoDataUrl("");
            setPhotoDirty(false);
          }
          setPendingServerDraft(null);
          return;
        }
        setServerDraftDialog("resume");
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // entryDate は初回ロード用。日付変更時は別途手動で下書き確認しない
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / profile / date query
  }, [editingId, effectiveProfileId, profileState.ready, dateFromQuery, freshDraftFromQuery, resumeDraftFromQuery]);

  useEffect(() => {
    if (!editingId || loadingEdit) {
      setCompanionEditSession(null);
      setCompanionGuideMode(null);
      setCompanionActiveFocus(null);
      setCompanionSpotlightFocus(null);
      return;
    }
    const session = readCompanionWritingEditSession();
    if (session?.entryId === editingId) {
      setCompanionEditSession(session);
      setCompanionGuideMode("overlay");
      setCompanionActiveFocus(null);
      setCompanionSpotlightFocus(null);
    } else {
      setCompanionEditSession(null);
      setCompanionGuideMode(null);
      setCompanionActiveFocus(null);
      setCompanionSpotlightFocus(null);
    }
  }, [editingId, loadingEdit]);

  useEffect(() => {
    if (!editingId || loadingEdit) return;
    if (companionEditSession && companionGuideMode === "overlay") return;
    const legacyHandoff = readLegacyJournalCompanionHandoff();
    const focus =
      focusFromQuery === "photo" || focusFromQuery === "body"
        ? focusFromQuery
        : legacyHandoff?.focus;
    if (!focus) return;
    clearLegacyJournalCompanionHandoff();
    scrollJournalEditSectionIntoView(focus);
  }, [
    companionEditSession,
    companionGuideMode,
    editingId,
    focusFromQuery,
    loadingEdit,
  ]);

  useEffect(
    () => () => {
      if (companionSpotlightTimerRef.current !== null) {
        window.clearTimeout(companionSpotlightTimerRef.current);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    if (editingId) {
      setLoadingEdit(true);
    }
  }, [editingId]);

  useEffect(() => {
    if (entitlementLoading || !entitlement || !editingId) return;
    if (entitlement.canUseContinuedFeatures) return;
    const qs = new URLSearchParams({
      entry: editingId,
      theme: designTheme,
      pv: "3",
    });
    if (safeReturnTo) qs.set("returnTo", safeReturnTo);
    if (effectiveProfileId) qs.set("profile", effectiveProfileId);
    router.replace(`/journal/preview?${qs.toString()}`);
  }, [entitlementLoading, entitlement, editingId, safeReturnTo, router, designTheme, effectiveProfileId]);

  useEffect(() => {
    if (!editingId) {
      setNumerologyDebug(null);
      setEditLoadFailed(false);
      setEditServerSnapshot(null);
      return;
    }
    const generation = ++editLoadGenerationRef.current;
    setLoadingEdit(true);
    setEditLoadFailed(false);
    setEditServerSnapshot(null);
    setError(null);
    const qs = new URLSearchParams();
    qs.set("_", String(Date.now()));
    if (showNumerologyDebug) qs.set("numerologyDebug", "1");
    void fetch(`/api/journal/${encodeURIComponent(editingId)}?${qs.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (generation !== editLoadGenerationRef.current) return;
        const data = (await res.json()) as {
          entry?: Entry;
          kanteiOrderExists?: boolean;
          error?: string;
        };
        if (!res.ok || !data.entry) {
          throw new Error(data.error ?? "編集対象の読み込みに失敗しました。");
        }
        setKanteiOrderExists(data.kanteiOrderExists);
        const loadedEntryDate = toDateInputValueUtc(
          new Date(data.entry.createdAt != null ? data.entry.createdAt : Date.now()),
        );
        const loadedMood = (data.entry.mood ?? "calm") as MoodId;
        const loadedActivity = (data.entry.activity ?? "record_anyway") as ActivityId;
        const loadedContent = data.entry.content ?? "";
        const { body: loadedBody, tags: loadedTags } = extractTagsFromContent(loadedContent);
        const loadedFontMode = normalizeContentFontMode(data.entry.contentFontMode);
        setContent(loadedBody);
        setTagInput(formatDiaryTagsForInput(loadedTags));
        setMood(loadedMood);
        setActivity(loadedActivity);
        setCompanionType(normalizeCompanionType(data.entry.companionType));
        setContentFontMode(loadedFontMode);
        setPhotoDataUrl(data.entry.photoDataUrl ?? "");
        setExistingPhotoSrc(
          data.entry.photoSrc?.trim() ||
            (data.entry.hasPhoto ? `/api/journal/entries/${encodeURIComponent(editingId)}/photo` : ""),
        );
        setPhotoDirty(false);
        setSelectedPhotoFile(null);
        setCropOffset(50);
        if (photoInputRef.current) photoInputRef.current.value = "";
        setEntryDate(loadedEntryDate);
        setEditServerSnapshot({
          entryDate: loadedEntryDate,
          mood: loadedMood,
          activity: loadedActivity,
          content: loadedBody,
          contentFontMode: loadedFontMode,
        });
        setEditLoadFailed(false);
        setNumerologyDebug(data.entry.numerologyDebug ?? null);
        const rowPid =
          typeof data.entry.profileId === "string" ? data.entry.profileId.trim() : "";
        if (rowPid && searchParams.get("profile") !== rowPid) {
          const next = new URLSearchParams(searchParams.toString());
          next.set("profile", rowPid);
          next.set("edit", editingId);
          router.replace(`/journal?${next.toString()}`);
        }
      })
      .catch((e) => {
        if (generation !== editLoadGenerationRef.current) return;
        editLoadGenerationRef.current += 1;
        const viewerEmail = user?.email?.trim() ?? "";
        const draftKey =
          viewerEmail && editingId
            ? buildJournalLocalDraftKey({
                email: viewerEmail,
                profileId: effectiveProfileId,
                mode: "edit",
                editingId,
              })
            : null;
        const draft =
          isJournalLocalDraftFeatureEnabled() && draftKey
            ? readJournalLocalDraft(draftKey)
            : null;
        setEditLoadFailed(true);
        setEditServerSnapshot(null);
        if (draft) {
          setError(
            "オフラインまたは通信エラーのため、サーバーから日記を開けませんでした。端末内の下書きから復元できます。",
          );
          return;
        }
        resetJournalFormState();
        const href = effectiveProfileId
          ? `/journal?profile=${encodeURIComponent(effectiveProfileId)}`
          : "/journal";
        router.replace(href);
        setError(e instanceof Error ? e.message : "編集対象の読み込みに失敗しました。");
      })
      .finally(() => {
        if (generation !== editLoadGenerationRef.current) return;
        setLoadingEdit(false);
      });
  }, [
    editingId,
    effectiveProfileId,
    resetJournalFormState,
    router,
    searchParams,
    showNumerologyDebug,
    user?.email,
  ]);

  useEffect(() => {
    if (!selectedPhotoFile) return;
    setProcessingPhoto(true);
    setError(null);
    void compressToSquareDataUrl(selectedPhotoFile, cropOffset)
      .then((result) => {
        setPhotoDataUrl(result);
        setPhotoDirty(true);
        setExistingPhotoSrc("");
      })
      .catch(() => {
        setError("写真の圧縮に失敗しました。別の画像でお試しください。");
      })
      .finally(() => {
        setProcessingPhoto(false);
      });
  }, [selectedPhotoFile, cropOffset]);

  function removePhoto() {
    if (!photoDataUrl.trim() && !existingPhotoSrc.trim()) return;
    if (!window.confirm("この写真を削除しますか？本文は残ります。")) return;
    setPhotoDataUrl("");
    setExistingPhotoSrc("");
    setSelectedPhotoFile(null);
    setPhotoDirty(true);
    setCropOffset(50);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  async function saveEntry(
    redirectMode: "preview" | "returnTo" | "stay" | "companionFinish" = "preview",
  ) {
    setError(null);
    setDraftNotice(null);

    if (editingId && !canEditJournal) {
      setError("無料お試し期間が終了したため、記録の編集はできません。");
      return;
    }
    if (!editingId && !canWriteJournal) {
      setError("無料お試し期間が終了したため、新しい記録の作成はできません。");
      return;
    }

    const text = content.trim();
    if (!text) {
      setError("本文を入力してください。");
      return;
    }
    const mergedContent = mergeTagsIntoContent(text, tagInput);
    if (mergedContent.length > 2000) {
      setError("本文とタグを合わせて2000文字以内にしてください。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }

    const isNewEntrySave = !editingId;
    if (isNewEntrySave) {
      const animal = pickSaveAfterAnimalMessage();
      void preloadSaveTransitionAnimalAsset(animal.imagePath);
      saveTransitionStartedAtRef.current = Date.now();
      saveTransitionAnimalShownAtRef.current = null;
      setSaveTransition({
        animal,
        guardianColorName: null,
        guardianColorResolved: false,
      });
    }

    setSaving(true);
    try {
      const endpoint = editingId
        ? `/api/journal/${encodeURIComponent(editingId)}`
        : "/api/journal";
      const photoPayload = (() => {
        if (photoDirty) {
          if (photoDataUrl.trim()) return { photoDataUrl: photoDataUrl.trim() };
          return { photoRemoved: true };
        }
        if (editingId) return { photoUnchanged: true };
        return {};
      })();

      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: mergedContent,
          mood,
          activity,
          companionType,
          designTheme,
          contentFontMode,
          ...photoPayload,
          entryDate,
          effectiveProfileId,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        entry?: { id?: string };
        guardianColorName?: string | null;
        donguriBalance?: number | null;
      };
      if (!res.ok) {
        if (isNewEntrySave) {
          setSaveTransition(null);
          saveTransitionStartedAtRef.current = null;
          saveTransitionAnimalShownAtRef.current = null;
        }
        if (data.code === "ACORN_INSUFFICIENT") {
          setAcornBalance((prev) =>
            prev !== null && prev < DONGURI_DIARY_SAVE_COST ? prev : DONGURI_DIARY_SAVE_COST - 1,
          );
          setPreferDraftMode(true);
          setError("どんぐりが足りません。下書きとして残すか、どんぐりをためてから森に残してください。");
          return;
        }
        setError(data.error ?? "あしあとを残せませんでした。");
        return;
      }
      const savedId = data.entry?.id ? String(data.entry.id) : editingId;
      if (!savedId) {
        if (isNewEntrySave) {
          setSaveTransition(null);
          saveTransitionStartedAtRef.current = null;
          saveTransitionAnimalShownAtRef.current = null;
        }
        setError("あしあとを残せませんでした。");
        return;
      }

      if (
        isNewEntrySave &&
        effectiveProfileId &&
        typeof data.donguriBalance === "number"
      ) {
        writeDonguriBalanceHint(effectiveProfileId, data.donguriBalance);
        setAcornBalance(data.donguriBalance);
      }

      localDraft.clearDraftAfterSuccessfulSave();

      const monthKey = resolveJournalEntryMonthKey({ entryDateYmd: entryDate });
      const listFallback = monthKey ? journalListPathForMonth(monthKey) : "/orders/list";
      const previewReturnTo = safeReturnTo ?? listFallback;

      if (isNewEntrySave) {
        setSaveTransition((prev) =>
          prev
            ? {
                ...prev,
                guardianColorName: data.guardianColorName ?? null,
                guardianColorResolved: true,
              }
            : prev,
        );

        const startedAt = saveTransitionStartedAtRef.current ?? Date.now();
        const previewPath = journalPreviewPath(
          savedId,
          designTheme,
          previewReturnTo,
          effectiveProfileId,
        );

        void (async () => {
          await Promise.all([
            prefetchJournalPreview(savedId),
            waitForSaveTransitionMinimum(startedAt, () => saveTransitionAnimalShownAtRef.current),
          ]);
          saveTransitionStartedAtRef.current = null;
          saveTransitionAnimalShownAtRef.current = null;
          // オーバーレイはページ離脱まで維持（消してから push すると入力画面が一瞬見える）
          router.push(previewPath);
        })();
        return;
      }

      const goToPreview = () => {
        setNavigatingToPreview(true);
        router.push(journalPreviewPath(savedId, designTheme, previewReturnTo, effectiveProfileId));
      };

      if (redirectMode === "stay") {
        return;
      }

      if (redirectMode === "companionFinish") {
        clearCompanionWritingEditSession();
        setCompanionEditSession(null);
        setCompanionGuideMode(null);
        setCompanionActiveFocus(null);
        setCompanionSpotlightFocus(null);
        if (savedId) {
          writeCompanionWritingPreviewGuide({
            version: 1,
            entryId: savedId,
            companionType,
            profileId: effectiveProfileId || undefined,
          });
        }
        goToPreview();
        return;
      }

      if (!editingId || redirectMode === "preview") {
        goToPreview();
        return;
      }

      resetJournalFormState();
      if (safeReturnTo) {
        router.push(safeReturnTo);
        return;
      }
      goToPreview();
    } catch {
      setError("通信に失敗しました。");
      if (isNewEntrySave) {
        setSaveTransition(null);
        saveTransitionStartedAtRef.current = null;
        saveTransitionAnimalShownAtRef.current = null;
      }
    } finally {
      setSaving(false);
    }
  }

  async function regenerateOwlCommentOnce() {
    if (!editingId) return;
    const text = content.trim();
    if (!text) {
      setError("本文を入力してください。");
      return;
    }
    const mergedContent = mergeTagsIntoContent(text, tagInput);
    if (mergedContent.length > 2000) {
      setError("本文とタグを合わせて2000文字以内にしてください。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }

    setOwlRegenLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: mergedContent,
          mood,
          activity,
          companionType,
          designTheme,
          contentFontMode,
          photoUnchanged: true,
          entryDate,
          effectiveProfileId,
          regenerateOwlComment: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "読み解きの再生成に失敗しました。");
        return;
      }
      const qs = new URLSearchParams();
      qs.set("_", String(Date.now()));
      if (showNumerologyDebug) qs.set("numerologyDebug", "1");
      const getRes = await fetch(`/api/journal/${encodeURIComponent(editingId)}?${qs.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const getData = (await getRes.json()) as { entry?: Entry };
      if (getRes.ok && getData.entry?.numerologyDebug) {
        setNumerologyDebug(getData.entry.numerologyDebug);
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setOwlRegenLoading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) {
      // 新規は専用ボタン（下書き / あしあと）から実行
      return;
    }
    if (companionEditSession) {
      await saveEntry("stay");
      return;
    }
    await saveEntry();
  }

  async function saveServerDraft() {
    setError(null);
    setDraftNotice(null);
    if (!effectiveProfileId) {
      setError("プロフィールを確認できませんでした。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }
    const text = content.trim();
    if (!text) {
      setError("本文を入力してください。");
      return;
    }
    const mergedContent = mergeTagsIntoContent(text, tagInput);
    if (mergedContent.length > 2000) {
      setError("本文とタグを合わせて2000文字以内にしてください。");
      return;
    }

    setSaving(true);
    try {
      const photoPayload = (() => {
        if (photoDirty) {
          if (photoDataUrl.trim()) return { photoDataUrl: photoDataUrl.trim() };
          return { photoRemoved: true };
        }
        if (existingPhotoSrc.trim()) return { photoUnchanged: true };
        return {};
      })();

      const res = await fetch("/api/journal/drafts", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: entryDate,
          profileId: effectiveProfileId,
          content: mergedContent,
          mood,
          activity,
          companionType,
          designTheme,
          contentFontMode,
          writingMode: "alone",
          ...photoPayload,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        draft?: { photoSrc?: string | null; hasPhoto?: boolean };
      };
      if (!res.ok) {
        setError(data.error ?? "下書きを残せませんでした。");
        return;
      }
      localDraft.clearDraftAfterSuccessfulSave();
      if (data.draft?.hasPhoto && data.draft.photoSrc) {
        setExistingPhotoSrc(data.draft.photoSrc);
        setPhotoDataUrl("");
        setPhotoDirty(false);
        setSelectedPhotoFile(null);
      } else if (photoPayload && "photoRemoved" in photoPayload) {
        setExistingPhotoSrc("");
        setPhotoDataUrl("");
        setPhotoDirty(false);
      }
      setDraftNotice("下書きとして残しました。どんぐりは使っていません。");
      if (safeReturnTo) {
        router.push(safeReturnTo);
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  function applyPendingServerDraft() {
    if (!pendingServerDraft) return;
    setContent(pendingServerDraft.content);
    setMood(pendingServerDraft.mood as MoodId);
    setActivity(pendingServerDraft.activity as ActivityId);
    setCompanionType(pendingServerDraft.companionType as CompanionType);
    setContentFontMode(pendingServerDraft.contentFontMode as ContentFontMode);
    if (pendingServerDraft.photoSrc) {
      setExistingPhotoSrc(pendingServerDraft.photoSrc);
      setPhotoDataUrl("");
      setPhotoDirty(false);
    }
    setPendingServerDraft(null);
    setServerDraftDialog("none");
  }

  async function deleteEntry(id: string) {
    const entryId = id.trim();
    if (!entryId) return;

    const ok = window.confirm("この日記を本当に削除しますか？");
    if (!ok) return;

    const monthKey = monthKeyFromEditingContext();

    setDeletingId(entryId);
    setError(null);
    editLoadGenerationRef.current += 1;

    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "削除に失敗しました。");
        return;
      }
      resetJournalFormState();
      navigateToEntryMonthCalendar(monthKey);
    } catch {
      setError("削除時の通信に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  }

  const diaryTargetLabel =
    profileState.ready && profileState.hasProfiles ? profileState.activeProfileNickname : null;

  const trimmedContent = content.trim();
  const charCount = trimmedContent.length;
  const charMax = JOURNAL_CONTENT_SOFT_MAX_BY_MODE[contentFontMode];
  const { maxLines: bodyMaxLines } = getDiaryBodyLineLimit(contentFontMode);
  const bodyLineCount = useMemo(
    () => countBodyLayoutLines(trimmedContent, contentFontMode),
    [trimmedContent, contentFontMode],
  );
  const bodyOverflows = useMemo(
    () => isDiaryBodyOverLineLimit(trimmedContent, contentFontMode),
    [trimmedContent, contentFontMode],
  );
  const commentOverflows = false;

  const isEditEntryLoading = Boolean(editingId && loadingEdit);
  const recordPageTitle = isEditEntryLoading
    ? "日記を開いています"
    : formatJournalRecordPageTitle(entryDate);
  const bodyInputHeading = journalBodyInputHeading(entryDate);

  const hasPhotoSelection = Boolean(
    photoDataUrl.trim() || existingPhotoSrc.trim() || selectedPhotoFile || photoDirty,
  );
  const showPhotoDraftNotice =
    localDraft.isOffline || (hasPhotoSelection && localDraft.hasActiveLocalDraft);

  const companionBodyZoneActive =
    companionEditSession != null &&
    isCompanionEditZoneActive(
      "body",
      companionSpotlightFocus,
      companionActiveFocus,
      companionEditSession.emphasis,
    );
  const companionPhotoZoneActive =
    companionEditSession != null &&
    isCompanionEditZoneActive(
      "photo",
      companionSpotlightFocus,
      companionActiveFocus,
      companionEditSession.emphasis,
    );

  return (
    <div className="relative space-y-3">
      {saveTransition ? (
        <JournalSaveStoryTransitionOverlay
          animal={saveTransition.animal}
          guardianColorName={saveTransition.guardianColorName}
          guardianColorResolved={saveTransition.guardianColorResolved}
          onAnimalPhaseVisible={() => {
            if (saveTransitionAnimalShownAtRef.current == null) {
              saveTransitionAnimalShownAtRef.current = Date.now();
            }
          }}
        />
      ) : null}
      {navigatingToPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5]/90 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <OwlLoadingInline
            label="プレビューを準備しています…"
            size="md"
            className="rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] px-5 py-4 text-sm text-[#5c4a35] shadow-[0_4px_14px_rgba(90,70,45,0.05)]"
          />
        </div>
      ) : null}
      {navigatingToCalendar ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5]/90 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <OwlLoadingInline
            label={CALENDAR_RETURN_LOADING_LABEL}
            size="md"
            className="rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] px-5 py-4 text-sm text-[#5c4a35] shadow-[0_4px_14px_rgba(90,70,45,0.05)]"
          />
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[1.375rem] font-bold leading-tight text-stone-900 sm:text-[1.75rem]">
            {recordPageTitle}
          </h1>
          {diaryTargetLabel !== null ? (
            <span
              className="hidden rounded-full border border-violet-200/90 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900 sm:inline"
              title="いま書いている日記の対象"
            >
              {diaryTargetLabel}
            </span>
          ) : !authLoading && user?.email ? (
            <OwlLoadingInline label="読み込み中…" size="sm" className="text-[11px] text-stone-400" />
          ) : null}
        </div>
        {diaryTargetLabel !== null ? (
          <ActiveProfileLabel nickname={diaryTargetLabel} className="sm:hidden" />
        ) : null}
        {showAuthDebug && user?.email ? (
          <p className="text-[10px] leading-snug text-stone-400">
            ログイン: {user.email}
            {serverViewerEmail && serverViewerEmail !== user.email.toLowerCase()
              ? `（サーバー: ${serverViewerEmail}）`
              : ""}
          </p>
        ) : null}
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-stone-500">
          <Link href="/orders" className="underline-offset-2 hover:text-stone-600 hover:underline">
            {LOG_HOUSE_NAV_LABEL}
          </Link>
          {safeReturnTo ? (
            returnToIsCalendar ? (
              <button
                type="button"
                disabled={
                  navigatingToCalendar ||
                  navigatingToPreview ||
                  saveTransition != null ||
                  saving ||
                  processingPhoto ||
                  Boolean(deletingId)
                }
                onClick={() => beginCalendarReturn(safeReturnTo)}
                className="text-[#4a5440] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                カレンダーへ戻る
              </button>
            ) : (
              <Link
                href={safeReturnTo}
                className="text-[#4a5440] underline-offset-2 hover:underline"
              >
                本の確認へ
              </Link>
            )
          ) : null}
        </p>
      </div>

      {entitlement ? <TrialStatusBanner entitlement={entitlement} /> : null}

      {showJournalForm ? (
        <JournalLocalDraftBanner
          showDeviceOnlyNotice={localDraft.showDeviceOnlyNotice}
          isOffline={localDraft.isOffline}
          restorePromptVisible={localDraft.restorePromptVisible}
          onRestore={localDraft.acceptRestore}
          onDiscardRestore={localDraft.discardRestore}
        />
      ) : null}

      {isEditEntryLoading ? (
        <div
          className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] px-4 py-10 shadow-[0_4px_14px_rgba(90,70,45,0.05)] sm:min-h-[14rem] sm:p-8"
          aria-busy="true"
          aria-live="polite"
        >
          <OwlLoadingInline
            label={JOURNAL_EDIT_LOADING_LABEL}
            size="md"
            className="text-sm text-stone-600"
          />
        </div>
      ) : !showJournalForm ? (
        <div className="lj-read-desc rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-5 text-violet-950">
          <p>無料お試し期間が終了したため、新しい日記の作成はできません。</p>
          <p className="mt-2">
            <Link href="/orders/calendar" className="font-medium underline-offset-2 hover:underline">
              カレンダーで過去の日記を見る
            </Link>
          </p>
        </div>
      ) : (
      <form
        onSubmit={(e) => void onSubmit(e)}
        className={[
          "space-y-3 rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] p-4 shadow-[0_4px_14px_rgba(90,70,45,0.05)] sm:p-5",
          companionGuideMode === "dock" ? "pb-[calc(13rem+3.25rem+env(safe-area-inset-bottom,0px))]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {editingId ? (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="lj-read-caption text-amber-900">編集モードです。内容を更新できます。</p>
            <button
              type="button"
              disabled={saving || processingPhoto || deletingId === editingId}
              onClick={() => void deleteEntry(editingId)}
              className="shrink-0 self-start text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-800 disabled:opacity-50 sm:self-center"
            >
              {deletingId === editingId ? "削除中…" : "この日記を削除する"}
            </button>
          </div>
        ) : null}

        {companionEditSession && companionGuideMode === "overlay" ? (
          <CompanionWritingJournalGuide
            companionType={companionEditSession.companionType}
            activeFocus={companionActiveFocus}
            onFocusSection={focusCompanionSection}
          />
        ) : null}

        {companionEditSession && companionGuideMode === "dock" ? (
          <CompanionWritingJournalGuideDock
            companionType={companionEditSession.companionType}
            activeFocus={companionActiveFocus}
            saving={saving}
            onFocusSection={focusCompanionSection}
            onFinish={() => void saveEntry("companionFinish")}
          />
        ) : null}

        <div
          id="journal-body-section"
          className={[
            "scroll-mt-16",
            companionWritingZoneSectionClass(companionBodyZoneActive),
          ]
            .filter(Boolean)
            .join(" ")}
        >
        {companionEditSession ? (
          <CompanionWritingZoneHint
            kind="body"
            emphasized={companionBodyZoneActive && companionSpotlightFocus !== "body"}
            spotlight={companionSpotlightFocus === "body"}
          />
        ) : null}
        <JournalWritingComposer
          label={
            <FieldLabelWithHelp
              as="label"
              htmlFor="journal-content"
              label={bodyInputHeading}
              help={JOURNAL_CONTENT_HELP}
              helpAriaLabel={`${bodyInputHeading}の説明`}
              labelClassName="lj-read-desc font-semibold text-stone-800"
            />
          }
          recordPageTitle={recordPageTitle}
          bodyInputHeading={bodyInputHeading}
          content={content}
          onContentChange={setContent}
          onContentFontModeChange={setContentFontMode}
          disabled={saving || loadingEdit || processingPhoto}
          placeholder="例）今日は少し疲れたけれど、帰り道の空がきれいだった。"
          contentFontMode={contentFontMode}
          charCount={charCount}
          charMax={charMax}
          bodyLineCount={bodyLineCount}
          bodyMaxLines={bodyMaxLines}
          bodyOverflows={bodyOverflows}
          commentOverflows={commentOverflows}
        />
        </div>

        <fieldset className="hidden rounded-lg border border-stone-200/80 bg-stone-50/60 px-3 py-2.5 sm:block">
          <legend className="sr-only">文字サイズ</legend>
          <div className="px-1">
            <FieldLabelWithHelp
              label="文字サイズ"
              help={JOURNAL_FONT_SIZE_HELP}
              labelClassName="text-sm font-medium text-stone-800"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONTENT_FONT_MODES.map((mode) => (
              <label
                key={mode}
                className={[
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  contentFontMode === mode
                    ? "border-[#a8b08f]/95 bg-[#eef1e4] text-[#4a5440]"
                    : "border-[#e0d2bc]/90 bg-[#fffaf2]/90 text-[#5c4a35] hover:bg-[#f7efe3]",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="journal-content-font-mode"
                  value={mode}
                  checked={contentFontMode === mode}
                  onChange={() => setContentFontMode(mode)}
                  className="h-4 w-4 border-stone-300 text-[#6e7c57] focus:ring-[#6e7c57]"
                />
                {CONTENT_FONT_MODE_LABELS_JA[mode]}
              </label>
            ))}
          </div>
        </fieldset>

        <JournalContentLengthAlerts
          contentFontMode={contentFontMode}
          contentLength={charCount}
          bodyOverflows={bodyOverflows}
          commentOverflows={commentOverflows}
        />

        <div
          id="journal-photo-section"
          className={[
            "scroll-mt-16 space-y-2 rounded-lg border border-dashed border-[#e0d2bc]/90 bg-[#f7efe3]/50 px-3 py-3",
            companionWritingZoneSectionClass(companionPhotoZoneActive),
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {companionEditSession ? (
            <CompanionWritingZoneHint
              kind="photo"
              emphasized={companionPhotoZoneActive && companionSpotlightFocus !== "photo"}
              spotlight={companionSpotlightFocus === "photo"}
            />
          ) : null}
          <label className="lj-read-desc block font-medium text-stone-700" htmlFor="journal-photo">
            この日の写真（任意）
          </label>
          {showPhotoDraftNotice ? (
            <p className="text-xs leading-relaxed text-stone-500">{JOURNAL_LOCAL_DRAFT_PHOTO_NOTICE}</p>
          ) : null}
          <input
            ref={photoInputRef}
            id="journal-photo"
            type="file"
            accept="image/*"
            className="w-full rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] px-3 py-2.5 text-base text-[#5c4a35] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f3ead8] file:px-3 file:py-1.5 file:text-base file:text-[#5c4a35]"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setPhotoDataUrl("");
                setExistingPhotoSrc("");
                setPhotoDirty(true);
                setSelectedPhotoFile(null);
                return;
              }
              setCropOffset(50);
              setPhotoDirty(true);
              setSelectedPhotoFile(file);
            }}
          />
          {selectedPhotoFile ? (
            <label className="block">
              <span className="lj-read-caption text-stone-600">写真の位置調整（{cropOffset}%）</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={cropOffset}
                onChange={(e) => setCropOffset(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
          ) : null}
          {processingPhoto ? (
            <p className="lj-read-caption text-stone-500">写真を最適化しています…</p>
          ) : null}
          {photoDataUrl || existingPhotoSrc ? (
            <div className="space-y-2">
              <img
                src={photoDataUrl || existingPhotoSrc}
                alt="選択した写真プレビュー"
                className="aspect-square w-full max-w-xs rounded-lg border border-stone-200 bg-[#f7f4ee] object-contain"
              />
              <button
                type="button"
                onClick={removePhoto}
                disabled={saving || loadingEdit || processingPhoto}
                className="lj-read-caption text-stone-600 underline underline-offset-2 hover:text-stone-800 disabled:opacity-50"
              >
                写真を削除する
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-[#ebe2d4] pt-3">
          <JournalCompanionPicker
            value={companionType}
            onChange={(next) => {
              setCompanionType(next);
              writeJournalCompanionPreference(next);
            }}
            disabled={saving || loadingEdit || processingPhoto}
          />

        <label className="lj-read-desc block font-medium text-stone-700" htmlFor="journal-entry-date">
          記録日
        </label>
        <input
          id="journal-entry-date"
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
            className="w-full rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] px-3 py-2.5 text-base text-[#3f3428] outline-none ring-[#c5b089]/50 focus:ring-2"
        />
        {numerologyDebug ? (
          <details className="rounded-xl border border-[#e0d2bc]/90 bg-[#f7efe3]/90 px-3 py-2 text-xs text-[#5c4a35]">
            <summary className="cursor-pointer select-none font-medium text-stone-700">
              数値の確認（サポート用）
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              フォームで選んだ記録日は、UTC のその暦日 12:00 として保存されます。数秘の計算はその UTC 暦日（年・月・日）だけを使うため、サーバーや端末のタイムゾーン設定に依存しません。iPhone と Mac で同じ記録を開いても API の結果は同じです。
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
              補足文ではパーソナルデイ（pd）と暦の桁（monthDigit / dayDigit）を別プレースホルダで埋めています。暦の日を桁おろした数字がパーソナルデイと同じときだけ、日付重なりの補足が選ばれます。月だけ重なるときは「暦の月を桁おろした数字も…」の文です。
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 tabular-nums">
              <dt className="text-stone-500">記録日（暦）</dt>
              <dd>
                {numerologyDebug.calendarYear}年{numerologyDebug.calendarMonth}月
                {numerologyDebug.calendarDay}日
              </dd>
              <dt className="text-stone-500">UTC インスタント</dt>
              <dd className="break-all">{numerologyDebug.referenceInstantIsoUtc}</dd>
              <dt className="text-stone-500">生まれ（月・日）</dt>
              <dd>
                {numerologyDebug.birthMonth ?? "—"}月{numerologyDebug.birthDay ?? "—"}日（注文プロフィール）
              </dd>
              <dt className="text-stone-500">パーソナルイヤー</dt>
              <dd>{numerologyDebug.personalYear}</dd>
              <dt className="text-stone-500">パーソナルマンス</dt>
              <dd>{numerologyDebug.personalMonth}</dd>
              <dt className="text-stone-500">パーソナルデイ</dt>
              <dd>{numerologyDebug.personalDay}</dd>
              <dt className="col-span-2 mt-1 font-medium text-stone-600">
                読み解き生成へ渡す値（fromJournal → generateDiaryReading）
              </dt>
              <dt className="text-stone-500">暦の月（1–12）</dt>
              <dd>{numerologyDebug.owlReadingInput.calendarMonth1To12}</dd>
              <dt className="text-stone-500">暦の日（1–31）</dt>
              <dd>{numerologyDebug.owlReadingInput.calendarDay1To31}</dd>
              <dt className="text-stone-500">accentMonthDigit</dt>
              <dd>{numerologyDebug.owlReadingInput.accentMonthDigit}</dd>
              <dt className="text-stone-500">accentDayDigit</dt>
              <dd>{numerologyDebug.owlReadingInput.accentDayDigit}</dd>
              <dt className="text-stone-500">本棚用 diaryNumbers</dt>
              <dd>
                PY {numerologyDebug.diaryNumbers.year} / PM {numerologyDebug.diaryNumbers.month} / PD{" "}
                {numerologyDebug.diaryNumbers.today}
              </dd>
            </dl>
            <div className="mt-3 border-t border-[#ebe2d4] pt-2">
              <p className="mb-2 text-[11px] leading-relaxed text-stone-600">
                DB に残っている古い読み解きを、いまのロジックで上書きするときは（検証用・通常保存では再生成しません）:
              </p>
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                disabled={owlRegenLoading || saving || loadingEdit}
                onClick={() => void regenerateOwlCommentOnce()}
              >
                {owlRegenLoading ? "再生成中…" : "この記録の読み解きだけ再生成"}
              </button>
            </div>
          </details>
        ) : null}
        <fieldset>
          <legend className="lj-read-desc mb-2 block font-medium text-stone-700">今日の気分</legend>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5"
            role="radiogroup"
            aria-label="今日の気分"
          >
            {moodOptions.map((option) => {
              const selected = mood === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMood(option.id)}
                  className={[
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition",
                    selected
                      ? "border-stone-500 bg-stone-50 ring-2 ring-stone-400"
                      : "border-[#e0d2bc]/90 bg-[#fffaf4] hover:border-[#c5b089] hover:bg-[#f7efe3]",
                  ].join(" ")}
                >
                  <MoodOwlIcon moodId={option.id} sizePx={44} />
                  <span className="lj-read-caption font-medium text-stone-800">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="lj-read-desc block font-medium text-stone-700" htmlFor="journal-activity">
          今日はどんな一日でしたか？
        </label>
        <select
          id="journal-activity"
          value={activity}
          onChange={(e) => setActivity(e.target.value as ActivityId)}
          className="w-full rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] px-3 py-2 text-sm text-[#3f3428] outline-none ring-[#c5b089]/50 focus:ring-2"
        >
          {activityOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        </div>

        <DiaryTagInput
          value={tagInput}
          onChange={setTagInput}
          disabled={saving || loadingEdit || processingPhoto}
        />

        <JournalFootprintActions
          isEditing={Boolean(editingId)}
          acornBalance={acornBalance}
          preferDraft={preferDraftMode}
          saving={saving}
          processingPhoto={processingPhoto}
          onSaveDraft={() => void saveServerDraft()}
          onFootprintSave={() => void saveEntry("preview")}
          onEditSave={() => void saveEntry("preview")}
          onEditSaveAndReturn={() => void saveEntry("returnTo")}
          onCancelEdit={cancelEditingAndReturnToCalendar}
          cancelEditDisabled={deletingId === editingId || navigatingToCalendar}
        />
      </form>
      )}

      {draftNotice ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{draftNotice}</p>
      ) : null}
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <DonguriFootprintModal
        open={serverDraftDialog === "resume"}
        title={DONGURI_DRAFT_RESUME_TITLE}
        body={DONGURI_DRAFT_RESUME_BODY}
        onDismiss={() => setServerDraftDialog("none")}
        actions={[
          {
            label: BTN_CONTINUE_DRAFT,
            variant: "primary",
            onClick: () => applyPendingServerDraft(),
          },
          {
            label: BTN_REWRITE_DRAFT,
            variant: "secondary",
            onClick: () => setServerDraftDialog("resetConfirm"),
          },
          {
            label: BTN_CLOSE,
            variant: "ghost",
            onClick: () => {
              setPendingServerDraft(null);
              setServerDraftDialog("none");
            },
          },
        ]}
      />
      <DonguriFootprintModal
        open={serverDraftDialog === "resetConfirm"}
        title={BTN_REWRITE_DRAFT}
        body={DONGURI_DRAFT_RESET_CONFIRM}
        onDismiss={() => setServerDraftDialog("resume")}
        actions={[
          {
            label: "書き直す",
            variant: "primary",
            onClick: () => {
              void (async () => {
                try {
                  const qs = new URLSearchParams({
                    dateKey: entryDate,
                    profileId: effectiveProfileId,
                  });
                  await fetch(`/api/journal/drafts?${qs.toString()}`, {
                    method: "DELETE",
                    credentials: "same-origin",
                  });
                } catch {
                  // ignore
                }
                setPendingServerDraft(null);
                setServerDraftDialog("none");
                resetJournalFormState();
                if (dateFromQuery && isValidDateInput(dateFromQuery)) {
                  setEntryDate(dateFromQuery);
                }
              })();
            },
          },
          {
            label: BTN_CLOSE,
            variant: "ghost",
            onClick: () => setServerDraftDialog("resume"),
          },
        ]}
      />
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<OwlSuspenseFallback label="読み込んでいます…" />}>
      <JournalPageContent />
    </Suspense>
  );
}
