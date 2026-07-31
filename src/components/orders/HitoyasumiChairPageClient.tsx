"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  filterHitoyasumiMedia,
  formatHitoyasumiCreatedAt,
  hitoyasumiMediaTypeLabel,
  hitoyasumiTemplateLabel,
  listHitoyasumiMedia,
  type HitoyasumiMediaFilter,
} from "@/lib/journal/moriLog/hitoyasumiMedia";
import { getMoriLogMediaBlob } from "@/lib/journal/moriLog/moriLogMediaBlobStore";
import { isMoriLogCardMovieType, type MoriLogMedia } from "@/lib/journal/moriLog/moriLogMedia";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import {
  LOG_HOUSE_HITOYASUMI_BG_SRC,
  LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL,
  LOG_HOUSE_HITOYASUMI_EMPTY_BODY,
  LOG_HOUSE_HITOYASUMI_EMPTY_TITLE,
  LOG_HOUSE_HITOYASUMI_FILTER_ALL,
  LOG_HOUSE_HITOYASUMI_FILTER_CARD,
  LOG_HOUSE_HITOYASUMI_FILTER_MOVIE,
  LOG_HOUSE_HITOYASUMI_NO_PREVIEW,
  LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION,
  LOG_HOUSE_HITOYASUMI_PAGE_TITLE,
} from "@/lib/loghouse/logHouseHitoyasumiCopy";

type Props = {
  profileId: string;
};

type DetailState = {
  item: MoriLogMedia;
  objectUrl: string | null;
};

const FILTERS: { id: HitoyasumiMediaFilter; label: string }[] = [
  { id: "all", label: LOG_HOUSE_HITOYASUMI_FILTER_ALL },
  { id: "card_image", label: LOG_HOUSE_HITOYASUMI_FILTER_CARD },
  { id: "card_movie", label: LOG_HOUSE_HITOYASUMI_FILTER_MOVIE },
];

