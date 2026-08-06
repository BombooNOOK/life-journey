/**
 * 端末動画ムービーのどんぐり確定APIクライアントと結果分類。
 */

import { DONGURI_MORI_LOG_DEVICE_MOVIE_COST } from "@/lib/loghouse/donguriTypes";
import { shouldMockPreviewHitoyasumiDonguri } from "@/lib/journal/moriLog/previewHitoyasumiDonguriMock";

export type MoriLogDeviceMovieDonguriStatus = {
  firstFreeAvailable: boolean;
  balance: number;
  paidCost: number;
};

export type ConfirmDeviceMovieApiOk = {
  ok: true;
  mediaId: string;
  chargeType: "first_free" | "paid";
  amount: 0 | -2;
  balance: number;
  alreadyProcessed: boolean;
};

export type ConfirmDeviceMovieClientResult =
  | { kind: "ok"; data: ConfirmDeviceMovieApiOk }
  | {
      kind: "insufficient";
      balance: number;
      required: number;
    }
  | { kind: "clear_failure"; message: string; httpStatus?: number; code?: string }
  | { kind: "uncertain"; message: string };

/** 開発用 /preview/hitoyasumi のみ。本番API・台帳には触れない */
function mockPreviewDonguriStatus(): MoriLogDeviceMovieDonguriStatus {
  return {
    firstFreeAvailable: true,
    balance: 10,
    paidCost: DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
  };
}

function mockPreviewConfirmOk(mediaId: string): ConfirmDeviceMovieClientResult {
  return {
    kind: "ok",
    data: {
      ok: true,
      mediaId,
      chargeType: "first_free",
      amount: 0,
      balance: 10,
      alreadyProcessed: false,
    },
  };
}

export async function fetchMoriLogDeviceMovieDonguriStatus(
  profileId: string,
): Promise<MoriLogDeviceMovieDonguriStatus | null> {
  if (shouldMockPreviewHitoyasumiDonguri(profileId)) {
    return mockPreviewDonguriStatus();
  }
  try {
    const qs = new URLSearchParams({ profileId: profileId.trim() });
    const res = await fetch(
      `/api/loghouse/donguri/mori-log-device-movie/status?${qs.toString()}`,
      { credentials: "same-origin", cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as MoriLogDeviceMovieDonguriStatus;
  } catch {
    return null;
  }
}

/**
 * 確定API呼び出し。
 * 4xx（402含む）は clear_failure / insufficient。
 * ネットワーク不通・タイムアウト・5xx は uncertain（作品を消さない）。
 *
 * /preview/hitoyasumi + preview-hitoyasumi + development のときだけ
 * サーバ確定を呼ばず成功レスポンスを返す（実機BGM保存フロー検証用）。
 */
export async function confirmMoriLogDeviceMovieOnServer(params: {
  profileId: string;
  mediaId: string;
  signal?: AbortSignal;
}): Promise<ConfirmDeviceMovieClientResult> {
  const profileId = params.profileId.trim();
  const mediaId = params.mediaId.trim();

  if (shouldMockPreviewHitoyasumiDonguri(profileId)) {
    if (!mediaId) {
      return { kind: "clear_failure", message: "mediaId がありません。" };
    }
    return mockPreviewConfirmOk(mediaId);
  }

  let res: Response;
  try {
    res = await fetch("/api/loghouse/donguri/mori-log-device-movie/confirm", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        mediaId,
      }),
      signal: params.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { kind: "uncertain", message: "通信が中断されました。" };
    }
    return {
      kind: "uncertain",
      message: "通信できず、確定結果を確認できませんでした。",
    };
  }

  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    if (res.status >= 500 || res.status === 0) {
      return {
        kind: "uncertain",
        message: "サーバーの応答を確認できませんでした。",
      };
    }
    return {
      kind: "clear_failure",
      message: "確定に失敗しました。",
      httpStatus: res.status,
    };
  }

  if (res.status === 402 || json.code === "ACORN_INSUFFICIENT") {
    const balance =
      typeof json.balance === "number" ? json.balance : 0;
    const required =
      typeof json.required === "number"
        ? json.required
        : DONGURI_MORI_LOG_DEVICE_MOVIE_COST;
    return { kind: "insufficient", balance, required };
  }

  if (res.ok && json.ok === true && typeof json.mediaId === "string") {
    return {
      kind: "ok",
      data: {
        ok: true,
        mediaId: json.mediaId,
        chargeType: json.chargeType === "paid" ? "paid" : "first_free",
        amount: json.amount === -2 ? -2 : 0,
        balance: typeof json.balance === "number" ? json.balance : 0,
        alreadyProcessed: Boolean(json.alreadyProcessed),
      },
    };
  }

  if (res.status >= 500) {
    return {
      kind: "uncertain",
      message:
        typeof json.error === "string"
          ? json.error
          : "サーバーで処理結果を確認できませんでした。",
    };
  }

  return {
    kind: "clear_failure",
    message:
      typeof json.error === "string" ? json.error : "確定に失敗しました。",
    httpStatus: res.status,
    code: typeof json.code === "string" ? json.code : undefined,
  };
}
