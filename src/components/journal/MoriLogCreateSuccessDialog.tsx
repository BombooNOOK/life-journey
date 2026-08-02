"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  MORI_LOG_CREATE_SUCCESS_BODY,
  MORI_LOG_CREATE_SUCCESS_BODY_NO_AUDIO,
  MORI_LOG_CREATE_SUCCESS_CARD_TITLE,
  MORI_LOG_CREATE_SUCCESS_CONTINUE,
  MORI_LOG_CREATE_SUCCESS_GO_CHAIR,
  MORI_LOG_CREATE_SUCCESS_MOVIE_TITLE,
} from "@/lib/journal/moriLog/moriLogCopy";
import { LOG_HOUSE_HITOYASUMI_PAGE_PATH } from "@/lib/loghouse/logHouseHitoyasumiCopy";
import { LJD_PAPER_CARD_CLASS } from "@/lib/ljd/ljdPaperSurface";

const CHAIR_ILLUST_SRC = "/images/ljd/loghouse-room/loghouse_chair.png";

export type MoriLogCreateSuccessKind = "card" | "movie";

type Props = {
  kind: MoriLogCreateSuccessKind;
  /** ムービーで BGM を載せられなかった場合 */
  audioOmitted?: boolean;
  onContinue: () => void;
};

export function MoriLogCreateSuccessDialog({ kind, audioOmitted = false, onContinue }: Props) {
  const [entered, setEntered] = useState(false);
  const title =
    kind === "card" ? MORI_LOG_CREATE_SUCCESS_CARD_TITLE : MORI_LOG_CREATE_SUCCESS_MOVIE_TITLE;
  const body =
    kind === "movie" && audioOmitted
      ? MORI_LOG_CREATE_SUCCESS_BODY_NO_AUDIO
      : MORI_LOG_CREATE_SUCCESS_BODY;

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a120c]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mori-log-create-success-title"
    >
      <div
        className={[
          LJD_PAPER_CARD_CLASS,
          "w-full max-w-sm px-5 py-5 transition duration-500 ease-out sm:px-6",
          entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.97] opacity-0",
        ].join(" ")}
      >
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-[#e8dcc8]/90 bg-[#fffaf2]">
          <Image
            src={CHAIR_ILLUST_SRC}
            alt=""
            width={112}
            height={112}
            className="h-[5.5rem] w-[5.5rem] object-contain"
            unoptimized
          />
        </div>
        <h3
          id="mori-log-create-success-title"
          className="mt-4 text-center text-lg font-semibold tracking-wide text-[#3f3428]"
        >
          {title}
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#5c4a35]">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={LOG_HOUSE_HITOYASUMI_PAGE_PATH}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-emerald-800 bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900"
          >
            {MORI_LOG_CREATE_SUCCESS_GO_CHAIR}
          </Link>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c4b49a] bg-[#faf3e8] px-4 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8]"
          >
            {MORI_LOG_CREATE_SUCCESS_CONTINUE}
          </button>
        </div>
      </div>
    </div>
  );
}
