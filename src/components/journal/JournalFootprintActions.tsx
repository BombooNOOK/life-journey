"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DonguriFootprintModal } from "@/components/loghouse/DonguriFootprintModal";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import {
  BTN_BACK,
  BTN_CLOSE,
  BTN_DRAFT_SAVE,
  BTN_FOOTPRINT_CONFIRM,
  BTN_FOOTPRINT_SAVE,
  BTN_MAKE_DRAFT,
  BTN_VIEW_DONGURI,
  DONGURI_FOOTPRINT_CONFIRM_BODY,
  DONGURI_FOOTPRINT_CONFIRM_TITLE,
  DONGURI_SHORTAGE_SAVE_BODY,
  DONGURI_SHORTAGE_SAVE_TITLE,
} from "@/lib/loghouse/donguriFootprintCopy";
import { DONGURI_DIARY_SAVE_COST, DONGURI_PAGE_PATH } from "@/lib/loghouse/donguriTypes";

type Props = {
  isEditing: boolean;
  /** 新規作成時のどんぐり残高。null は未取得 */
  acornBalance: number | null;
  /** 不足時は下書きを主ボタンに */
  preferDraft: boolean;
  saving: boolean;
  processingPhoto: boolean;
  onSaveDraft: () => void | Promise<void>;
  onFootprintSave: () => void | Promise<void>;
  onEditSave: () => void | Promise<void>;
  onEditSaveAndReturn?: () => void | Promise<void>;
  onCancelEdit?: () => void;
  cancelEditDisabled?: boolean;
};

type Dialog = "none" | "confirm" | "shortage";

export function JournalFootprintActions({
  isEditing,
  acornBalance,
  preferDraft,
  saving,
  processingPhoto,
  onSaveDraft,
  onFootprintSave,
  onEditSave,
  onEditSaveAndReturn,
  onCancelEdit,
  cancelEditDisabled,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>("none");
  const busy = saving || processingPhoto;
  const canFootprint =
    acornBalance === null ? true : acornBalance >= DONGURI_DIARY_SAVE_COST;
  const draftPrimary = preferDraft || !canFootprint;

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 border-t border-[#ebe2d4] pt-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#b8893d]/80 bg-[#b8893d] px-4 py-2.5 text-base font-medium text-white shadow-[0_2px_8px_rgba(90,70,45,0.12)] transition hover:border-[#a67a32] hover:bg-[#a67a32] disabled:opacity-60"
        >
          {saving ? <OwlLoadingInline label="反映中…" size="sm" /> : "変更を残す"}
        </button>
        {onEditSaveAndReturn ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onEditSaveAndReturn()}
            className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-base font-medium text-[#5c4a35] transition hover:border-[#d5c3a8] hover:bg-[#f3ead8] disabled:opacity-60"
          >
            {saving ? <OwlLoadingInline label="反映中…" size="sm" /> : "変更して戻る"}
          </button>
        ) : null}
        {onCancelEdit ? (
          <button
            type="button"
            disabled={busy || cancelEditDisabled}
            onClick={onCancelEdit}
            className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-base font-medium text-[#5c4a35] transition hover:border-[#d5c3a8] hover:bg-[#f3ead8] disabled:opacity-60"
          >
            編集をやめる
          </button>
        ) : null}
      </div>
    );
  }

  const primaryDraft = (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onSaveDraft()}
      className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#b8893d]/80 bg-[#b8893d] px-4 py-2.5 text-base font-medium text-white shadow-[0_2px_8px_rgba(90,70,45,0.12)] transition hover:border-[#a67a32] hover:bg-[#a67a32] disabled:opacity-60"
    >
      {saving ? <OwlLoadingInline label="残しています…" size="sm" /> : BTN_DRAFT_SAVE}
    </button>
  );

  const primaryFootprint = (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (!canFootprint) {
          setDialog("shortage");
          return;
        }
        setDialog("confirm");
      }}
      className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#b8893d]/80 bg-[#b8893d] px-4 py-2.5 text-base font-medium text-white shadow-[0_2px_8px_rgba(90,70,45,0.12)] transition hover:border-[#a67a32] hover:bg-[#a67a32] disabled:opacity-60"
    >
      {saving ? <OwlLoadingInline label="残しています…" size="sm" /> : BTN_FOOTPRINT_SAVE}
    </button>
  );

  const secondaryFootprint = (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (!canFootprint) {
          setDialog("shortage");
          return;
        }
        setDialog("confirm");
      }}
      className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-base font-medium text-[#5c4a35] transition hover:border-[#d5c3a8] hover:bg-[#f3ead8] disabled:opacity-60"
    >
      {BTN_FOOTPRINT_SAVE}
    </button>
  );

  const secondaryDraft = (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onSaveDraft()}
      className="min-h-[44px] whitespace-nowrap rounded-xl border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-base font-medium text-[#5c4a35] transition hover:border-[#d5c3a8] hover:bg-[#f3ead8] disabled:opacity-60"
    >
      {BTN_DRAFT_SAVE}
    </button>
  );

  return (
    <>
      <div className="flex flex-col gap-2 border-t border-[#ebe2d4] pt-3 sm:flex-row sm:flex-wrap sm:justify-end">
        {draftPrimary ? (
          <>
            {primaryDraft}
            {secondaryFootprint}
          </>
        ) : (
          <>
            {primaryFootprint}
            {secondaryDraft}
          </>
        )}
      </div>

      <DonguriFootprintModal
        open={dialog === "confirm"}
        title={DONGURI_FOOTPRINT_CONFIRM_TITLE}
        body={DONGURI_FOOTPRINT_CONFIRM_BODY}
        onDismiss={() => setDialog("none")}
        actions={[
          {
            label: BTN_FOOTPRINT_CONFIRM,
            variant: "primary",
            onClick: () => {
              setDialog("none");
              void onFootprintSave();
            },
          },
          {
            label: BTN_MAKE_DRAFT,
            variant: "secondary",
            onClick: () => {
              setDialog("none");
              void onSaveDraft();
            },
          },
          {
            label: BTN_BACK,
            variant: "ghost",
            onClick: () => setDialog("none"),
          },
        ]}
      />

      <DonguriFootprintModal
        open={dialog === "shortage"}
        title={DONGURI_SHORTAGE_SAVE_TITLE}
        body={DONGURI_SHORTAGE_SAVE_BODY}
        onDismiss={() => setDialog("none")}
        actions={[
          {
            label: BTN_DRAFT_SAVE,
            variant: "primary",
            onClick: () => {
              setDialog("none");
              void onSaveDraft();
            },
          },
          {
            label: BTN_VIEW_DONGURI,
            variant: "secondary",
            onClick: () => {
              setDialog("none");
              router.push(DONGURI_PAGE_PATH);
            },
          },
          {
            label: BTN_CLOSE,
            variant: "ghost",
            onClick: () => setDialog("none"),
          },
        ]}
      />
    </>
  );
}
