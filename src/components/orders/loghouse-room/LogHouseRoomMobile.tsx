"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from "react";

import { LogHouseRoomChrome } from "@/components/orders/loghouse-room/LogHouseRoomChrome";
import { LogHouseDonguriChoModal } from "@/components/orders/loghouse-room/LogHouseDonguriChoModal";
import { LogHouseRadioCassetteModal } from "@/components/orders/loghouse-room/LogHouseRadioCassetteModal";
import { LogHouseRoomGoOutSpot } from "@/components/orders/loghouse-room/LogHouseRoomGoOutSpot";
import { LogHouseRoomMailboxSpot } from "@/components/orders/loghouse-room/LogHouseRoomMailboxSpot";
import { LogHouseRoomPartsLayer } from "@/components/orders/loghouse-room/LogHouseRoomPartsLayer";
import { LogHouseRoomRabbitAvatar } from "@/components/orders/loghouse-room/LogHouseRoomRabbitAvatar";
import { LogHouseRoomSpotSheet } from "@/components/orders/loghouse-room/LogHouseRoomSpotSheet";
import { LogHouseRoomTapSpot } from "@/components/orders/loghouse-room/LogHouseRoomTapSpot";
import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";
import { useLogHouseRoomTimeTheme } from "@/hooks/useLogHouseRoomTimeOfDay";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import { getStubDonguriChoView } from "@/lib/loghouse/donguriLedger";
import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";
import {
  LOG_HOUSE_ROOM_MOBILE_BG_BY_TIME,
  LOG_HOUSE_ROOM_MOBILE_INTRINSIC,
} from "@/lib/loghouse/logHouseRoomAssets";
import {
  LOG_HOUSE_ROOM_DESK_KANTEI_LOCK_MESSAGE,
  LOG_HOUSE_ROOM_FIRST_VISIT_TIP,
  LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY,
  LOG_HOUSE_ROOM_HINT_AUTO_HIDE_MS,
  LOG_HOUSE_ROOM_JOURNAL_LOCK_MESSAGE,
  LOG_HOUSE_ROOM_KANTEI_LOCK_CTA_LABEL,
  LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE,
  LOG_HOUSE_ROOM_TODAY_RESULT_PREPARING_MESSAGE,
} from "@/lib/loghouse/logHouseRoomCopy";
import { LOG_HOUSE_MAILBOX_PAGE_PATH } from "@/lib/loghouse/logHouseMailboxCopy";
import { LOG_HOUSE_ROOM_HOTSPOTS, type LogHouseRoomSpotId } from "@/lib/loghouse/logHouseRoomHotspots";
import { LOG_HOUSE_GO_OUT_PAGE_PATH } from "@/lib/loghouse/logHouseGoOutCopy";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type SpotLockCta = {
  href: string;
  label: string;
};

type SpotAction = {
  href: string | null;
  needsProfile?: boolean;
  /** 鑑定前など：見た目は通常のまま、タップで案内を出す */
  lockMessage?: string | null;
  lockCta?: SpotLockCta | null;
};

type SpotNotice = {
  message: string;
  cta?: SpotLockCta | null;
};

const KANTEI_LOCK: Pick<SpotAction, "href" | "lockMessage" | "lockCta"> = {
  href: null,
  lockMessage: LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE,
  lockCta: {
    href: FIRST_VISIT_ROUTES.kanteiReady,
    label: LOG_HOUSE_ROOM_KANTEI_LOCK_CTA_LABEL,
  },
};

const DESK_KANTEI_LOCK: Pick<SpotAction, "href" | "lockMessage" | "lockCta"> = {
  href: null,
  lockMessage: LOG_HOUSE_ROOM_DESK_KANTEI_LOCK_MESSAGE,
  lockCta: {
    href: FIRST_VISIT_ROUTES.kanteiReady,
    label: LOG_HOUSE_ROOM_KANTEI_LOCK_CTA_LABEL,
  },
};

type Props = {
  profileId: string;
  profiles: ProfileRow[];
  activeProfileId: string;
  entitlement: SerializedUserEntitlement;
  /** サーバー上の鑑定済み（注文IDが取れない場合でも完了扱い） */
  hasKanteiOrder?: boolean;
  kanteiOrderId: string | null;
  mailboxUnreadCount?: number;
  companionWritingHref: string | null;
  /** 机タップ先。はじめて導線は伴走執筆、通常は `/orders/write` */
  deskWritingHref: string;
  onOpenManage: () => void;
  className?: string;
  previewMode?: boolean;
  layout?: "immersive" | "framed";
  /** プレビュー確認用。本番では渡さない */
  timeOfDayOverride?: LogHouseRoomTimeOfDay;
};

