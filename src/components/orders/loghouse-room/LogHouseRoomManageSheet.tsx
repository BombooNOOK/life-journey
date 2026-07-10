"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { MyPageManageHub } from "@/components/orders/MyPageManageMenu";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";
import { LOG_HOUSE_ROOM_MANAGE_BUTTON_LABEL } from "@/lib/loghouse/logHouseRoomCopy";

type ProfileRow = { id: string; nickname: string };

type Props = {
  open: boolean;
  onClose: () => void;
  profiles: ProfileRow[];
  activeProfileId: string;
  companionWritingHref: string | null;
  children?: ReactNode;
  previewMode?: boolean;
};

/** ログハウス室内：設定・プロフィール切替シート */
export function LogHouseRoomManageSheet({
  open,
  onClose,
  profiles,
  activeProfileId,
  companionWritingHref,
  previewMode = false,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  async function selectProfile(profileId: string) {
    if (previewMode) return;
    if (busyId) return;
    setError(null);
    setBusyId(profileId);
    try {
      if (profileId !== activeProfileId) {
        const result = await selectViewerProfile(profileId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      onClose();
      window.location.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-[1px]"
        aria-label="メニューを閉じる"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loghouse-manage-title"
        className="relative z-10 max-h-[min(88dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-stone-200 bg-[#fffdf9] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="loghouse-manage-title" className="text-base font-semibold text-stone-900">
            {LOG_HOUSE_ROOM_MANAGE_BUTTON_LABEL}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <section className="mb-5 space-y-2">
          <h3 className="text-sm font-semibold text-stone-900">プロフィールを選ぶ</h3>
          {previewMode ? (
            <p className="text-xs text-stone-500">プレビューでは切り替えできません。</p>
          ) : null}
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <ul className="space-y-2">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              const isBusy = busyId === profile.id;
              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    disabled={isBusy || previewMode}
                    onClick={() => void selectProfile(profile.id)}
                    className={[
                      "flex w-full min-h-[44px] items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition",
                      isActive
                        ? "border-emerald-300 bg-emerald-50/90 font-medium text-emerald-950"
                        : "border-stone-200 bg-white text-stone-800 hover:border-emerald-200 hover:bg-emerald-50/40",
                    ].join(" ")}
                  >
                    <span>{profile.nickname}</span>
                    {isActive ? <span className="text-xs text-emerald-800">選択中</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-stone-500">
            <Link href="/orders/settings/add-profile" className="font-medium text-emerald-900 hover:underline">
              プロフィールを追加
            </Link>
          </p>
        </section>

        {companionWritingHref ? (
          <p className="mb-5">
            <Link
              href={companionWritingHref}
              className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
              onClick={onClose}
            >
              どうぶつ鑑定士といっしょに書く →
            </Link>
          </p>
        ) : null}

        <MyPageManageHub activeProfileId={activeProfileId || null} />
      </div>
    </div>
  );
}
