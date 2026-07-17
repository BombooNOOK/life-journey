"use client";

import Image from "next/image";
import Link from "next/link";

import {
  MAILBOX_GOAT_FULL_MAIN_SRC,
  MAILBOX_GOAT_FULL_SUB_SRC,
} from "@/lib/loghouse/mailboxAssets";
import {
  LOG_HOUSE_MAILBOX_EMPTY_BODY,
  LOG_HOUSE_MAILBOX_EMPTY_TITLE,
  LOG_HOUSE_MAILBOX_INTRO_LINES,
  LOG_HOUSE_MAILBOX_PAGE_BRAND,
  LOG_HOUSE_MAILBOX_UNREAD_LABEL,
} from "@/lib/loghouse/logHouseMailboxCopy";
import {
  mailboxSenderIconSrc,
  mailboxSenderInitial,
  type MailboxPostPresentation,
} from "@/lib/loghouse/mailboxPresentation";
import { LJD_PAPER_CARD_CLASS } from "@/lib/ljd/ljdPaperSurface";

type IntroProps = {
  compact?: boolean;
};

/** 一覧上部：ヤギをしっかり見せる案内帯 */
export function MailboxIntroBanner({ compact = false }: IntroProps) {
  return (
    <section className={`relative isolate overflow-hidden ${LJD_PAPER_CARD_CLASS}`}>
      <Image
        src="/images/home/hero_forest_bg_soft_wide.png"
        alt=""
        fill
        className="pointer-events-none -z-20 object-cover object-center"
        sizes="(max-width: 640px) 100vw, 448px"
        unoptimized
        priority
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#f7edd8]/25 via-[#fffaf0]/15 to-[#fffaf4]/65"
        aria-hidden
      />
      <div
        className={`relative flex items-stretch ${
          compact ? "min-h-[9rem] sm:min-h-[8rem]" : "min-h-[12rem] sm:min-h-[10.5rem]"
        }`}
      >
        <div
          className={[
            "relative shrink-0 self-stretch",
            compact ? "w-[41%] sm:w-[38%]" : "w-[45%] sm:w-[40%]",
          ].join(" ")}
        >
          <Image
            src={MAILBOX_GOAT_FULL_MAIN_SRC}
            alt=""
            fill
            className="object-contain object-bottom px-1 pt-2 drop-shadow-[0_4px_8px_rgba(82,64,38,0.16)] sm:px-2"
            sizes="(max-width: 640px) 44vw, 160px"
            unoptimized
            priority
          />
        </div>
        <div className="my-3 mr-3 flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-white/55 bg-[#fffdf8]/72 px-3.5 py-3 shadow-[0_4px_18px_rgba(83,65,41,0.08)] backdrop-blur-[2px] sm:my-3.5 sm:mr-3.5 sm:px-4">
          <p className="text-[11px] font-medium tracking-wide text-[#8a735c]">
            {LOG_HOUSE_MAILBOX_PAGE_BRAND}
          </p>
          <div className="mt-1.5 space-y-1">
            {LOG_HOUSE_MAILBOX_INTRO_LINES.map((line) => (
              <p key={line} className="text-[13px] leading-relaxed text-[#5c4a3a] sm:text-sm">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type EmptyProps = {
  useSubPose?: boolean;
};

/** 空状態 */
export function MailboxEmptyState({ useSubPose = false }: EmptyProps) {
  return (
    <section className={`px-5 py-8 text-center ${LJD_PAPER_CARD_CLASS}`}>
      <div className="mx-auto flex h-44 w-44 items-end justify-center">
        <Image
          src={useSubPose ? MAILBOX_GOAT_FULL_SUB_SRC : MAILBOX_GOAT_FULL_MAIN_SRC}
          alt=""
          width={176}
          height={176}
          className="h-full w-auto max-w-full object-contain object-bottom"
          sizes="176px"
          unoptimized
        />
      </div>
      <p className="mt-4 text-sm font-semibold text-[#3d3226]">{LOG_HOUSE_MAILBOX_EMPTY_TITLE}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-[#6e5c48]">{LOG_HOUSE_MAILBOX_EMPTY_BODY}</p>
    </section>
  );
}

function SenderAvatar({
  post,
  sizePx,
}: {
  post: MailboxPostPresentation;
  sizePx: number;
}) {
  const iconSrc = mailboxSenderIconSrc(post.senderType);
  const box = sizePx === 48 ? "h-12 w-12" : "h-11 w-11";

  return (
    <div
      className={[
        "relative isolate shrink-0 overflow-hidden rounded-full border border-[#e4d8c6]/90 bg-[#f3f0e6]",
        box,
      ].join(" ")}
    >
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          width={sizePx}
          height={sizePx}
          className={
            post.senderType === "system"
              ? "h-full w-full object-contain p-[3px]"
              : "h-full w-full object-cover object-top"
          }
          sizes={`${sizePx}px`}
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#6b5746]">
          {mailboxSenderInitial(post.senderName)}
        </span>
      )}
    </div>
  );
}

type CardProps = {
  post: MailboxPostPresentation;
  href: string;
};

/** 一覧の1通（紙カード内の行） */
export function MailboxNoticeCard({ post, href }: CardProps) {
  const unread = !post.isRead;

  return (
    <li>
      <Link
        href={href}
        className={[
          "relative flex gap-3 px-3.5 py-3.5 transition active:bg-[#f3ead8]/55",
          unread ? "bg-[#fffdf6]/80" : "",
        ].join(" ")}
      >
        {unread ? (
          <span
            className="pointer-events-none absolute inset-y-2 left-0 w-1 rounded-r-full bg-emerald-600/75"
            aria-hidden
          />
        ) : null}

        <div className={`relative shrink-0 ${unread ? "ml-1.5" : ""}`}>
          <SenderAvatar post={post} sizePx={44} />
          {unread ? (
            <span
              className="absolute -right-0.5 -top-0.5 z-[1] h-2.5 w-2.5 rounded-full border-2 border-[#fffdf6] bg-emerald-600"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[12px] text-[#7a6652]">{post.senderName}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {unread ? (
                <span className="rounded-full bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                  {LOG_HOUSE_MAILBOX_UNREAD_LABEL}
                </span>
              ) : null}
              <time className="text-[11px] text-[#9a8874]">{post.dateLabel}</time>
            </div>
          </div>
          <h2
            className={[
              "mt-0.5 truncate text-[15px] leading-snug text-[#3d3226]",
              unread ? "font-semibold" : "font-medium",
            ].join(" ")}
          >
            {post.title}
          </h2>
          <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-[#6e5c48]">
            {post.preview}
          </p>
        </div>
      </Link>
    </li>
  );
}

/** 一覧リストを1枚の紙にまとめる */
export function MailboxNoticeList({
  posts,
  detailHrefBase,
}: {
  posts: MailboxPostPresentation[];
  detailHrefBase: string;
}) {
  return (
    <ul className={`divide-y divide-[#ebe2d4] overflow-hidden ${LJD_PAPER_CARD_CLASS}`}>
      {posts.map((post) => (
        <MailboxNoticeCard
          key={post.id}
          post={post}
          href={`${detailHrefBase}/${encodeURIComponent(post.id)}`}
        />
      ))}
    </ul>
  );
}

/** 詳細ヘッダ用の差出人行 */
export function MailboxSenderRow({ post }: { post: MailboxPostPresentation }) {
  return (
    <div className="flex items-center gap-3">
      <SenderAvatar post={post} sizePx={48} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#5c4a3a]">{post.senderName}</p>
        <time className="text-xs text-[#9a8874]">{post.dateLabel}</time>
      </div>
    </div>
  );
}
