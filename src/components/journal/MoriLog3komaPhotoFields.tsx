"use client";

import { useId, useRef } from "react";

import {
  MORI_3KOMA_PANEL_LABELS,
  MORI_3KOMA_PHOTO_SOURCE_IDS,
  MORI_3KOMA_SOURCE_LABELS,
  assignMori3komaPanel,
  type Mori3komaPanelAssignment,
  type Mori3komaPhotoSourceId,
} from "@/lib/journal/moriLog/moriLog3komaPhotos";

export type Mori3komaExtraPhoto = {
  previewUrl: string;
  /** JPEG base64（data: 接頭辞なし）。3コマ枠は小さいので軽量で足りる */
  jpegBase64: string;
};

type Props = {
  hasMainPhoto: boolean;
  mainPhotoSrc: string | null;
  extras: [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null];
  assignment: Mori3komaPanelAssignment;
  onExtrasChange: (extras: [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null]) => void;
  onAssignmentChange: (assignment: Mori3komaPanelAssignment) => void;
};

/** 設計枠 340×220 → 出力約2倍でも 640 あれば十分 */
const MAX_EDGE_PX = 640;
const JPEG_QUALITY = 0.62;
const MAX_EXTRA_UPLOAD_BYTES = 160_000;

async function decodeImageToBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // HEIC 等で createImageBitmap が落ちる端末向け
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("画像を読み込めませんでした。JPEG/PNGでお試しください。"));
        img.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("画像を処理できませんでした。");
      ctx.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92);
      });
      if (!blob) throw new Error("画像の変換に失敗しました。");
      return await createImageBitmap(blob);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function compressImageFile(file: File): Promise<Mori3komaExtraPhoto> {
  if (file.type && !file.type.startsWith("image/") && file.type !== "application/octet-stream") {
    throw new Error("画像ファイルを選んでください。");
  }

  const bitmap = await decodeImageToBitmap(file);
  try {
    let scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    let quality = JPEG_QUALITY;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("画像を処理できませんでした。");
      ctx.drawImage(bitmap, 0, 0, width, height);
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (!blob) throw new Error("画像の圧縮に失敗しました。");
      if (blob.size <= MAX_EXTRA_UPLOAD_BYTES) break;
      scale *= 0.8;
      quality = Math.max(0.45, quality - 0.08);
    }

    if (!blob) throw new Error("画像の圧縮に失敗しました。");
    const jpegBase64 = await blobToBase64(blob);
    const previewUrl = URL.createObjectURL(blob);
    return { previewUrl, jpegBase64 };
  } finally {
    bitmap.close();
  }
}

function ExtraSlot({
  label,
  photo,
  onPick,
  onClear,
}: {
  label: string;
  photo: Mori3komaExtraPhoto | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {photo ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-9 rounded-md px-2 text-xs font-medium text-stone-600 underline-offset-2 hover:underline"
          >
            はずす
          </button>
        ) : null}
      </div>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.previewUrl}
          alt=""
          className="mt-2 aspect-[3/2] w-full rounded-md object-cover"
        />
      ) : (
        <label
          htmlFor={inputId}
          className="mt-2 flex min-h-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50 px-3 text-center text-sm text-stone-600 hover:bg-stone-100"
        >
          写真を追加
        </label>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          event.target.value = "";
          if (nextFile) onPick(nextFile);
        }}
      />
      {photo ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-emerald-800 underline-offset-2 hover:underline"
          onClick={() => inputRef.current?.click()}
        >
          差し替える
        </button>
      ) : null}
    </div>
  );
}

export function MoriLog3komaPhotoFields({
  hasMainPhoto,
  mainPhotoSrc,
  extras,
  assignment,
  onExtrasChange,
  onAssignmentChange,
}: Props) {
  const setExtra = async (index: 0 | 1, file: File) => {
    try {
      const compressed = await compressImageFile(file);
      const prev = extras[index];
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      const next: [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null] = [...extras];
      next[index] = compressed;
      onExtrasChange(next);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "写真を読み込めませんでした。");
    }
  };

  const clearExtra = (index: 0 | 1) => {
    const prev = extras[index];
    if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
    const next: [Mori3komaExtraPhoto | null, Mori3komaExtraPhoto | null] = [...extras];
    next[index] = null;
    onExtrasChange(next);
    let assignmentNext = assignment;
    const sourceId: Mori3komaPhotoSourceId = index === 0 ? "extra0" : "extra1";
    for (let i = 0; i < 3; i += 1) {
      if (assignmentNext[i] === sourceId) {
        assignmentNext = assignMori3komaPanel(assignmentNext, i as 0 | 1 | 2, "main");
      }
    }
    onAssignmentChange(assignmentNext);
  };

  const sourceAvailable = (id: Mori3komaPhotoSourceId): boolean => {
    if (id === "main") return hasMainPhoto;
    if (id === "extra0") return extras[0] != null;
    return extras[1] != null;
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-dashed border-emerald-200/80 bg-emerald-50/40 px-3 py-3">
      <div>
        <p className="text-sm font-medium text-stone-800">3コマの写真</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          あしあとに残した写真は必ず1コマ以上使います。追加で最大2枚まで入れて、上・中・下の配置を自由に変えられます。
        </p>
      </div>

      {!hasMainPhoto ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          このあしあとにはまだ写真がありません。先にあしあとへ写真を残すと、3コマに使えます。
        </p>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-white p-2">
          {mainPhotoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainPhotoSrc}
              alt=""
              className="h-14 w-14 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded bg-stone-200" />
          )}
          <div>
            <p className="text-sm font-medium text-stone-800">あしあとの写真</p>
            <p className="text-xs text-stone-500">本編（必ずどれかのコマに入ります）</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <ExtraSlot
          label="追加写真 1"
          photo={extras[0]}
          onPick={(file) => void setExtra(0, file)}
          onClear={() => clearExtra(0)}
        />
        <ExtraSlot
          label="追加写真 2"
          photo={extras[1]}
          onPick={(file) => void setExtra(1, file)}
          onClear={() => clearExtra(1)}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-stone-800">コマへの配置</legend>
        <div className="space-y-2">
          {MORI_3KOMA_PANEL_LABELS.map((label, index) => (
            <label key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="shrink-0 text-xs font-medium text-stone-600 sm:w-28">{label}</span>
              <select
                value={assignment[index]!}
                onChange={(event) => {
                  const next = assignMori3komaPanel(
                    assignment,
                    index as 0 | 1 | 2,
                    event.target.value as Mori3komaPhotoSourceId,
                  );
                  onAssignmentChange(next);
                }}
                className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                {MORI_3KOMA_PHOTO_SOURCE_IDS.map((id) => (
                  <option key={id} value={id} disabled={!sourceAvailable(id) && assignment[index] !== id}>
                    {MORI_3KOMA_SOURCE_LABELS[id]}
                    {!sourceAvailable(id) ? "（未追加）" : ""}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-stone-500">
          追加写真をコマに割り当てると、プレビューに反映されます。あしあとの写真は少なくとも1コマに残ります。
        </p>
      </fieldset>
    </div>
  );
}