/** 576×1024 を viewport に cover 相当で広げる（座標は相対維持） */
function coverStageStyle(size: { widthPx: number; heightPx: number }): CSSProperties {
  const ratio = size.widthPx / size.heightPx;
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: `max(100vw, calc(100dvh * ${ratio}))`,
    height: `max(100dvh, calc(100vw / ${ratio}))`,
    transform: "translate(-50%, -50%)",
  };
}

function RoomStage({
  busy,
  previewMode,
  spotActions,
  onSpotActivate,
  hintActive,
  flashSpotId,
  timeOfDay,
  mailboxUnread,
}: {
  busy: boolean;
  previewMode: boolean;
  spotActions: Record<LogHouseRoomSpotId, SpotAction>;
  onSpotActivate: (spotId: LogHouseRoomSpotId) => void;
  hintActive: boolean;
  flashSpotId: LogHouseRoomSpotId | null;
  timeOfDay: LogHouseRoomTimeOfDay;
  mailboxUnread: boolean;
}) {
  return (
    <>
      {/* 昼・夜を重ねてクロスフェード（座標はそのまま） */}
      {(["day", "night"] as const).map((id) => (
        <Image
          key={id}
          src={LOG_HOUSE_ROOM_MOBILE_BG_BY_TIME[id]}
          alt=""
          fill
          priority={id === timeOfDay}
          sizes="100vw"
          className={[
            "z-0 object-cover object-center transition-opacity duration-700 ease-in-out",
            timeOfDay === id ? "opacity-100" : "opacity-0",
          ].join(" ")}
          draggable={false}
          unoptimized
        />
      ))}

      <LogHouseRoomPartsLayer />

      <div className="absolute inset-0 z-[20]" style={{ touchAction: "manipulation" }}>
        {LOG_HOUSE_ROOM_HOTSPOTS.map((spot) => {
          const action = spotActions[spot.id];
          const locked = Boolean(action.lockMessage);
          const disabled = busy || (!locked && action.href == null);

          return (
            <LogHouseRoomTapSpot
              key={spot.id}
              spot={spot}
              disabled={disabled}
              showDebugOutline={previewMode}
              showHintLabel={hintActive}
              flash={flashSpotId === spot.id}
              onActivate={() => onSpotActivate(spot.id)}
            />
          );
        })}

        <LogHouseRoomMailboxSpot
          disabled={busy || !spotActions.mailbox.href}
          showDebugOutline={previewMode}
          showHintLabel={hintActive}
          flash={flashSpotId === "mailbox"}
          hasUnread={mailboxUnread}
          onActivate={() => onSpotActivate("mailbox")}
        />

        <LogHouseRoomGoOutSpot
          disabled={busy || !spotActions.goOut.href}
          showDebugOutline={previewMode}
          showHintLabel={hintActive}
          flash={flashSpotId === "goOut"}
          onActivate={() => onSpotActivate("goOut")}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <LogHouseRoomRabbitAvatar />
        </div>
      </div>
    </>
  );
}

