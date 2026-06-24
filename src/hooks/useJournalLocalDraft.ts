"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ContentFontMode } from "@/lib/journal/contentFontMode";
import { DEFAULT_CONTENT_FONT_MODE } from "@/lib/journal/contentFontMode";
import type { ActivityId, MoodId } from "@/lib/journal/meta";
import {
  buildJournalLocalDraftKey,
  buildJournalLocalDraftPayload,
  clearJournalLocalDraft,
  isMeaningfulNewJournalLocalDraft,
  journalLocalDraftDiffersFromSnapshot,
  readJournalLocalDraft,
  snapshotsEqual,
  writeJournalLocalDraft,
  type JournalLocalDraftFormSnapshot,
  type JournalLocalDraftPayload,
} from "@/lib/journal/journalLocalDraftStorage";

const AUTOSAVE_DEBOUNCE_MS = 600;

export type UseJournalLocalDraftParams = {
  enabled: boolean;
  viewerEmail: string | null;
  profileId: string;
  editingId: string | null;
  entryDate: string;
  mood: MoodId;
  activity: ActivityId;
  content: string;
  contentFontMode: ContentFontMode;
  loadingEdit: boolean;
  editLoadFailed: boolean;
  editServerSnapshot: JournalLocalDraftFormSnapshot | null;
  autosavePaused: boolean;
  onApplyDraft: (draft: JournalLocalDraftPayload) => void;
};

export type UseJournalLocalDraftResult = {
  isOffline: boolean;
  hasActiveLocalDraft: boolean;
  showDeviceOnlyNotice: boolean;
  restorePromptVisible: boolean;
  acceptRestore: () => void;
  discardRestore: () => void;
  clearDraftAfterSuccessfulSave: () => void;
  currentDraftKey: string | null;
};

function readInitialOnlineState(): boolean {
  if (typeof window === "undefined") return true;
  return window.navigator.onLine;
}

