"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";
import {
  LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_COMPANION_TITLE,
  LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_PAGE_TITLE,
  LOG_HOUSE_DESK_WRITE_PROFILE_HINT,
  LOG_HOUSE_DESK_WRITE_PROFILE_LABEL,
  LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_SOLO_HREF,
  LOG_HOUSE_DESK_WRITE_SOLO_TITLE,
} from "@/lib/loghouse/logHouseDeskWritingChoice";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type Props = {
  companionWritingHref: string;
  profiles: ProfileRow[];
  activeProfileId: string;
};

/** 机からの書き方選択（ソロ / 鑑定士と）。複数プロフィール時のみ上部で切替。 */
export function LogHouseDeskWritingChoice({
  companionWritingHref,
  profiles,
  activeProfileId,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showProfilePicker = profiles.length > 1;
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]!;

  async function selectProfile(profileId: string) {
    if (busyId || profileId === activeProfileId) return;
    setError(null);
    setBusyId(profileId);
    try {
      const result = await selectViewerProfile(profileId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-1 pb-8 sm:space-y-6">
      <MyPageSubpageHeader
        title={LOG_HOUSE_DESK_WRITE_PAGE_TITLE}
        description={LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION}
        backHref="/orders"
        backLabel={LOG_HOUSE_BACK_TO_LABEL}
      />

      {showProfilePicker ? (
        <section
          aria-labelledby="desk-write-profile-heading"
          className="rounded-2xl border border-[#e6d7c2]/90 bg-[#fffaf2]/90 px-3.5 py-3.5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                id="desk-write-profile-heading"
                className="text-xs font-medium tracking-wide text-stone-500"
              >
                {LOG_HOUSE_DESK_WRITE_PROFILE_LABEL}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-stone-900">
                {activeProfile.nickname}
              </p>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">
            {LOG_HOUSE_DESK_WRITE_PROFILE_HINT}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              const isBusy = busyId === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  disabled={Boolean(busyId)}
                  aria-pressed={isActive}
                  onClick={() => void selectProfile(profile.id)}
                  className={[
                    "inline-flex min-h-[40px] items-center rounded-full border px-3.5 text-sm transition active:scale-[0.98]",
                    isActive
                      ? "border-emerald-400/80 bg-emerald-50 font-semibold text-emerald-950"
                      : "border-stone-200/90 bg-white/90 text-stone-700 hover:bg-stone-50",
                    isBusy ? "opacity-70" : "",
                  ].join(" ")}
                >
                  {isBusy ? "切替中…" : profile.nickname}
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="mt-2 text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-col gap-3">
        <Link
          href={LOG_HOUSE_DESK_WRITE_SOLO_HREF}
          className="block w-full rounded-2xl text-left transition-[transform,opacity] duration-75 active:scale-[0.99]"
          aria-disabled={Boolean(busyId)}
          onClick={(event) => {
            if (busyId) event.preventDefault();
          }}
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.writeDiary}
            title={LOG_HOUSE_DESK_WRITE_SOLO_TITLE}
            description={LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION}
            tone="wood"
          />
        </Link>

        <Link
          href={companionWritingHref}
          className="block w-full rounded-2xl text-left transition-[transform,opacity] duration-75 active:scale-[0.99]"
          aria-disabled={Boolean(busyId)}
          onClick={(event) => {
            if (busyId) event.preventDefault();
          }}
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.writeCompanion}
            title={LOG_HOUSE_DESK_WRITE_COMPANION_TITLE}
            description={LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION}
            tone="emerald"
          />
        </Link>
      </div>
    </div>
  );
}
