import type { DonguriChoView } from "@/lib/loghouse/donguriTypes";

export type DonguriStatusResponse = {
  balance: number;
  diarySaveCost: number;
  profileId?: string;
  cho?: DonguriChoView;
};

/** クライアントからどんぐり残高／帳を取り直す */
export async function fetchDonguriStatus(params?: {
  profileId?: string | null;
  includeCho?: boolean;
}): Promise<DonguriStatusResponse | null> {
  try {
    const qs = new URLSearchParams();
    if (params?.profileId?.trim()) qs.set("profileId", params.profileId.trim());
    if (params?.includeCho) qs.set("view", "cho");
    const res = await fetch(`/api/loghouse/donguri/status?${qs.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as DonguriStatusResponse;
  } catch {
    return null;
  }
}
