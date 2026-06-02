"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type Props = {
  profileId: string;
  isActive: boolean;
};

/** プロフィール詳細を開いたとき、cookie の選択中プロフィールをページの profileId に揃える */
export function ProfileDetailActiveSync({ profileId, isActive }: Props) {
  const router = useRouter();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isActive || syncedRef.current) return;
    syncedRef.current = true;
    void (async () => {
      const result = await selectViewerProfile(profileId);
      if (result.ok) {
        router.refresh();
      }
    })();
  }, [profileId, isActive, router]);

  return null;
}
