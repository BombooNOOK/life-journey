"use client";

import { useEffect, useRef, useState } from "react";

import {
  loadDeviceMovieBasicAssets,
  paintDeviceMovieBasicFrame,
} from "@/lib/journal/moriLog/deviceMovieBasicPaint";
import {
  DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX,
  deviceMovieBasicForegroundPath,
  scaleDeviceMovieBasicLayout,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";

const FG_SRC = deviceMovieBasicForegroundPath();
const PREVIEW_W = 328;
const PREVIEW_H = 410;

type Probe = {
  label: string;
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
};

function probeCanvas(
  ctx: CanvasRenderingContext2D,
  points: { label: string; x: number; y: number }[],
): Probe[] {
  return points.map(({ label, x, y }) => {
    const px = ctx.getImageData(x, y, 1, 1).data;
    return { label, x, y, r: px[0]!, g: px[1]!, b: px[2]!, a: px[3]! };
  });
}

/**
 * 前面オーバーレイの透明がどこで失われるかの切り分け。
 * 1) PNG を白背景に <img>
 * 2) Canvas に PNG だけ描画（alpha true / false）
 * 3) 背景＋色板＋オーバーレイの合成（本番と同経路）
 */
export function OverlayAlphaDebugClient() {
  const canvasAlphaTrueRef = useRef<HTMLCanvasElement>(null);
  const canvasAlphaFalseRef = useRef<HTMLCanvasElement>(null);
  const canvasComposeRef = useRef<HTMLCanvasElement>(null);
  const [probes, setProbes] = useState<{
    alphaTrue: Probe[];
    alphaFalse: Probe[];
    compose: Probe[];
  } | null>(null);
  const [loadNote, setLoadNote] = useState<string>("読み込み中…");
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const img = new Image();
        img.decoding = "async";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`failed to load ${FG_SRC}`));
          img.src = FG_SRC;
        });
        if (cancelled) return;
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });

        const points = [
          { label: "左上角", x: 2, y: 2 },
          { label: "窓中央", x: Math.floor(PREVIEW_W / 2), y: Math.floor(PREVIEW_H * 0.4) },
          { label: "窓上縁付近", x: Math.floor(PREVIEW_W / 2), y: Math.floor(PREVIEW_H * (67 / 1024)) },
          { label: "紙枠付近", x: Math.floor(PREVIEW_W * 0.12), y: Math.floor(PREVIEW_H * 0.12) },
        ];

        // Stage 2a: alpha: true + 白下地
        const cTrue = canvasAlphaTrueRef.current;
        if (cTrue) {
          cTrue.width = PREVIEW_W;
          cTrue.height = PREVIEW_H;
          const ctx = cTrue.getContext("2d", { alpha: true });
          if (!ctx) throw new Error("alpha:true context missing");
          ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
          ctx.drawImage(img, 0, 0, PREVIEW_W, PREVIEW_H);
          const alphaTrue = probeCanvas(ctx, points);

          // Stage 2b: alpha: false（エンコードと同設定）
          const cFalse = canvasAlphaFalseRef.current;
          if (!cFalse) throw new Error("alpha false canvas missing");
          cFalse.width = PREVIEW_W;
          cFalse.height = PREVIEW_H;
          const ctxF = cFalse.getContext("2d", { alpha: false });
          if (!ctxF) throw new Error("alpha:false context missing");
          ctxF.fillStyle = "#ffffff";
          ctxF.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
          ctxF.drawImage(img, 0, 0, PREVIEW_W, PREVIEW_H);
          const alphaFalse = probeCanvas(ctxF, points);

          // Stage 3: 本番と同経路の合成（色板＝動画の代わり）
          const cCompose = canvasComposeRef.current;
          if (!cCompose) throw new Error("compose canvas missing");
          cCompose.width = PREVIEW_W;
          cCompose.height = PREVIEW_H;
          const ctxC = cCompose.getContext("2d", { alpha: false });
          if (!ctxC) throw new Error("compose context missing");
          const assets = await loadDeviceMovieBasicAssets("lantern");
          const layout = scaleDeviceMovieBasicLayout(PREVIEW_W, PREVIEW_H, {
            edgePadDesignPx: DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX,
          });
          paintDeviceMovieBasicFrame({
            ctx: ctxC,
            layout,
            assets,
            sourceWidth: 720,
            sourceHeight: 1280,
            title: "透過切り分け",
            dateKey: "2026-08-07",
            drawVideo: ({ ctx: vctx, dx, dy, dw, dh }) => {
              const g = vctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
              g.addColorStop(0, "#6db3ff");
              g.addColorStop(1, "#3f8f5a");
              vctx.fillStyle = g;
              vctx.fillRect(dx, dy, dw, dh);
            },
          });
          const compose = probeCanvas(ctxC, points);

          if (!cancelled) {
            setProbes({ alphaTrue, alphaFalse, compose });
            setLoadNote(
              `参照: ${FG_SRC} / natural ${img.naturalWidth}×${img.naturalHeight} / EDGE_PAD=${DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX}`,
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoadNote(e instanceof Error ? e.message : "読み込み失敗");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 text-sm text-[#2f2a24]">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-[#8a7660]">
          /preview/mori-log-device-movie/overlay-alpha
        </p>
        <h1 className="text-lg font-semibold">前面オーバーレイ透過の切り分け</h1>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#5c4d3d]">
          {`方針: 黒→透明化はせず、どの段階で黒背景化するか比較する。
1) PNG を白背景に重ねた表示
2) Canvas に PNG だけ描画（alpha true / false）
3) 本番と同経路の合成（背景＋色板動画＋オーバーレイ）`}
        </p>
        <p className="rounded-lg bg-white/70 px-3 py-2 text-xs text-[#3f3428]" role="status">
          {loadNote}
          {natural ? ` / 読込後サイズ ${natural.w}×${natural.h}` : null}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-semibold">1. PNG 単体を白背景に重ねた表示</h2>
        <p className="text-xs text-[#6a5846]">
          ブラウザが公開中のファイルをそのまま表示。窓が白く抜けていれば、配信 PNG の窓は透過。
        </p>
        <div className="inline-block bg-white p-3 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FG_SRC}
            alt="foreground-overlay on white"
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="block h-auto w-[328px]"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold">2a. Canvas 描画（alpha: true）</h2>
          <p className="text-xs text-[#6a5846]">白で塗ってから drawImage(overlay)</p>
          <canvas
            ref={canvasAlphaTrueRef}
            className="block max-w-full border border-[#e4d8c6] bg-white shadow-sm"
            style={{ width: PREVIEW_W, height: PREVIEW_H }}
          />
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">2b. Canvas 描画（alpha: false）</h2>
          <p className="text-xs text-[#6a5846]">
            エンコードと同じ設定。下地が白なら窓は白になるはず（透明→黒にはならない）。
          </p>
          <canvas
            ref={canvasAlphaFalseRef}
            className="block max-w-full border border-[#e4d8c6] bg-white shadow-sm"
            style={{ width: PREVIEW_W, height: PREVIEW_H }}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. 動画合成相当（本番 paint 経路）</h2>
        <p className="text-xs text-[#6a5846]">
          loadDeviceMovieBasicAssets → paintDeviceMovieBasicFrame（青緑の色板が「動画」）。
          ここでだけ黒い縁が出るなら、縁ピクセル／EDGE_PAD・マットが原因候補。
        </p>
        <canvas
          ref={canvasComposeRef}
          className="block max-w-full border border-[#e4d8c6] shadow-sm"
          style={{ width: PREVIEW_W, height: PREVIEW_H }}
        />
      </section>

      {probes ? (
        <section className="space-y-3 rounded-xl border border-[#e4d8c6] bg-white/80 p-4">
          <h2 className="font-semibold">ピクセル probe（getImageData）</h2>
          {(
            [
              ["2a alpha:true", probes.alphaTrue],
              ["2b alpha:false", probes.alphaFalse],
              ["3 compose", probes.compose],
            ] as const
          ).map(([title, rows]) => (
            <div key={title}>
              <p className="text-xs font-medium text-[#5c4d3d]">{title}</p>
              <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-[#3f3428]">
                {rows.map((p) => (
                  <li key={`${title}-${p.label}`}>
                    {p.label} ({p.x},{p.y}) → rgba({p.r},{p.g},{p.b},{p.a})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
