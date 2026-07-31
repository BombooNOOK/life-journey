"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_top,#3a2f24_0%,#1a1510_55%,#120e0b_100%)] text-[#f4ebe0]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(196,154,60,0.18), transparent 42%), radial-gradient(circle at 80% 80%, rgba(102,114,78,0.2), transparent 45%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-md px-4 pb-16 pt-5 sm:px-5">
        <div className="[&_a]:text-[#d9c4a4] [&_h1]:text-[#f7efe3] [&_p]:text-[#cbb89a]">
          <MyPageSubpageHeader
            title={LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
            description={LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION}
            backHref="/orders"
            backLabel={LOG_HOUSE_RETURN_TO_LABEL}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="表示の切り替え">
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
                    ? "border-[#c5b089]/90 bg-[#f3ead9] font-semibold text-[#3f3428]"
                    : "border-[#5a4a3a]/90 bg-[#2a221a]/70 text-[#d9c4a4] hover:bg-[#342a21]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="mt-10 text-center text-sm text-[#cbb89a]">読み込んでいます…</p>
        ) : visible.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#5a4a3a]/80 bg-[#241c16]/75 px-5 py-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <p className="text-base font-semibold text-[#f3ead9]">{LOG_HOUSE_HITOYASUMI_EMPTY_TITLE}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#cbb89a]">
              {LOG_HOUSE_HITOYASUMI_EMPTY_BODY}
            </p>
            <Link
              href="/orders"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c5b089]/70 bg-[#f3ead9]/95 px-4 text-sm font-semibold text-[#3f3428]"
            >
              ログハウスへ戻る
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {visible.map((item) => {
              const thumb = thumbUrls[item.id];
              const isMovie = isMoriLogCardMovieType(item.type);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(item)}
                    className="group flex w-full flex-col overflow-hidden rounded-2xl border border-[#5a4a3a]/85 bg-[#241c16]/80 text-left shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition hover:border-[#c5b089]/70 hover:bg-[#2c231c]"
                  >
                    <div className="relative aspect-[4/5] bg-[#1a1510]">
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
                        <div className="flex h-full items-center justify-center px-3 text-center text-xs leading-relaxed text-[#9a8870]">
                          {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full bg-[#1a1510]/80 px-2 py-0.5 text-[11px] font-medium text-[#f3ead9] ring-1 ring-[#c5b089]/40">
                        {hitoyasumiMediaTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="space-y-1 px-2.5 py-2.5">
                      <p className="truncate text-sm font-semibold text-[#f3ead9]">
                        {item.title?.trim() || hitoyasumiTemplateLabel(item.templateId)}
                      </p>
                      <p className="truncate text-[11px] text-[#b59f82]">
                        {formatHitoyasumiCreatedAt(item.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={detail.item.title?.trim() || LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
          onClick={closeDetail}
        >
          <div
            className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-2xl border border-[#6a5744] bg-[#1f1914] p-3 shadow-2xl sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#c5b089]">
                  {hitoyasumiMediaTypeLabel(detail.item.type)}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#f7efe3]">
                  {detail.item.title?.trim() || hitoyasumiTemplateLabel(detail.item.templateId)}
                </h2>
                <p className="mt-1 text-xs text-[#b59f82]">
                  {formatHitoyasumiCreatedAt(detail.item.createdAt)} ·{" "}
                  {hitoyasumiTemplateLabel(detail.item.templateId)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="min-h-[40px] shrink-0 rounded-lg border border-[#6a5744] bg-[#2a221a] px-3 text-sm text-[#f3ead9]"
              >
                {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
              </button>
            </div>

            {detail.objectUrl ? (
              isMoriLogCardMovieType(detail.item.type) ? (
                <video
                  src={detail.objectUrl}
                  className="mx-auto max-h-[70dvh] w-full rounded-xl bg-black"
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
              <p className="rounded-xl border border-[#5a4a3a] bg-[#241c16] px-4 py-8 text-center text-sm leading-relaxed text-[#cbb89a]">
                {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