export function HitoyasumiChairPageClient({ profileId }: Props) {
  const [items, setItems] = useState<MoriLogMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HitoyasumiMediaFilter>("all");
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<DetailState | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listHitoyasumiMedia(profileId);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];

    void (async () => {
      const next: Record<string, string> = {};
      for (const item of items) {
        const blob = await getMoriLogMediaBlob(item.id);
        if (!blob || cancelled) continue;
        const url = URL.createObjectURL(blob);
        created.push(url);
        next[item.id] = url;
      }
      if (!cancelled) setThumbUrls(next);
    })();

    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [items]);

  useEffect(() => {
    return () => {
      if (detail?.objectUrl) URL.revokeObjectURL(detail.objectUrl);
    };
  }, [detail]);

  const visible = useMemo(() => filterHitoyasumiMedia(items, filter), [filter, items]);

  const openDetail = useCallback(async (item: MoriLogMedia) => {
    const blob = await getMoriLogMediaBlob(item.id);
    const objectUrl = blob ? URL.createObjectURL(blob) : null;
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return { item, objectUrl };
    });
  }, []);

  const closeDetail = useCallback(() => {
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden text-[#3f3428]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <Image
          src={LOG_HOUSE_HITOYASUMI_BG_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* 絵を優先しつつ、紙UIの可読性だけ少し上げる */}
        <div className="absolute inset-0 bg-[#1a120c]/18" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a120c]/28 via-transparent to-[#1a120c]/42" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-16 pt-5 sm:px-5">
        <Link
          href="/orders"
          className="inline-flex w-fit min-h-[40px] items-center rounded-full border border-[#e4d5c0]/85 bg-[#fffaf2]/88 px-3.5 text-sm text-[#5c4a35] shadow-[0_4px_14px_rgba(40,28,16,0.12)] backdrop-blur-[2px] transition hover:bg-[#fffaf2]"
        >
          ← {LOG_HOUSE_RETURN_TO_LABEL}
        </Link>

        <header className="mt-4 rounded-[1.35rem] border border-[#e8dcc8]/90 bg-[#fffaf2]/90 px-4 py-4 shadow-[0_10px_28px_rgba(40,28,16,0.14)] backdrop-blur-[3px] sm:px-5">
          <h1 className="text-2xl font-bold tracking-wide text-[#3d3226]">
            {LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6e5c48]">
            {LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION}
          </p>
        </header>

        {/* 将来アルバム・振り返りを足せる余白を残したフィルター帯 */}
        <div
          className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-[#e0d2bc]/80 bg-[#f7efe3]/78 px-2.5 py-2.5 shadow-[0_6px_18px_rgba(40,28,16,0.1)] backdrop-blur-[2px]"
          role="tablist"
          aria-label="表示の切り替え"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${
                  active
                    ? "border-[#c5b089]/95 bg-[#fffdf8] font-semibold text-[#3f3428] shadow-sm"
                    : "border-transparent bg-transparent text-[#6a5846] hover:bg-[#fffaf2]/70"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="mt-10 text-center text-sm text-[#fffaf2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            読み込んでいます…
          </p>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-[1.35rem] border border-[#e4d5c0]/90 bg-[#fffaf2]/92 px-5 py-8 text-center shadow-[0_12px_32px_rgba(40,28,16,0.16)] backdrop-blur-[2px]">
            <p className="text-base font-semibold text-[#3f3428]">{LOG_HOUSE_HITOYASUMI_EMPTY_TITLE}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#6e5c48]">
              {LOG_HOUSE_HITOYASUMI_EMPTY_BODY}
            </p>
            <Link
              href="/orders"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c5b089]/80 bg-[#f3ead9] px-4 text-sm font-semibold text-[#3f3428]"
            >
              ログハウスへ戻る
            </Link>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {visible.map((item) => {
              const thumb = thumbUrls[item.id];
              const isMovie = isMoriLogCardMovieType(item.type);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(item)}
                    className="group flex w-full flex-col overflow-hidden rounded-[1.15rem] border border-[#e4d5c0]/95 bg-[#fffaf2]/94 text-left shadow-[0_8px_22px_rgba(40,28,16,0.14)] backdrop-blur-[1px] transition hover:-translate-y-0.5 hover:border-[#c5b089]/90 hover:shadow-[0_12px_28px_rgba(40,28,16,0.18)]"
                  >
                    <div className="relative aspect-[4/5] bg-[#efe4d4]">
                      {thumb ? (
                        isMovie ? (
                          <video
                            src={thumb}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center px-3 text-center text-xs leading-relaxed text-[#8a7660]">
                          {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-md border border-[#e0d2bc]/90 bg-[#fffaf2]/92 px-2 py-0.5 text-[11px] font-medium text-[#5c4a35] shadow-sm">
                        {hitoyasumiMediaTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="space-y-1 border-t border-[#eadfce]/90 bg-[#fffaf2]/96 px-2.5 py-2.5">
                      <p className="truncate text-sm font-semibold text-[#3f3428]">
                        {item.title?.trim() || hitoyasumiTemplateLabel(item.templateId)}
                      </p>
                      <p className="truncate text-[11px] text-[#8a7660]">
                        {formatHitoyasumiCreatedAt(item.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* 将来のアルバム／振り返り導線用の余白 */}
        <div className="mt-auto pt-10" aria-hidden />
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a120c]/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={detail.item.title?.trim() || LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
          onClick={closeDetail}
        >
          <div
            className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[1.35rem] border border-[#e4d5c0]/95 bg-[#fffaf2] p-3 shadow-[0_20px_50px_rgba(20,12,8,0.35)] sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-md border border-[#e0d2bc]/90 bg-[#f7efe3] px-2 py-0.5 text-xs font-medium text-[#5c4a35]">
                  {hitoyasumiMediaTypeLabel(detail.item.type)}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#3d3226]">
                  {detail.item.title?.trim() || hitoyasumiTemplateLabel(detail.item.templateId)}
                </h2>
                <p className="mt-1 text-xs text-[#8a7660]">
                  {formatHitoyasumiCreatedAt(detail.item.createdAt)} ·{" "}
                  {hitoyasumiTemplateLabel(detail.item.templateId)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="min-h-[40px] shrink-0 rounded-lg border border-[#e0d2bc]/95 bg-[#f7efe3] px-3 text-sm text-[#5c4a35]"
              >
                {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
              </button>
            </div>

            {detail.objectUrl ? (
              isMoriLogCardMovieType(detail.item.type) ? (
                <video
                  src={detail.objectUrl}
                  className="mx-auto max-h-[70dvh] w-full rounded-xl bg-[#2a221a]"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.objectUrl}
                  alt=""
                  className="mx-auto max-h-[70dvh] w-full rounded-xl object-contain"
                />
              )
            ) : (
              <p className="rounded-xl border border-[#e0d2bc] bg-[#f7efe3] px-4 py-8 text-center text-sm leading-relaxed text-[#6e5c48]">
                {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