export function useJournalLocalDraft({
  enabled,
  viewerEmail,
  profileId,
  editingId,
  entryDate,
  mood,
  activity,
  content,
  contentFontMode,
  loadingEdit,
  editLoadFailed,
  editServerSnapshot,
  autosavePaused,
  onApplyDraft,
}: UseJournalLocalDraftParams): UseJournalLocalDraftResult {
  const [isOffline, setIsOffline] = useState(readInitialOnlineState);
  const [restorePromptVisible, setRestorePromptVisible] = useState(false);
  const [pendingRestoreDraft, setPendingRestoreDraft] = useState<JournalLocalDraftPayload | null>(
    null,
  );
  const [hasActiveLocalDraft, setHasActiveLocalDraft] = useState(false);

  const restorePromptedKeyRef = useRef<string | null>(null);
  const previousNewEntryDateRef = useRef<string | null>(null);
  const onApplyDraftRef = useRef(onApplyDraft);
  onApplyDraftRef.current = onApplyDraft;

  const formSnapshot = useMemo(
    (): JournalLocalDraftFormSnapshot => ({
      entryDate,
      mood,
      activity,
      content,
      contentFontMode,
    }),
    [entryDate, mood, activity, content, contentFontMode],
  );

  const currentDraftKey = useMemo(() => {
    if (!enabled || !viewerEmail?.trim()) return null;
    if (editingId) {
      return buildJournalLocalDraftKey({
        email: viewerEmail,
        profileId,
        mode: "edit",
        editingId,
      });
    }
    return buildJournalLocalDraftKey({
      email: viewerEmail,
      profileId,
      mode: "new",
      entryDateYmd: entryDate,
    });
  }, [enabled, viewerEmail, profileId, editingId, entryDate]);

  const defaultNewEntryDate = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const clearDraftAtKey = useCallback((key: string | null) => {
    if (!key) return;
    clearJournalLocalDraft(key);
    if (currentDraftKey === key) {
      setHasActiveLocalDraft(false);
    }
  }, [currentDraftKey]);

  const offerRestore = useCallback(
    (draft: JournalLocalDraftPayload, key: string) => {
      if (restorePromptedKeyRef.current === key) return;
      restorePromptedKeyRef.current = key;
      setPendingRestoreDraft(draft);
      setRestorePromptVisible(true);
    },
    [],
  );

  const acceptRestore = useCallback(() => {
    if (pendingRestoreDraft) {
      onApplyDraftRef.current(pendingRestoreDraft);
      setHasActiveLocalDraft(true);
    }
    setPendingRestoreDraft(null);
    setRestorePromptVisible(false);
  }, [pendingRestoreDraft]);

  const discardRestore = useCallback(() => {
    clearDraftAtKey(currentDraftKey);
    setPendingRestoreDraft(null);
    setRestorePromptVisible(false);
  }, [clearDraftAtKey, currentDraftKey]);

  const clearDraftAfterSuccessfulSave = useCallback(() => {
    clearDraftAtKey(currentDraftKey);
    restorePromptedKeyRef.current = null;
    setPendingRestoreDraft(null);
    setRestorePromptVisible(false);
  }, [clearDraftAtKey, currentDraftKey]);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // 新規: 記録日変更時に旧 key の下書きを削除
  useEffect(() => {
    if (!enabled || editingId || !viewerEmail?.trim()) return;
    const prev = previousNewEntryDateRef.current;
    if (prev && prev !== entryDate) {
      const oldKey = buildJournalLocalDraftKey({
        email: viewerEmail,
        profileId,
        mode: "new",
        entryDateYmd: prev,
      });
      clearDraftAtKey(oldKey);
      restorePromptedKeyRef.current = null;
    }
    previousNewEntryDateRef.current = entryDate;
  }, [enabled, editingId, viewerEmail, profileId, entryDate, clearDraftAtKey]);

  // 復元確認: 新規
  useEffect(() => {
    if (!enabled || !currentDraftKey || editingId || loadingEdit) return;
    if (autosavePaused || restorePromptVisible) return;

    const draft = readJournalLocalDraft(currentDraftKey);
    if (!draft) {
      setHasActiveLocalDraft(false);
      return;
    }
    if (!isMeaningfulNewJournalLocalDraft(draft, defaultNewEntryDate)) {
      clearDraftAtKey(currentDraftKey);
      return;
    }
    if (!journalLocalDraftDiffersFromSnapshot(draft, formSnapshot)) {
      setHasActiveLocalDraft(true);
      return;
    }
    if (snapshotsEqual(formSnapshot, {
      entryDate: draft.entryDate,
      mood: draft.mood,
      activity: draft.activity,
      content: draft.content,
      contentFontMode: draft.contentFontMode,
    })) {
      setHasActiveLocalDraft(true);
      return;
    }
    const isPristineNewForm =
      !content.trim() &&
      mood === "calm" &&
      activity === "record_anyway" &&
      contentFontMode === DEFAULT_CONTENT_FONT_MODE;
    if (isPristineNewForm) {
      offerRestore(draft, currentDraftKey);
    }
    setHasActiveLocalDraft(true);
  }, [
    enabled,
    currentDraftKey,
    editingId,
    loadingEdit,
    autosavePaused,
    restorePromptVisible,
    defaultNewEntryDate,
    formSnapshot,
    content,
    mood,
    activity,
    contentFontMode,
    clearDraftAtKey,
    offerRestore,
  ]);

  // 復元確認: 編集（API 成功後）
  useEffect(() => {
    if (!enabled || !currentDraftKey || !editingId || loadingEdit || editLoadFailed) return;
    if (!editServerSnapshot || autosavePaused || restorePromptVisible) return;

    const draft = readJournalLocalDraft(currentDraftKey);
    if (!draft) {
      setHasActiveLocalDraft(false);
      return;
    }
    if (!journalLocalDraftDiffersFromSnapshot(draft, editServerSnapshot)) {
      clearDraftAtKey(currentDraftKey);
      setHasActiveLocalDraft(false);
      return;
    }
    if (snapshotsEqual(formSnapshot, editServerSnapshot)) {
      offerRestore(draft, currentDraftKey);
    }
    setHasActiveLocalDraft(true);
  }, [
    enabled,
    currentDraftKey,
    editingId,
    loadingEdit,
    editLoadFailed,
    editServerSnapshot,
    autosavePaused,
    restorePromptVisible,
    formSnapshot,
    clearDraftAtKey,
    offerRestore,
  ]);

  // 復元確認: 編集（API 失敗・オフライン再読み込み）
  useEffect(() => {
    if (!enabled || !currentDraftKey || !editingId || !editLoadFailed || loadingEdit) return;
    if (restorePromptVisible) return;

    const draft = readJournalLocalDraft(currentDraftKey);
    if (!draft) return;
    if (
      !draft.content.trim() &&
      !journalLocalDraftDiffersFromSnapshot(draft, {
        entryDate: draft.entryDate,
        mood: "calm",
        activity: "record_anyway",
        content: "",
        contentFontMode: DEFAULT_CONTENT_FONT_MODE,
      })
    ) {
      return;
    }
    offerRestore(draft, currentDraftKey);
    setHasActiveLocalDraft(true);
  }, [
    enabled,
    currentDraftKey,
    editingId,
    editLoadFailed,
    loadingEdit,
    restorePromptVisible,
    offerRestore,
  ]);

  // debounce autosave（オンライン時も裏側で静かに保存）
  useEffect(() => {
    if (!enabled || !currentDraftKey || autosavePaused || restorePromptVisible) return;
    if (editingId && loadingEdit && !editLoadFailed) return;

    if (editLoadFailed && !editServerSnapshot && !content.trim()) {
      const existing = readJournalLocalDraft(currentDraftKey);
      if (existing) return;
    }

    const payload = buildJournalLocalDraftPayload(formSnapshot, { editingId });
    const isNew = !editingId;

    if (isNew && !isMeaningfulNewJournalLocalDraft(payload, defaultNewEntryDate)) {
      clearDraftAtKey(currentDraftKey);
      return;
    }

    if (
      !isNew &&
      editServerSnapshot &&
      !editLoadFailed &&
      !journalLocalDraftDiffersFromSnapshot(payload, editServerSnapshot)
    ) {
      clearDraftAtKey(currentDraftKey);
      return;
    }

    const timer = window.setTimeout(() => {
      const wrote = writeJournalLocalDraft(currentDraftKey, payload);
      if (wrote) {
        setHasActiveLocalDraft(true);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    currentDraftKey,
    autosavePaused,
    restorePromptVisible,
    editingId,
    loadingEdit,
    editLoadFailed,
    formSnapshot,
    defaultNewEntryDate,
    editServerSnapshot,
    clearDraftAtKey,
    content,
  ]);

  const showDeviceOnlyNotice =
    isOffline &&
    hasActiveLocalDraft &&
    !restorePromptVisible;

  return {
    isOffline,
    hasActiveLocalDraft,
    showDeviceOnlyNotice,
    restorePromptVisible,
    acceptRestore,
    discardRestore,
    clearDraftAfterSuccessfulSave,
    currentDraftKey,
  };
}
