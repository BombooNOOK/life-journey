"use client";

import { useEffect, useState } from "react";

type Props = {
  profileId: string;
  onSelectTag: (tagWithHash: string) => void;
  className?: string;
};

/** 過去に使ったタグをボタン表示（押すと検索欄に入力） */
export function DiaryPastTagButtons({ profileId, onSelectTag, className = "" }: Props) {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!profileId) {
      setTags([]);
      return;
    }

    let cancelled = false;
    const qs = new URLSearchParams({
      profileId,
      _: String(Date.now()),
    });

    void fetch(`/api/journal/tags?${qs.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json()) as { tags?: string[] };
        if (!res.ok || cancelled) return;
        setTags(Array.isArray(data.tags) ? data.tags : []);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (tags.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-xs font-medium text-stone-600">よく使うタグ</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(`#${tag}`)}
            className="min-h-[36px] rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
