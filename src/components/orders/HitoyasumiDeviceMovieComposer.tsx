"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DonguriFootprintModal } from "@/components/loghouse/DonguriFootprintModal";
import {
  MoriLogBgmPicker,
  type MoriLogBgmPickerHandle,
} from "@/components/journal/MoriLogBgmPicker";
import { HitoyasumiSoftVideoPlayer } from "@/components/orders/HitoyasumiSoftVideoPlayer";
import {
  composeMoriLogDeviceMovie,
  inspectMoriLogDeviceMovieSource,
  MoriLogDeviceMovieError,
  resolveDeviceMovieTrim,
  type ComposeMoriLogDeviceMovieResult,
  type MoriLogDeviceMovieAudioMode,
  type MoriLogDeviceMovieSourceProbe,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovie";
import {
  confirmMoriLogDeviceMovieOnServer,
  fetchMoriLogDeviceMovieDonguriStatus,
  type MoriLogDeviceMovieDonguriStatus,
} from "@/lib/journal/moriLog/confirmMoriLogDeviceMovieClient";
import {
  DEVICE_MOVIE_AUDIO_BGM,
  DEVICE_MOVIE_AUDIO_MUTE,
  DEVICE_MOVIE_AUDIO_ORIGINAL,
  DEVICE_MOVIE_BACK,
  DEVICE_MOVIE_BGM_LABEL,
  DEVICE_MOVIE_BGM_PICK_HEADING,
  DEVICE_MOVIE_BGM_PICK_HINT,
  DEVICE_MOVIE_BGM_REQUIRED,
  DEVICE_MOVIE_BTN_BACK_ENTRANCE,
  DEVICE_MOVIE_BTN_CONFIRM_LATER,
  DEVICE_MOVIE_BTN_CREATE_FREE,
  DEVICE_MOVIE_BTN_CREATE_PAID,
  DEVICE_MOVIE_BTN_RETRY_CONFIRM,
  DEVICE_MOVIE_BTN_TWEAK,
  DEVICE_MOVIE_BTN_TWEAK_SHORTAGE,
  DEVICE_MOVIE_BTN_VIEW_DONGURI,
  DEVICE_MOVIE_CONFIRMING,
  DEVICE_MOVIE_DEFAULT_TITLE,
  DEVICE_MOVIE_DONE_BODY,
  DEVICE_MOVIE_DONE_TITLE,
  DEVICE_MOVIE_DONE_TO_BROWSE,
  DEVICE_MOVIE_DRAFT_BADGE,
  DEVICE_MOVIE_DRAFT_BGM_LOCKED,
  DEVICE_MOVIE_DRAFT_NEW,
  DEVICE_MOVIE_DRAFT_REPLACE_BODY,
  DEVICE_MOVIE_DRAFT_REPLACE_CANCEL,
  DEVICE_MOVIE_DRAFT_REPLACE_CONFIRM,
  DEVICE_MOVIE_DRAFT_REPLACE_TITLE,
  DEVICE_MOVIE_DRAFT_RESUME,
  DEVICE_MOVIE_DRAFT_SAVE_FAIL,
  DEVICE_MOVIE_DRAFT_SAVING,
  DEVICE_MOVIE_FIRST_FREE_BODY,
  DEVICE_MOVIE_NEXT,
  DEVICE_MOVIE_PAID_BODY,
  DEVICE_MOVIE_PAGE_TITLE,
  DEVICE_MOVIE_PHASE_C_NOTE,
  DEVICE_MOVIE_PICK_VIDEO,
  DEVICE_MOVIE_PREVIEW_BUSY,
  DEVICE_MOVIE_PREVIEW_MAKE,
  DEVICE_MOVIE_PREVIEW_READY,
  DEVICE_MOVIE_RETRY,
  DEVICE_MOVIE_SAVE_FAIL,
  DEVICE_MOVIE_SAVING,
  DEVICE_MOVIE_SHORTAGE_BODY,
  DEVICE_MOVIE_SHORTAGE_TITLE,
  DEVICE_MOVIE_STEP1_HINT,
  DEVICE_MOVIE_STEP1_TITLE,
  DEVICE_MOVIE_STEP2_HINT,
  DEVICE_MOVIE_STEP2_TITLE,
  DEVICE_MOVIE_STEP3_TITLE,
  DEVICE_MOVIE_STEP4_HINT,
  DEVICE_MOVIE_STEP4_TITLE,
  DEVICE_MOVIE_TEMPLATE_LABEL,
  DEVICE_MOVIE_TITLE_MAX_CHARS,
  DEVICE_MOVIE_TRIM_DURATION,
  DEVICE_MOVIE_TRIM_SHORT_HINT,
  DEVICE_MOVIE_TRIM_START,
  DEVICE_MOVIE_UNCERTAIN_BODY,
  DEVICE_MOVIE_UNCERTAIN_TITLE,
  deviceMovieErrorUserMessage,
} from "@/lib/journal/moriLog/deviceMovieComposerCopy";
import { captureVideoPosterObjectUrl } from "@/lib/journal/moriLog/captureVideoPosterFrame";
import { listDeviceMovieBgmTracks } from "@/lib/journal/moriLog/deviceMovieBgmAudio";
import { getDeviceMovieProjectorBgmTrack } from "@/lib/journal/moriLog/deviceMovieProjectorBgmCatalog";
import {
  clearDeviceMovieDraft,
  deviceMovieDonguriPathForDraft,
  draftToComposeResult,
  getDeviceMovieDraft,
  getDeviceMovieDraftById,
  getDeviceMovieDraftMeta,
  isDeviceMovieDraftReplaceRequiredError,
  saveDeviceMovieDraft,
  type DeviceMovieDraftMeta,
} from "@/lib/journal/moriLog/deviceMovieDraft";
import {
  deviceMovieLocalDateKey,
  pickDeviceMovieDecorationVariant,
  resolveDeviceMovieDecorationVariant,
  type DeviceMovieDecorationVariant,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";
import { formatHitoyasumiCreatedAt } from "@/lib/journal/moriLog/hitoyasumiMedia";
import {
  discardPendingDeviceMovie,
  saveDeviceMovieToMoriLog,
  setDeviceMovieBillingStatus,
} from "@/lib/journal/moriLog/saveDeviceMovieToMoriLog";
import type { MoriLogMedia } from "@/lib/journal/moriLog/moriLogMedia";
import { writeDonguriBalanceHint } from "@/lib/loghouse/donguriBalanceHint";

type Step = "select" | "trim" | "audio" | "title" | "preview" | "uncertain" | "done";
type AudioChoice = MoriLogDeviceMovieAudioMode;

type Props = {
  profileId: string;
  /** URL の draftId。一致すれば自動で下書き再開 */
  initialDraftId?: string | null;
  /** 開発確認用。指定時は新規セッションでもこの小物に固定 */
  forceDecorationVariant?: DeviceMovieDecorationVariant | null;
  onClose: () => void;
  onSaved?: (media: MoriLogMedia) => void;
  onRefreshList?: () => void;
};

export function HitoyasumiDeviceMovieComposer({
  profileId,
  initialDraftId = null,
  forceDecorationVariant = null,
  onClose,
  onSaved,
  onRefreshList,
}: Props) {
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  /** 未再生時の真っ黒対策（選択動画の先頭コマ） */
  const [sourcePosterUrl, setSourcePosterUrl] = useState<string | null>(null);
  const [probe, setProbe] = useState<MoriLogDeviceMovieSourceProbe | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  const [startSec, setStartSec] = useState(0);
  const [durationSec, setDurationSec] = useState(10);
  const [audioMode, setAudioMode] = useState<AudioChoice>("original");
  const [bgmId, setBgmId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [resumedFromDraft, setResumedFromDraft] = useState(false);
  const [encodeBusy, setEncodeBusy] = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const [result, setResult] = useState<ComposeMoriLogDeviceMovieResult | null>(null);
  const [movieUrl, setMovieUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const [donguriStatus, setDonguriStatus] = useState<MoriLogDeviceMovieDonguriStatus | null>(
    null,
  );
  const [statusBusy, setStatusBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shortageOpen, setShortageOpen] = useState(false);
  const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);
  const [confirmedMedia, setConfirmedMedia] = useState<MoriLogMedia | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [draftGateMeta, setDraftGateMeta] = useState<DeviceMovieDraftMeta | null>(null);
  const [draftGatePosterUrl, setDraftGatePosterUrl] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [hideDraftGate, setHideDraftGate] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const saveLockRef = useRef(false);
  const draftBootRef = useRef(false);
  /** モーダル開閉直後でも確実に参照できる下書き ID */
  const savedDraftIdRef = useRef<string | null>(null);
  /** 入れ替え確認後に続ける処理 */
  const replaceIntentRef = useRef<"shortage" | "donguri" | null>(null);
  /** 作品セッション中に固定する装飾（再描画・再プレビューで変えない） */
  const decorationVariantRef = useRef<DeviceMovieDecorationVariant | null>(null);
  const createdDateKeyRef = useRef<string | null>(null);
  const bgmPickerRef = useRef<MoriLogBgmPickerHandle | null>(null);

  const deviceMovieBgmTracks = useMemo(() => listDeviceMovieBgmTracks(), []);
  const selectedBgmName = useMemo(() => {
    if (audioMode !== "bgm") return null;
    const fromResult = result?.bgmName?.trim();
    if (fromResult) return fromResult;
    const id = (result?.bgmId ?? bgmId ?? "").trim();
    return getDeviceMovieProjectorBgmTrack(id)?.title ?? null;
  }, [audioMode, bgmId, result]);

  const invalidatePreview = useCallback(() => {
    setResult(null);
    setEncodeError(null);
    setSaveError(null);
  }, []);

  const stopBgmPreview = useCallback(() => {
    bgmPickerRef.current?.stopPreview();
  }, []);

  const ensureSessionTemplateMeta = useCallback(() => {
    if (forceDecorationVariant) {
      decorationVariantRef.current = forceDecorationVariant;
    } else if (!decorationVariantRef.current) {
      decorationVariantRef.current = pickDeviceMovieDecorationVariant();
    }
    if (!createdDateKeyRef.current) {
      createdDateKeyRef.current = deviceMovieLocalDateKey();
    }
  }, [forceDecorationVariant]);

  const beginNewTemplateSession = useCallback(() => {
    decorationVariantRef.current =
      forceDecorationVariant ?? pickDeviceMovieDecorationVariant();
    createdDateKeyRef.current = deviceMovieLocalDateKey();
  }, [forceDecorationVariant]);

  useEffect(() => {
    if (!forceDecorationVariant) return;
    decorationVariantRef.current = forceDecorationVariant;
    invalidatePreview();
  }, [forceDecorationVariant, invalidatePreview]);

  useEffect(() => {
    if (!file) {
      setSourceUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ポスターは onPick 側で先行取得。sourceUrl 変化だけでの二重キャプチャはしない。

  useEffect(() => {
    if (!draftGatePosterUrl) return;
    return () => URL.revokeObjectURL(draftGatePosterUrl);
  }, [draftGatePosterUrl]);

  const applyDraftToComposer = useCallback(
    (loaded: {
      meta: DeviceMovieDraftMeta;
      movieBlob: Blob;
      posterBlob: Blob;
    }) => {
      setTitle(loaded.meta.title);
      setAudioMode(loaded.meta.audioMode);
      setBgmId(loaded.meta.bgmId ?? null);
      setResumedFromDraft(true);
      setResult(draftToComposeResult(loaded));
      decorationVariantRef.current = resolveDeviceMovieDecorationVariant(
        loaded.meta.templateDecorationVariant,
      );
      createdDateKeyRef.current =
        loaded.meta.createdDateKey?.trim() || deviceMovieLocalDateKey();
      setSavedDraftId(loaded.meta.id);
      savedDraftIdRef.current = loaded.meta.id;
      setHideDraftGate(true);
      setStep("preview");
      setSaveError(null);
      setDraftError(null);
    },
    [],
  );

  useEffect(() => {
    if (draftBootRef.current) return;
    draftBootRef.current = true;
    void (async () => {
      try {
        if (initialDraftId) {
          const loaded = await getDeviceMovieDraftById(profileId, initialDraftId);
          if (loaded) {
            applyDraftToComposer(loaded);
            return;
          }
        }
        const loaded = await getDeviceMovieDraft(profileId);
        if (!loaded) return;
        setDraftGateMeta(loaded.meta);
        setDraftGatePosterUrl(URL.createObjectURL(loaded.posterBlob));
        setSavedDraftId(loaded.meta.id);
        savedDraftIdRef.current = loaded.meta.id;
      } catch {
        // ignore boot errors
      }
    })();
  }, [applyDraftToComposer, initialDraftId, profileId]);

  useEffect(() => {
    if (!result) {
      setMovieUrl(null);
      setPosterUrl(null);
      return;
    }
    const m = URL.createObjectURL(result.movieBlob);
    const p = URL.createObjectURL(result.posterBlob);
    setMovieUrl(m);
    setPosterUrl(p);
    return () => {
      URL.revokeObjectURL(m);
      URL.revokeObjectURL(p);
    };
  }, [result]);

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  const resolvedTitle = title.trim() || DEVICE_MOVIE_DEFAULT_TITLE;
  const firstFree = donguriStatus?.firstFreeAvailable !== false;
  const paidCost = donguriStatus?.paidCost ?? 2;

  const trimPreview = useMemo(() => {
    if (!probe) return null;
    return resolveDeviceMovieTrim({
      sourceDurationSec: probe.durationSec,
      startSec,
      durationSec,
    });
  }, [durationSec, probe, startSec]);

  const shortSource = Boolean(probe && probe.durationSec <= 10);

  const refreshDonguriStatus = useCallback(async () => {
    setStatusBusy(true);
    try {
      const status = await fetchMoriLogDeviceMovieDonguriStatus(profileId);
      setDonguriStatus(status);
      return status;
    } finally {
      setStatusBusy(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (step === "preview") {
      void refreshDonguriStatus();
    }
  }, [refreshDonguriStatus, step]);

  useEffect(() => {
    return () => {
      stopBgmPreview();
    };
  }, [stopBgmPreview]);

  useEffect(() => {
    if (step !== "audio") {
      stopBgmPreview();
    }
  }, [step, stopBgmPreview]);

  const onPick = useCallback(async (next: File | null) => {
    setFile(next);
    setProbe(null);
    setSelectError(null);
    setResult(null);
    setEncodeError(null);
    setSaveError(null);
    setPendingMediaId(null);
    setResumedFromDraft(false);
    setSourcePosterUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (!next) return;

    // 選択ジェスチャー内でポスター生成を即開始（iPhone の後追い capture 失敗対策）
    const earlyUrl = URL.createObjectURL(next);
    void captureVideoPosterObjectUrl(earlyUrl)
      .then((poster) => {
        if (poster) {
          setSourcePosterUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return poster;
          });
        }
      })
      .finally(() => {
        URL.revokeObjectURL(earlyUrl);
      });

    try {
      const info = await inspectMoriLogDeviceMovieSource(next);
      setProbe(info);
      setStartSec(0);
      const useDur = Math.min(10, Math.max(3, info.durationSec));
      setDurationSec(useDur);
    } catch (error) {
      if (error instanceof MoriLogDeviceMovieError) {
        setSelectError(deviceMovieErrorUserMessage(error.code, error.message));
      } else {
        setSelectError(deviceMovieErrorUserMessage("METADATA_LOAD_FAILED"));
      }
    }
  }, []);

  const runEncode = useCallback(async () => {
    if (!file || !probe || encodeBusy) return;
    if (audioMode === "bgm" && !(bgmId ?? "").trim()) {
      setEncodeError(DEVICE_MOVIE_BGM_REQUIRED);
      return;
    }
    stopBgmPreview();
    setEncodeBusy(true);
    setEncodeError(null);
    setResult(null);
    setEncodeProgress(0);
    setSaveError(null);
    const ac = new AbortController();
    setAbortController(ac);
    ensureSessionTemplateMeta();
    try {
      const out = await composeMoriLogDeviceMovie({
        source: file,
        startSec,
        durationSec,
        audioMode,
        bgmId: audioMode === "bgm" ? bgmId : null,
        title: title.trim() || DEVICE_MOVIE_DEFAULT_TITLE,
        createdDateKey: createdDateKeyRef.current ?? deviceMovieLocalDateKey(),
        templateDecorationVariant:
          decorationVariantRef.current ?? pickDeviceMovieDecorationVariant(),
        signal: ac.signal,
        onProgress: setEncodeProgress,
      });
      setResult(out);
      if (out.bgmId) setBgmId(out.bgmId);
      setEncodeProgress(1);
      setStep("preview");
    } catch (error) {
      if (error instanceof MoriLogDeviceMovieError) {
        setEncodeError(deviceMovieErrorUserMessage(error.code, error.message));
      } else {
        setEncodeError(deviceMovieErrorUserMessage("ENCODE_FAILED"));
      }
    } finally {
      setEncodeBusy(false);
      setAbortController(null);
    }
  }, [
    audioMode,
    bgmId,
    durationSec,
    encodeBusy,
    ensureSessionTemplateMeta,
    file,
    probe,
    startSec,
    stopBgmPreview,
    title,
  ]);

  const resetToSelect = useCallback(() => {
    abortController?.abort();
    stopBgmPreview();
    setStep("select");
    setFile(null);
    setProbe(null);
    setResult(null);
    setEncodeError(null);
    setSelectError(null);
    setTitle("");
    setAudioMode("original");
    setBgmId(null);
    setResumedFromDraft(false);
    setSaveError(null);
    setPendingMediaId(null);
    setConfirmedMedia(null);
    saveLockRef.current = false;
    // 「作り直す」でも同じ作品セッションとして装飾・作成日は維持する
  }, [abortController, stopBgmPreview]);

  const finishConfirmed = useCallback(
    (media: MoriLogMedia, balance: number) => {
      writeDonguriBalanceHint(profileId, balance);
      void clearDeviceMovieDraft(profileId);
      setConfirmedMedia(media);
      setPendingMediaId(null);
      setSavedDraftId(null);
      savedDraftIdRef.current = null;
      setDraftGateMeta(null);
      setStep("done");
      onRefreshList?.();
    },
    [onRefreshList, profileId],
  );

  const persistDraftFromPreview = useCallback(
    async (opts?: { replaceExisting?: boolean }) => {
      if (!result) throw new Error("preview result missing");
      const meta = await saveDeviceMovieDraft({
        profileId,
        title: resolvedTitle,
        audioMode,
        result,
        draftId: savedDraftIdRef.current ?? savedDraftId ?? undefined,
        replaceExisting: opts?.replaceExisting,
      });
      setSavedDraftId(meta.id);
      savedDraftIdRef.current = meta.id;
      setDraftGateMeta(meta);
      return meta;
    },
    [audioMode, profileId, resolvedTitle, result, savedDraftId],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as Window & {
      __deviceMovieComposer?: {
        step: Step;
        decoration: DeviceMovieDecorationVariant | null;
        draftId: string | null;
        result: ComposeMoriLogDeviceMovieResult | null;
        audioMode: AudioChoice;
        bgmId: string | null;
        confirmedMediaId: string | null;
      };
      __deviceMovieComposerSaveDraft?: () => Promise<{ id: string; decoration: string | null }>;
    };
    w.__deviceMovieComposer = {
      step,
      decoration: decorationVariantRef.current,
      draftId: savedDraftIdRef.current,
      result,
      audioMode,
      bgmId,
      confirmedMediaId: confirmedMedia?.id ?? null,
    };
    w.__deviceMovieComposerSaveDraft = async () => {
      const meta = await persistDraftFromPreview();
      return {
        id: meta.id,
        decoration: meta.templateDecorationVariant ?? decorationVariantRef.current,
      };
    };
    return () => {
      delete w.__deviceMovieComposer;
      delete w.__deviceMovieComposerSaveDraft;
    };
  }, [audioMode, bgmId, confirmedMedia, persistDraftFromPreview, result, step]);

  const openShortageAfterDraftSave = useCallback(async () => {
    setDraftError(null);
    setDraftBusy(true);
    try {
      const meta = await persistDraftFromPreview();
      savedDraftIdRef.current = meta.id;
      setSavedDraftId(meta.id);
      // 保存成功後だけ不足モーダルを開く（失敗時は「保存しました」扱いしない）
      setShortageOpen(true);
    } catch (error) {
      if (isDeviceMovieDraftReplaceRequiredError(error)) {
        replaceIntentRef.current = "shortage";
        setReplaceConfirmOpen(true);
        return;
      }
      setDraftError(DEVICE_MOVIE_DRAFT_SAVE_FAIL);
    } finally {
      setDraftBusy(false);
    }
  }, [persistDraftFromPreview]);

  const confirmReplaceDraft = useCallback(async () => {
    const intent = replaceIntentRef.current;
    replaceIntentRef.current = null;
    setReplaceConfirmOpen(false);
    setDraftError(null);
    setDraftBusy(true);
    try {
      const meta = await persistDraftFromPreview({ replaceExisting: true });
      if (intent === "donguri") {
        window.location.assign(deviceMovieDonguriPathForDraft(meta.id));
        return;
      }
      setShortageOpen(true);
    } catch {
      setDraftError(DEVICE_MOVIE_DRAFT_SAVE_FAIL);
    } finally {
      setDraftBusy(false);
    }
  }, [persistDraftFromPreview]);

  const cancelReplaceDraft = useCallback(() => {
    replaceIntentRef.current = null;
    setReplaceConfirmOpen(false);
  }, []);

  const runConfirmForMediaId = useCallback(
    async (mediaId: string) => {
      const outcome = await confirmMoriLogDeviceMovieOnServer({
        profileId,
        mediaId,
      });

      if (outcome.kind === "ok") {
        const confirmed = await setDeviceMovieBillingStatus({
          mediaId,
          profileId,
          billingStatus: "confirmed",
        });
        if (!confirmed) {
          setSaveError(DEVICE_MOVIE_SAVE_FAIL);
          setStep("uncertain");
          return;
        }
        finishConfirmed(confirmed, outcome.data.balance);
        return;
      }

      if (outcome.kind === "insufficient") {
        await discardPendingDeviceMovie({ mediaId, profileId });
        setPendingMediaId(null);
        setStep("preview");
        setSaveError(null);
        await openShortageAfterDraftSave();
        return;
      }

      if (outcome.kind === "clear_failure") {
        await discardPendingDeviceMovie({ mediaId, profileId });
        setPendingMediaId(null);
        setSaveError(
          outcome.message ||
            "確定できませんでした。不完全なデータは残していません。",
        );
        setStep("preview");
        return;
      }

      setPendingMediaId(mediaId);
      setSaveError(null);
      setStep("uncertain");
    },
    [finishConfirmed, openShortageAfterDraftSave, profileId],
  );

  const confirmAndCharge = useCallback(async () => {
    if (!result || saveBusy || saveLockRef.current || draftBusy) return;
    saveLockRef.current = true;
    setSaveBusy(true);
    setSaveError(null);
    setDraftError(null);

    try {
      const status = (await refreshDonguriStatus()) ?? donguriStatus;
      const isFirstFree = status?.firstFreeAvailable !== false;
      if (!isFirstFree) {
        const balance = status?.balance ?? 0;
        const cost = status?.paidCost ?? paidCost;
        if (balance < cost) {
          await openShortageAfterDraftSave();
          return;
        }
      }

      const media = await saveDeviceMovieToMoriLog({
        profileId,
        title: resolvedTitle,
        result,
        bgmId: result.audioMode === "bgm" ? (result.bgmId ?? bgmId) : null,
        audioMode: result.audioMode,
        mediaId: pendingMediaId ?? undefined,
      });
      setPendingMediaId(media.id);
      await runConfirmForMediaId(media.id);
    } catch {
      setSaveError(DEVICE_MOVIE_SAVE_FAIL);
      setStep("preview");
    } finally {
      setSaveBusy(false);
      saveLockRef.current = false;
    }
  }, [
    bgmId,
    donguriStatus,
    draftBusy,
    openShortageAfterDraftSave,
    paidCost,
    pendingMediaId,
    profileId,
    refreshDonguriStatus,
    resolvedTitle,
    result,
    runConfirmForMediaId,
    saveBusy,
  ]);

  const resumeDraftFromGate = useCallback(async () => {
    setDraftBusy(true);
    setDraftError(null);
    try {
      const loaded = await getDeviceMovieDraft(profileId);
      if (!loaded) {
        setDraftError(DEVICE_MOVIE_DRAFT_SAVE_FAIL);
        return;
      }
      applyDraftToComposer(loaded);
    } catch {
      setDraftError(DEVICE_MOVIE_DRAFT_SAVE_FAIL);
    } finally {
      setDraftBusy(false);
    }
  }, [applyDraftToComposer, profileId]);

  const startNewFromGate = useCallback(() => {
    // 既存下書きのIDを引き継がない（入れ替え確認なしに上書きしない）
    setHideDraftGate(true);
    setSavedDraftId(null);
    savedDraftIdRef.current = null;
    setDraftError(null);
    setResumedFromDraft(false);
    setBgmId(null);
    setAudioMode("original");
    beginNewTemplateSession();
  }, [beginNewTemplateSession]);

  const goToDonguriWithDraft = useCallback(async () => {
    setDraftError(null);
    let id = (savedDraftIdRef.current ?? savedDraftId ?? "").trim();
    if (!id && result) {
      try {
        setDraftBusy(true);
        const meta = await persistDraftFromPreview();
        id = meta.id;
      } catch (error) {
        if (isDeviceMovieDraftReplaceRequiredError(error)) {
          replaceIntentRef.current = "donguri";
          setReplaceConfirmOpen(true);
          setDraftBusy(false);
          return;
        }
        // 保存失敗時は遷移しない・「残しました」扱いしない
        setDraftError(DEVICE_MOVIE_DRAFT_SAVE_FAIL);
        setDraftBusy(false);
        return;
      } finally {
        setDraftBusy(false);
      }
    }
    if (!id) {
      const meta = await getDeviceMovieDraftMeta(profileId);
      id = (meta?.id ?? "").trim();
    }
    if (!id) {
      setDraftError(DEVICE_MOVIE_DRAFT_SAVE_FAIL);
      return;
    }
    setShortageOpen(false);
    // 作成画面のクライアント状態に留まらないよう、フル遷移にする
    window.location.assign(deviceMovieDonguriPathForDraft(id));
  }, [persistDraftFromPreview, profileId, result, savedDraftId]);

  const retryUncertainConfirm = useCallback(async () => {
    if (!pendingMediaId || saveBusy || saveLockRef.current) return;
    saveLockRef.current = true;
    setSaveBusy(true);
    setSaveError(null);
    try {
      await runConfirmForMediaId(pendingMediaId);
    } finally {
      setSaveBusy(false);
      saveLockRef.current = false;
    }
  }, [pendingMediaId, runConfirmForMediaId, saveBusy]);

  const goToBrowseFromDone = useCallback(() => {
    if (confirmedMedia) {
      onSaved?.(confirmedMedia);
    } else {
      onClose();
    }
  }, [confirmedMedia, onClose, onSaved]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-1 py-2 text-sm text-[#2f2a24]">
      <header className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/92 px-4 py-3 shadow-sm">
        <p className="text-[11px] font-medium tracking-wide text-[#8a7660]">
          {DEVICE_MOVIE_TEMPLATE_LABEL}
        </p>
        <h1 className="mt-1 text-base font-semibold text-[#3f3428]">
          {DEVICE_MOVIE_PAGE_TITLE}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs text-[#6a5846] underline-offset-2 hover:underline"
        >
          {DEVICE_MOVIE_BTN_BACK_ENTRANCE}
        </button>
      </header>

      {step === "select" ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          {draftGateMeta && !hideDraftGate ? (
            <div className="mb-4 space-y-3 rounded-xl border border-[#e4d5c0] bg-[#fffaf2] px-3 py-3">
              <div className="flex gap-3">
                {draftGatePosterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draftGatePosterUrl}
                    alt=""
                    className="h-20 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-[#efe6d6] text-[10px] text-[#8a7660]">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-full bg-[#3f5f4c]/15 px-2 py-0.5 text-[10px] font-semibold text-[#3f5f4c]">
                    {DEVICE_MOVIE_DRAFT_BADGE}
                  </span>
                  <p className="mt-1 truncate text-sm font-semibold text-[#3f3428]">
                    {draftGateMeta.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8a7660]">
                    {formatHitoyasumiCreatedAt(draftGateMeta.updatedAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={draftBusy}
                onClick={() => void resumeDraftFromGate()}
                className="min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {draftBusy ? DEVICE_MOVIE_DRAFT_SAVING : DEVICE_MOVIE_DRAFT_RESUME}
              </button>
              <button
                type="button"
                disabled={draftBusy}
                onClick={startNewFromGate}
                className="min-h-11 w-full rounded-xl border border-[#c4b49a] px-3 text-sm disabled:opacity-40"
              >
                {DEVICE_MOVIE_DRAFT_NEW}
              </button>
              {draftError ? (
                <p className="whitespace-pre-wrap text-xs text-[#8a3b32]" role="alert">
                  {draftError}
                </p>
              ) : null}
            </div>
          ) : null}

          {(!draftGateMeta || hideDraftGate) ? (
            <>
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_STEP1_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#6a5b4a]">{DEVICE_MOVIE_STEP1_HINT}</p>
          <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#c4b49a] bg-white px-3 text-sm text-[#3f3428]">
            {DEVICE_MOVIE_PICK_VIDEO}
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
            />
          </label>
          {file ? (
            <p className="mt-2 truncate text-xs text-[#6a5b4a]">{file.name}</p>
          ) : null}
          {sourceUrl ? (
            <HitoyasumiSoftVideoPlayer
              src={sourceUrl}
              posterUrl={sourcePosterUrl}
              autoPrime
              className="mt-3 aspect-video w-full rounded-xl"
              label="選んだ動画を再生"
            />
          ) : null}
          {file && !probe && !selectError ? (
            <p className="mt-2 text-xs text-[#6a5b4a]">動画情報を確認しています…</p>
          ) : null}
          {selectError ? (
            <p
              className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]"
              role="alert"
            >
              {selectError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!file || !probe || Boolean(selectError)}
            onClick={() => setStep("trim")}
            className="mt-4 min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {DEVICE_MOVIE_NEXT}
          </button>
            </>
          ) : null}
        </section>
      ) : null}

      {step === "trim" && probe ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_STEP2_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#6a5b4a]">{DEVICE_MOVIE_STEP2_HINT}</p>
          {shortSource ? (
            <p className="mt-2 text-xs text-[#6a5b4a]">
              {DEVICE_MOVIE_TRIM_SHORT_HINT}
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-[#5c4a3a]">
                {DEVICE_MOVIE_TRIM_START}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, probe.durationSec - 3)}
                  step={0.1}
                  value={startSec}
                  onChange={(e) => {
                    setStartSec(Number(e.target.value));
                    invalidatePreview();
                  }}
                  className="mt-1 w-full"
                />
                <span className="mt-1 block">{startSec.toFixed(1)}s</span>
              </label>
              <label className="block text-xs text-[#5c4a3a]">
                {DEVICE_MOVIE_TRIM_DURATION}
                <input
                  type="range"
                  min={3}
                  max={10}
                  step={0.1}
                  value={durationSec}
                  onChange={(e) => {
                    setDurationSec(Number(e.target.value));
                    invalidatePreview();
                  }}
                  className="mt-1 w-full"
                />
                <span className="mt-1 block">{durationSec.toFixed(1)}s</span>
              </label>
            </div>
          )}
          {trimPreview ? (
            <p className="mt-2 text-xs text-[#6a5b4a]">
              使用範囲: {trimPreview.startSec.toFixed(1)}s —{" "}
              {(trimPreview.startSec + trimPreview.durationSec).toFixed(1)}s
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setStep("audio")}
              className="min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white"
            >
              {DEVICE_MOVIE_NEXT}
            </button>
            <button
              type="button"
              onClick={() => setStep("select")}
              className="min-h-11 w-full rounded-xl border border-[#c4b49a] px-3 text-sm"
            >
              {DEVICE_MOVIE_BACK}
            </button>
          </div>
        </section>
      ) : null}

      {step === "audio" ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_STEP3_TITLE}</h2>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setAudioMode("original");
                invalidatePreview();
                stopBgmPreview();
              }}
              className={`min-h-11 rounded-xl px-3 text-left text-sm ${
                audioMode === "original"
                  ? "bg-[#3f5f4c] text-white"
                  : "border border-[#c4b49a] bg-white"
              }`}
            >
              {DEVICE_MOVIE_AUDIO_ORIGINAL}
            </button>
            <button
              type="button"
              onClick={() => {
                setAudioMode("bgm");
                invalidatePreview();
              }}
              className={`min-h-11 rounded-xl px-3 text-left text-sm ${
                audioMode === "bgm"
                  ? "bg-[#3f5f4c] text-white"
                  : "border border-[#c4b49a] bg-white"
              }`}
            >
              {DEVICE_MOVIE_AUDIO_BGM}
            </button>
            <button
              type="button"
              onClick={() => {
                setAudioMode("mute");
                invalidatePreview();
                stopBgmPreview();
              }}
              className={`min-h-11 rounded-xl px-3 text-left text-sm ${
                audioMode === "mute"
                  ? "bg-[#3f5f4c] text-white"
                  : "border border-[#c4b49a] bg-white"
              }`}
            >
              {DEVICE_MOVIE_AUDIO_MUTE}
            </button>
          </div>

          {audioMode === "bgm" ? (
            <div className="mt-4">
              <MoriLogBgmPicker
                ref={bgmPickerRef}
                value={bgmId}
                tracks={deviceMovieBgmTracks}
                heading={DEVICE_MOVIE_BGM_PICK_HEADING}
                hint={DEVICE_MOVIE_BGM_PICK_HINT}
                onChange={(id) => {
                  setBgmId(id);
                  invalidatePreview();
                }}
              />
              {!bgmId ? (
                <p className="mt-2 text-xs text-[#8a3b32]" role="status">
                  {DEVICE_MOVIE_BGM_REQUIRED}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={audioMode === "bgm" && !bgmId}
              onClick={() => {
                stopBgmPreview();
                if (audioMode === "bgm" && !bgmId) {
                  setEncodeError(DEVICE_MOVIE_BGM_REQUIRED);
                  return;
                }
                setStep("title");
              }}
              className="min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {DEVICE_MOVIE_NEXT}
            </button>
            <button
              type="button"
              onClick={() => {
                stopBgmPreview();
                setStep("trim");
              }}
              className="min-h-11 w-full rounded-xl border border-[#c4b49a] px-3 text-sm"
            >
              {DEVICE_MOVIE_BACK}
            </button>
          </div>
        </section>
      ) : null}

      {step === "title" ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_STEP4_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#6a5b4a]">{DEVICE_MOVIE_STEP4_HINT}</p>
          <input
            type="text"
            value={title}
            maxLength={DEVICE_MOVIE_TITLE_MAX_CHARS}
            placeholder={DEVICE_MOVIE_DEFAULT_TITLE}
            onChange={(e) => {
              setTitle(e.target.value.slice(0, DEVICE_MOVIE_TITLE_MAX_CHARS));
              invalidatePreview();
            }}
            className="mt-3 w-full rounded-xl border border-[#d9cbb8] bg-white px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-right text-[11px] text-[#8a7660]">
            {title.length}/{DEVICE_MOVIE_TITLE_MAX_CHARS}
          </p>
          {audioMode === "bgm" && !bgmId ? (
            <p className="mt-3 text-xs text-[#8a3b32]" role="alert">
              {DEVICE_MOVIE_BGM_REQUIRED}
            </p>
          ) : null}
          {encodeError ? (
            <p
              className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]"
              role="alert"
            >
              {encodeError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={
                encodeBusy || !file || (audioMode === "bgm" && !bgmId)
              }
              onClick={() => void runEncode()}
              className="min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {encodeBusy ? DEVICE_MOVIE_PREVIEW_BUSY : DEVICE_MOVIE_PREVIEW_MAKE}
            </button>
            {encodeBusy ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#6a5b4a]">
                  進捗 {(encodeProgress * 100).toFixed(0)}%
                </span>
                {abortController ? (
                  <button
                    type="button"
                    onClick={() => abortController.abort()}
                    className="text-xs underline"
                  >
                    キャンセル
                  </button>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              disabled={encodeBusy}
              onClick={() => setStep("audio")}
              className="min-h-11 w-full rounded-xl border border-[#c4b49a] px-3 text-sm"
            >
              {DEVICE_MOVIE_BACK}
            </button>
          </div>
        </section>
      ) : null}

      {step === "preview" && result ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_PREVIEW_READY}</h2>
          {resumedFromDraft && result.audioMode === "bgm" && selectedBgmName ? (
            <p className="mt-2 text-xs leading-relaxed text-[#5c4a3a]">
              {DEVICE_MOVIE_DRAFT_BGM_LOCKED(selectedBgmName)}
            </p>
          ) : null}
          <ul className="mt-2 space-y-1 text-xs text-[#4f4336]">
            <li>タイトル: {resolvedTitle}</li>
            <li>使用秒数: {result.durationSec.toFixed(1)}s</li>
            <li>
              音の種類:{" "}
              {result.audioMode === "original"
                ? DEVICE_MOVIE_AUDIO_ORIGINAL
                : result.audioMode === "bgm"
                  ? DEVICE_MOVIE_BGM_LABEL
                  : DEVICE_MOVIE_AUDIO_MUTE}
            </li>
            {result.audioMode === "bgm" && selectedBgmName ? (
              <li>選択したBGM: {selectedBgmName}</li>
            ) : null}
            <li>
              出力: {result.width}×{result.height} / {result.fileExtension}
            </li>
          </ul>
          {movieUrl ? (
            <HitoyasumiSoftVideoPlayer
              src={movieUrl}
              posterUrl={posterUrl}
              muted={result.audioMode === "mute"}
              onPlay={stopBgmPreview}
              className="mt-3 aspect-[4/5] w-full rounded-xl"
              label="プレビューを再生"
            />
          ) : null}

          <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-[#5c4a3a]">
            {statusBusy && !donguriStatus
              ? DEVICE_MOVIE_PHASE_C_NOTE
              : firstFree
                ? DEVICE_MOVIE_FIRST_FREE_BODY
                : DEVICE_MOVIE_PAID_BODY}
          </p>

          {saveError ? (
            <p
              className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]"
              role="alert"
            >
              {saveError}
            </p>
          ) : null}
          {draftError ? (
            <p
              className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]"
              role="alert"
            >
              {draftError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={saveBusy || statusBusy || draftBusy}
              onClick={() => void confirmAndCharge()}
              className="min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {draftBusy
                ? DEVICE_MOVIE_DRAFT_SAVING
                : saveBusy
                  ? DEVICE_MOVIE_SAVING
                  : firstFree
                    ? DEVICE_MOVIE_BTN_CREATE_FREE
                    : DEVICE_MOVIE_BTN_CREATE_PAID}
            </button>
            <button
              type="button"
              disabled={saveBusy}
              onClick={() => setStep("title")}
              className="min-h-11 w-full rounded-xl border border-[#c4b49a] px-3 text-sm disabled:opacity-40"
            >
              {DEVICE_MOVIE_BTN_TWEAK}
            </button>
            <button
              type="button"
              disabled={saveBusy}
              onClick={resetToSelect}
              className="min-h-11 w-full rounded-xl border border-transparent px-3 text-sm text-[#6a5846] underline-offset-2 hover:underline disabled:opacity-40"
            >
              {DEVICE_MOVIE_RETRY}
            </button>
          </div>
        </section>
      ) : null}

      {step === "uncertain" ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_UNCERTAIN_TITLE}</h2>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[#5c4a3a]">
            {DEVICE_MOVIE_UNCERTAIN_BODY}
          </p>
          {pendingMediaId ? (
            <p className="mt-2 text-[11px] text-[#8a7660]">ID: {pendingMediaId}</p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={saveBusy || !pendingMediaId}
              onClick={() => void retryUncertainConfirm()}
              className="min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saveBusy ? DEVICE_MOVIE_CONFIRMING : DEVICE_MOVIE_BTN_RETRY_CONFIRM}
            </button>
            <button
              type="button"
              disabled={saveBusy}
              onClick={onClose}
              className="min-h-11 w-full rounded-xl border border-[#c4b49a] px-3 text-sm disabled:opacity-40"
            >
              {DEVICE_MOVIE_BTN_CONFIRM_LATER}
            </button>
          </div>
        </section>
      ) : null}

      {step === "done" && confirmedMedia ? (
        <section className="rounded-2xl border border-[#e4d8c6]/90 bg-[#fffdf8]/95 px-4 py-4">
          <h2 className="font-semibold text-[#3f3428]">{DEVICE_MOVIE_DONE_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#5c4a3a]">{DEVICE_MOVIE_DONE_BODY}</p>
          <p className="mt-2 text-sm font-medium text-[#3f3428]">
            {confirmedMedia.title?.trim() || DEVICE_MOVIE_DEFAULT_TITLE}
          </p>
          <button
            type="button"
            onClick={goToBrowseFromDone}
            className="mt-4 min-h-11 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white"
          >
            {DEVICE_MOVIE_DONE_TO_BROWSE}
          </button>
        </section>
      ) : null}

      <DonguriFootprintModal
        open={shortageOpen}
        title={DEVICE_MOVIE_SHORTAGE_TITLE}
        body={DEVICE_MOVIE_SHORTAGE_BODY}
        onDismiss={() => setShortageOpen(false)}
        actions={[
          {
            label: DEVICE_MOVIE_BTN_VIEW_DONGURI,
            variant: "primary",
            onClick: () => {
              void goToDonguriWithDraft();
            },
          },
          {
            label: DEVICE_MOVIE_BTN_BACK_ENTRANCE,
            variant: "secondary",
            onClick: () => {
              setShortageOpen(false);
              onClose();
            },
          },
          {
            label: DEVICE_MOVIE_BTN_TWEAK_SHORTAGE,
            variant: "ghost",
            onClick: () => setShortageOpen(false),
          },
        ]}
      />

      <DonguriFootprintModal
        open={replaceConfirmOpen}
        title={DEVICE_MOVIE_DRAFT_REPLACE_TITLE}
        body={DEVICE_MOVIE_DRAFT_REPLACE_BODY}
        onDismiss={cancelReplaceDraft}
        actions={[
          {
            label: DEVICE_MOVIE_DRAFT_REPLACE_CONFIRM,
            variant: "primary",
            onClick: () => {
              void confirmReplaceDraft();
            },
          },
          {
            label: DEVICE_MOVIE_DRAFT_REPLACE_CANCEL,
            variant: "secondary",
            onClick: cancelReplaceDraft,
          },
        ]}
      />
    </div>
  );
}