/** スマホ縦長：没入型ログハウス室内（全画面 + 家具タップ） */
export function LogHouseRoomMobile({
  profileId,
  activeProfileId,
  entitlement,
  hasKanteiOrder = false,
  kanteiOrderId,
  mailboxUnreadCount = 0,
  companionWritingHref,
  deskWritingHref,
  onOpenManage,
  className = "",
  previewMode = false,
  layout = "immersive",
  timeOfDayOverride,
}: Props) {
  const router = useRouter();
  const { timeOfDay: detectedTimeOfDay } = useLogHouseRoomTimeTheme();
  const timeOfDay = timeOfDayOverride ?? detectedTimeOfDay;
  const [isPending, startTransition] = useTransition();
  const [profileBusy, setProfileBusy] = useState(false);
  const [notice, setNotice] = useState<SpotNotice | null>(null);
  const [hintActive, setHintActive] = useState(false);
  const [showFirstVisitTip, setShowFirstVisitTip] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<LogHouseRoomSpotId | null>(null);
  const [flashSpotId, setFlashSpotId] = useState<LogHouseRoomSpotId | null>(null);
  const [donguriChoOpen, setDonguriChoOpen] = useState(false);
  const [radioCassetteOpen, setRadioCassetteOpen] = useState(false);
  const donguriCho = useMemo(() => getStubDonguriChoView(), []);
  const busy = isPending || profileBusy;
  const ambientBg = timeOfDay === "night" ? "#2a2218" : "#ebe4d4";

  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalBlocked = entitlement.tier === "trial_expired" || !canWriteJournal;
  const isActiveProfile = profileId === activeProfileId;
  const hasKantei = hasKanteiOrder || Boolean(kanteiOrderId);

  useEffect(() => {
    if (!notice) return;
    const ms = notice.cta ? 10000 : 4200;
    const timer = window.setTimeout(() => setNotice(null), ms);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (previewMode) {
      setShowFirstVisitTip(true);
      return;
    }
    try {
      const seen = window.localStorage.getItem(LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY);
      if (!seen) setShowFirstVisitTip(true);
    } catch {
      setShowFirstVisitTip(true);
    }
  }, [previewMode]);

  useEffect(() => {
    if (!hintActive) return;
    const timer = window.setTimeout(() => setHintActive(false), LOG_HOUSE_ROOM_HINT_AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [hintActive]);

  useEffect(() => {
    if (!flashSpotId) return;
    const timer = window.setTimeout(() => setFlashSpotId(null), 420);
    return () => window.clearTimeout(timer);
  }, [flashSpotId]);

  const dismissFirstVisitTip = useCallback(() => {
    setShowFirstVisitTip(false);
    if (previewMode) return;
    try {
      window.localStorage.setItem(LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, [previewMode]);

  const toggleHint = useCallback(() => {
    setHintActive((prev) => !prev);
    dismissFirstVisitTip();
  }, [dismissFirstVisitTip]);

  const navigate = useCallback(
    async (href: string, needsProfileSelect: boolean) => {
      if (busy) return;
      try {
        if (needsProfileSelect && !isActiveProfile && !previewMode) {
          setProfileBusy(true);
          const result = await selectViewerProfile(profileId);
          setProfileBusy(false);
          if (!result.ok) {
            window.alert(result.error);
            return;
          }
        }
        startTransition(() => {
          router.push(href);
        });
      } catch {
        setProfileBusy(false);
        window.alert("ページへ移動できませんでした。もう一度お試しください。");
      }
    },
    [busy, isActiveProfile, previewMode, profileId, router, startTransition],
  );

  const spotActions: Record<LogHouseRoomSpotId, SpotAction> = useMemo(
    () => ({
      bookshelf: hasKantei
        ? { href: "/orders/bookshelf", needsProfile: true }
        : { ...KANTEI_LOCK },
      desk: !hasKantei
        ? { ...DESK_KANTEI_LOCK }
        : journalBlocked
          ? { href: null, lockMessage: LOG_HOUSE_ROOM_JOURNAL_LOCK_MESSAGE }
          : {
              href: deskWritingHref,
              needsProfile: true,
            },
      residentCard: { href: "/orders/resident-card" },
      todayResult: kanteiOrderId
        ? { href: `/orders/${encodeURIComponent(kanteiOrderId)}` }
        : hasKantei
          ? { href: null, lockMessage: LOG_HOUSE_ROOM_TODAY_RESULT_PREPARING_MESSAGE }
          : { ...KANTEI_LOCK },
      /** ラジカセは遷移ではなく操作カードを開く（href はヒント確認用のダミー） */
      radio: { href: "#radio-cassette" },
      goOut: { href: LOG_HOUSE_GO_OUT_PAGE_PATH },
      mailbox: { href: LOG_HOUSE_MAILBOX_PAGE_PATH },
    }),
    [deskWritingHref, hasKantei, journalBlocked, kanteiOrderId],
  );

  useEffect(() => {
    if (previewMode) return;
    for (const action of Object.values(spotActions)) {
      if (action.href && !action.href.startsWith("#")) router.prefetch(action.href);
    }
  }, [previewMode, router, spotActions]);

  const onSpotActivate = useCallback(
    (spotId: LogHouseRoomSpotId) => {
      dismissFirstVisitTip();
      const action = spotActions[spotId];

      // ？ヒント中だけ説明シート。普段はタップで直接移動／開く
      if (hintActive) {
        setFlashSpotId(spotId);
        setSelectedSpotId(spotId);
        setHintActive(false);
        return;
      }

      if (spotId === "radio") {
        setFlashSpotId(spotId);
        setRadioCassetteOpen(true);
        return;
      }

      if (action.lockMessage) {
        setFlashSpotId(spotId);
        setNotice({
          message: action.lockMessage,
          cta: action.lockCta ?? null,
        });
        return;
      }
      if (!action.href) return;
      setFlashSpotId(spotId);
      void navigate(action.href, action.needsProfile === true);
    },
    [dismissFirstVisitTip, hintActive, navigate, spotActions],
  );

  const selectedAction = selectedSpotId ? spotActions[selectedSpotId] : null;

  const confirmSelectedSpot = useCallback(() => {
    if (!selectedSpotId || !selectedAction?.href) return;
    if (selectedSpotId === "radio") {
      setSelectedSpotId(null);
      setRadioCassetteOpen(true);
      return;
    }
    const href = selectedAction.href;
    const needsProfile = selectedAction.needsProfile === true;
    setSelectedSpotId(null);
    void navigate(href, needsProfile);
  }, [navigate, selectedAction, selectedSpotId]);

  const noticeOverlay = notice ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[55] flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto max-w-sm rounded-xl border border-emerald-200/90 bg-[#fffdf9]/95 px-3.5 py-2.5 text-center text-xs leading-relaxed text-stone-700 shadow-lg backdrop-blur-[1px]"
      >
        <p>{notice.message}</p>
        {notice.cta ? (
          <p className="mt-2">
            <Link
              href={notice.cta.href}
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              {notice.cta.label}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  ) : null;

  const firstVisitTipOverlay = showFirstVisitTip ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[54] flex justify-center px-4">
      <div className="pointer-events-auto max-w-sm rounded-xl border border-emerald-200/80 bg-[#fffdf9]/96 px-3.5 py-3 text-center shadow-lg backdrop-blur-[1px]">
        <p className="whitespace-pre-line text-xs leading-relaxed text-stone-700">
          {LOG_HOUSE_ROOM_FIRST_VISIT_TIP}
        </p>
        <button
          type="button"
          onClick={dismissFirstVisitTip}
          className="mt-2 inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 text-xs font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          わかった
        </button>
      </div>
    </div>
  ) : null;

  const spotSheet =
    selectedSpotId && selectedAction ? (
      <>
        <button
          type="button"
          className="absolute inset-0 z-[55] bg-stone-900/15"
          aria-label="説明を閉じる"
          onClick={() => setSelectedSpotId(null)}
        />
        <LogHouseRoomSpotSheet
          spotId={selectedSpotId}
          lockMessage={selectedAction.lockMessage}
          lockCtaHref={selectedAction.lockCta?.href}
          lockCtaLabel={selectedAction.lockCta?.label}
          busy={busy}
          onClose={() => setSelectedSpotId(null)}
          onConfirm={confirmSelectedSpot}
        />
      </>
    ) : null;

  const busyOverlay = (
    <OwlDelayedBusyOverlay busy={busy} spinnerDelayMs={0} className="bg-white/15" />
  );

  const chrome = (
    <LogHouseRoomChrome
      onOpenSettings={onOpenManage}
      hintActive={hintActive}
      onToggleHint={toggleHint}
      timeOfDay={timeOfDay}
      donguriBalance={donguriCho.balance}
      onOpenDonguriCho={() => setDonguriChoOpen(true)}
    />
  );

  const donguriChoModal = (
    <LogHouseDonguriChoModal
      open={donguriChoOpen}
      view={donguriCho}
      onClose={() => setDonguriChoOpen(false)}
    />
  );

  const radioCassetteModal = (
    <LogHouseRadioCassetteModal
      open={radioCassetteOpen}
      onClose={() => setRadioCassetteOpen(false)}
      musicHallHref={
        previewMode
          ? buildForestMusicHallHref("/preview/loghouse-room")
          : undefined
      }
    />
  );

  const stage = (
    <RoomStage
      busy={busy}
      previewMode={previewMode}
      spotActions={spotActions}
      onSpotActivate={onSpotActivate}
      hintActive={hintActive}
      flashSpotId={flashSpotId}
      timeOfDay={timeOfDay}
      mailboxUnread={mailboxUnreadCount > 0}
    />
  );

  if (layout === "framed") {
    return (
      <>
        <div
          className={[
            "relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 shadow-sm",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            aspectRatio: `${LOG_HOUSE_ROOM_MOBILE_INTRINSIC.widthPx} / ${LOG_HOUSE_ROOM_MOBILE_INTRINSIC.heightPx}`,
            backgroundColor: ambientBg,
          }}
        >
          <div className="absolute inset-0 isolate overflow-hidden">{stage}</div>
          {chrome}
          {firstVisitTipOverlay}
          {noticeOverlay}
          {spotSheet}
          {busyOverlay}
          <p className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</p>
        </div>
        {donguriChoModal}
        {radioCassetteModal}
      </>
    );
  }

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-[60] overflow-hidden overscroll-none",
          "select-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ touchAction: "none", backgroundColor: ambientBg }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="relative isolate overflow-hidden" style={coverStageStyle(LOG_HOUSE_ROOM_MOBILE_INTRINSIC)}>
            {stage}
          </div>
        </div>

        {chrome}
        {firstVisitTipOverlay}
        {noticeOverlay}
        {spotSheet}
        {busyOverlay}
        <p className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</p>
      </div>
      {donguriChoModal}
      {radioCassetteModal}
    </>
  );
}
