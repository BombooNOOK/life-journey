"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { MyPageManageHub } from "@/components/orders/MyPageManageMenu";
import {
  FOREST_INSIDE_ACCOUNT_CAPTION,
  FOREST_LEAVE_BUSY_LABEL,
  FOREST_LEAVE_LABEL,
} from "@/lib/auth/forestSessionCopy";
import { canShowAdminProfileSwitchUi } from "@/lib/profile/viewerProfileUiPolicy";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type Props = {
  open: boolean;
  onClose: () => void;
  profiles: ProfileRow[];
  activeProfileId: string;
  /** @deprecated 歯車メニューからは伴走導線を出さない（互換のため残す） */
  companionWritingHref?: string | null;
  /** ログイン中アカウント（表示用）。未指定時は Firebase から取得 */
  viewerEmail?: string | null;
  /** 管理者のみ：既存複数 Profile 切替を表示 */
  viewerIsAdmin?: boolean;
  children?: ReactNode;
  previewMode?: boolean;
};

/** ログハウス室内：設定シート（一般は住民票・住民登録情報・記録のバックアップ。adminのみ既存枠切替） */
export function LogHouseRoomManageSheet({
  open,
  onClose,
  profiles,
  activeProfileId,
  viewerEmail = null,
  viewerIsAdmin = false,
  previewMode = false,
}: Props) {
  const router = useRouter();
  const { user, signOutUser } = useFirebaseAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const accountEmail = viewerEmail?.trim() || user?.email || null;
  const showAdminSwitch = canShowAdminProfileSwitchUi({
    isAdmin: viewerIsAdmin,
    profileCount: profiles.length,
  });

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

  async function handleSignOut() {
    if (previewMode || signingOut) return;
    setSigningOut(true);
    try {
      onClose();
      await signOutUser();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
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
            設定
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

        {showAdminSwitch ? (
          <section className="mb-5 space-y-2">
            <p className="text-xs font-medium text-amber-900">管理者：既存の記録枠を切り替える</p>
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
          </section>
        ) : null}

        <MyPageManageHub />

        <section className="mt-6 border-t border-stone-200 pt-4">
          <p className="text-xs text-stone-500">{FOREST_INSIDE_ACCOUNT_CAPTION}</p>
          <p className="mt-1 break-all text-sm text-stone-800">
            {previewMode
              ? "preview@example.com"
              : accountEmail ?? "（読み込み中…）"}
          </p>
          <button
            type="button"
            disabled={previewMode || signingOut}
            onClick={() => void handleSignOut()}
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"
          >
            {signingOut ? FOREST_LEAVE_BUSY_LABEL : FOREST_LEAVE_LABEL}
          </button>
        </section>
      </div>
    </div>
  );
}
