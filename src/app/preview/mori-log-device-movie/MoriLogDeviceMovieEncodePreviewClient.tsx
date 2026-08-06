"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  composeMoriLogDeviceMovie,
  inspectMoriLogDeviceMovieSource,
  MoriLogDeviceMovieError,
  MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD,
  type ComposeMoriLogDeviceMovieResult,
  type MoriLogDeviceMovieAudioMode,
  type MoriLogDeviceMovieSourceProbe,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovie";
import { listDeviceMovieBgmTracks } from "@/lib/journal/moriLog/deviceMovieBgmAudio";

type EnvInfo = {
  href: string;
  isSecureContext: boolean;
  videoEncoder: boolean;
  videoDecoder: boolean;
  audioEncoder: boolean;
  audioDecoder: boolean;
  userAgent: string;
};

function mapFailStage(code: string | null | undefined): string {
  switch (code) {
    case "SOURCE_TOO_LARGE":
    case "SOURCE_TOO_LONG":
    case "SOURCE_TOO_SHORT":
    case "SOURCE_UNSUPPORTED":
      return "動画の読み込み／事前検証";
    case "METADATA_LOAD_FAILED":
      return "メタデータ取得";
    case "ENCODER_UNAVAILABLE":
      return "WebCodecs 開始（または Secure Context）";
    case "VIDEO_DECODE_FAILED":
      return "映像デコード";
    case "AUDIO_DECODE_FAILED":
      return "音声デコード／再エンコード";
    case "BGM_NOT_SELECTED":
    case "BGM_LOAD_FAILED":
    case "BGM_DECODE_FAILED":
    case "BGM_TOO_SHORT":
    case "BGM_ENCODE_FAILED":
      return "BGM読み込み／焼き込み";
    case "INVALID_TRIM_RANGE":
      return "切り出し範囲";    case "ENCODE_FAILED":
      return "MP4/WebM 出力";
    case "POSTER_CREATE_FAILED":
      return "ポスター生成";
    case "CANCELLED":
      return "キャンセル";
    default:
      return code ? "不明（コード参照）" : "なし";
  }
}

export function MoriLogDeviceMovieEncodePreviewClient() {
  const [file, setFile] = useState<File | null>(null);
  const [probe, setProbe] = useState<MoriLogDeviceMovieSourceProbe | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [startSec, setStartSec] = useState(0);
  const [durationSec, setDurationSec] = useState(10);
  const [audioMode, setAudioMode] = useState<MoriLogDeviceMovieAudioMode>("original");
  const [bgmId, setBgmId] = useState<string>(listDeviceMovieBgmTracks()[0]?.id ?? "projector001");
  const [decoration, setDecoration] = useState<"lantern" | "owl" | "quill">("lantern");
  const bgmTracks = useMemo(() => listDeviceMovieBgmTracks(), []);
  const [title, setTitle] = useState("プレビュー確認");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ComposeMoriLogDeviceMovieResult | null>(null);
  const [encodeError, setEncodeError] = useState<{ code: string; message: string } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [movieUrl, setMovieUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
  const [copyFlash, setCopyFlash] = useState<string | null>(null);
  const [notes, setNotes] = useState({
    device: "",
    ios: "",
    orientationOk: "",
    audioOk: "",
    posterOk: "",
    playbackOk: "",
    crash: "",
    heat: "",
  });

  useEffect(() => {
    setEnvInfo({
      href: window.location.href,
      isSecureContext: window.isSecureContext,
      videoEncoder: typeof VideoEncoder !== "undefined",
      videoDecoder: typeof VideoDecoder !== "undefined",
      audioEncoder: typeof AudioEncoder !== "undefined",
      audioDecoder: typeof AudioDecoder !== "undefined",
      userAgent: navigator.userAgent,
    });
  }, []);

  useEffect(() => {
    if (!result) {
      setMovieUrl(null);
      setPosterUrl(null);
      return;
    }
    const nextMovie = URL.createObjectURL(result.movieBlob);
    const nextPoster = URL.createObjectURL(result.posterBlob);
    setMovieUrl(nextMovie);
    setPosterUrl(nextPoster);
    return () => {
      URL.revokeObjectURL(nextMovie);
      URL.revokeObjectURL(nextPoster);
    };
  }, [result]);

  useEffect(() => {
    const w = window as Window & {
      __moriLogDeviceMovieResult?: ComposeMoriLogDeviceMovieResult | null;
      __moriLogDeviceMovieEncodeError?: { code: string; message: string } | null;
      __moriLogDeviceMovieProbeError?: string | null;
      __moriLogDeviceMovieProbe?: MoriLogDeviceMovieSourceProbe | null;
    };
    w.__moriLogDeviceMovieResult = result;
    w.__moriLogDeviceMovieEncodeError = encodeError;
    w.__moriLogDeviceMovieProbeError = probeError;
    w.__moriLogDeviceMovieProbe = probe;
  }, [encodeError, probe, probeError, result]);

  const onPick = useCallback(async (next: File | null) => {
    setFile(next);
    setProbe(null);
    setProbeError(null);
    setResult(null);
    setEncodeError(null);
    setProgress(0);
    setElapsedMs(null);
    if (!next) return;
    try {
      const info = await inspectMoriLogDeviceMovieSource(next);
      setProbe(info);
      setStartSec(0);
      setDurationSec(Math.min(10, Math.max(3, info.durationSec)));
    } catch (error) {
      if (error instanceof MoriLogDeviceMovieError) {
        setProbeError(`${error.code}: ${error.message}`);
      } else {
        setProbeError(error instanceof Error ? error.message : "probe failed");
      }
    }
  }, []);

  const runEncode = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setEncodeError(null);
    setResult(null);
    setProgress(0);
    setElapsedMs(null);
    const ac = new AbortController();
    setAbortController(ac);
    const started = performance.now();
    try {
      const out = await composeMoriLogDeviceMovie({
        source: file,
        startSec,
        durationSec,
        audioMode,
        bgmId: audioMode === "bgm" ? bgmId : null,
        title,
        templateDecorationVariant: decoration,
        signal: ac.signal,
        onProgress: setProgress,
      });
      setResult(out);
      setProgress(1);
      setElapsedMs(Math.round(performance.now() - started));
    } catch (error) {
      setElapsedMs(Math.round(performance.now() - started));
      if (error instanceof MoriLogDeviceMovieError) {
        const cause =
          error.cause instanceof Error
            ? error.cause.message
            : error.cause != null
              ? String(error.cause)
              : "";
        setEncodeError({
          code: error.code,
          message: cause ? `${error.message}\n原因: ${cause}` : error.message,
        });
      } else {
        setEncodeError({
          code: "ENCODE_FAILED",
          message: error instanceof Error ? error.message : "encode failed",
        });
      }
    } finally {
      setBusy(false);
      setAbortController(null);
    }
  }, [audioMode, bgmId, decoration, durationSec, file, startSec, title]);

  const reportText = useMemo(() => {
    const probeCode = probeError?.split(":")[0] ?? null;
    const failCode = encodeError?.code ?? probeCode;
    return [
      "## iPhone 端末動画エンコード実機レポート",
      `機種: ${notes.device || "(記入)"}`,
      `iOS: ${notes.ios || "(記入)"}`,
      `検証URL: ${envInfo?.href ?? ""}`,
      `Secure Context: ${envInfo?.isSecureContext ? "yes" : "no"}`,
      `VideoEncoder: ${envInfo?.videoEncoder ? "yes" : "no"}`,
      `VideoDecoder: ${envInfo?.videoDecoder ? "yes" : "no"}`,
      `ページを開けたか: `,
      `動画選択できたか: `,
      `入力ファイル: ${file ? `${file.name} / ${(file.size / (1024 * 1024)).toFixed(2)}MB / ${file.type || "mime不明"}` : "(未選択)"}`,
      `元動画尺: ${probe ? `${probe.durationSec.toFixed(2)}s` : "(なし)"}`,
      `元サイズ: ${probe ? `${probe.width}x${probe.height} rot=${probe.rotationDeg}` : "(なし)"}`,
      `切り出し: start=${startSec}s duration=${durationSec}s audioMode=${audioMode}`,
      `エンコード時間: ${elapsedMs != null ? `${(elapsedMs / 1000).toFixed(1)}s` : "(未実施)"}`,
      `出力形式: ${result ? `${result.mimeType} / ${result.fileExtension}` : "(なし)"}`,
      `出力解像度: ${result ? `${result.width}x${result.height}` : "(なし)"}`,
      `完成尺: ${result ? `${result.durationSec.toFixed(2)}s` : "(なし)"}`,
      `encoder: ${result?.diagnostics?.encoder ?? "(なし)"}`,
      `縦横・回転OK: ${notes.orientationOk || "(記入)"}`,
      `元音声再生OK: ${notes.audioOk || "(記入)"}`,
      `ポスターOK: ${notes.posterOk || "(記入)"}`,
      `Safari再生OK: ${notes.playbackOk || "(記入)"}`,
      `クラッシュ/強制リロード: ${notes.crash || "(記入)"}`,
      `発熱・重さ: ${notes.heat || "(記入)"}`,
      `エラーコード: ${encodeError ? `${encodeError.code}: ${encodeError.message}` : probeError || "なし"}`,
      `失敗段階の推定: ${mapFailStage(failCode)}`,
      `UA: ${envInfo?.userAgent ?? ""}`,
    ].join("\n");
  }, [
    audioMode,
    durationSec,
    elapsedMs,
    encodeError,
    envInfo,
    file,
    notes,
    probe,
    probeError,
    result,
    startSec,
  ]);

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyFlash("コピーしました");
      window.setTimeout(() => setCopyFlash(null), 2000);
    } catch {
      setCopyFlash("コピー失敗。下のテキストを長押しで選択してください");
    }
  }, [reportText]);

  const insecure = envInfo && !envInfo.isSecureContext;
  const codecsMissing =
    envInfo && (!envInfo.videoEncoder || !envInfo.videoDecoder);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 text-sm text-[#2f2a24]">
      <header className="rounded-xl border border-[#d9cbb8] bg-[#fffdf8] px-4 py-3">
        <h1 className="text-base font-semibold">端末動画エンコード検証（dev）</h1>
        <p className="mt-1 text-xs leading-relaxed text-[#6a5b4a]">
          本番入口・保存・どんぐりは未接続。iPhone Safari 実機確認用です。HTTPS（mkcert）推奨。
          <br />
          build: <code className="rounded bg-[#f3ebe0] px-1">{MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD}</code>
        </p>
      </header>

      <section className="rounded-xl border border-[#d9cbb8] bg-white px-4 py-3">
        <h2 className="font-semibold">環境</h2>
        {envInfo ? (
          <ul className="mt-2 space-y-1 text-xs text-[#4f4336] break-all">
            <li>URL: {envInfo.href}</li>
            <li>Secure Context: {envInfo.isSecureContext ? "yes" : "no"}</li>
            <li>
              WebCodecs: VE={envInfo.videoEncoder ? "y" : "n"} / VD=
              {envInfo.videoDecoder ? "y" : "n"} / AE={envInfo.audioEncoder ? "y" : "n"} / AD=
              {envInfo.audioDecoder ? "y" : "n"}
            </li>
          </ul>
        ) : null}
        {insecure || codecsMissing ? (
          <p className="mt-2 rounded-lg bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]" role="alert">
            Secure Context / WebCodecs が不足しています。Mac で{" "}
            <code className="rounded bg-[#f3ebe0] px-1">npm run dev:lan:https</code>{" "}
            を起動し、表示された https://IP:3000/... で開いてください。初回は{" "}
            <a className="underline" href="/api/dev/mkcert-root-ca?format=cer">
              ルートCA（.cer）をダウンロード
            </a>
            して「プロファイルを許可」→ 設定でインストール→「証明書信頼設定」をオンにしてください。
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#4f6a52]">環境 OK（Secure Context + VideoEncoder）。</p>
        )}
      </section>

      <section className="rounded-xl border border-[#d9cbb8] bg-white px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="font-medium">動画選択（写真アプリから）</span>
          <input
            type="file"
            accept="video/*"
            capture={undefined}
            onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
          />
        </label>
        {file ? (
          <p className="mt-2 text-xs text-[#6a5b4a]">
            {file.name} / {(file.size / (1024 * 1024)).toFixed(2)} MB / {file.type || "(mime不明)"}
          </p>
        ) : null}
        {probeError ? (
          <p className="mt-2 rounded-lg bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]" role="alert">
            {probeError}
            <br />
            段階: {mapFailStage(probeError.split(":")[0])}
          </p>
        ) : null}
        {probe ? (
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-[#4f4336]">
            <li>尺: {probe.durationSec.toFixed(2)}s</li>
            <li>
              サイズ: {probe.width}×{probe.height}
            </li>
            <li>回転: {probe.rotationDeg}°</li>
            <li>音声: {probe.hasAudio ? (probe.canDecodeAudio ? "可" : "読取不可") : "なし"}</li>
            <li>映像読取: {probe.canDecodeVideo ? "可" : "不可"}</li>
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#d9cbb8] bg-white px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span>開始位置（秒）</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={startSec}
              onChange={(e) => setStartSec(Number(e.target.value))}
              className="rounded-lg border border-[#d9cbb8] px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>使用秒数（3〜10）</span>
            <input
              type="number"
              inputMode="decimal"
              min={3}
              max={10}
              step={0.1}
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="rounded-lg border border-[#d9cbb8] px-2 py-1.5"
            />
          </label>
        </div>
        <fieldset className="mt-3">
          <legend className="font-medium">音声</legend>
          <label className="mr-4 inline-flex items-center gap-1">
            <input
              type="radio"
              name="audio"
              checked={audioMode === "original"}
              onChange={() => setAudioMode("original")}
            />
            動画の音を使う
          </label>
          <label className="mr-4 inline-flex items-center gap-1">
            <input
              type="radio"
              name="audio"
              checked={audioMode === "bgm"}
              onChange={() => setAudioMode("bgm")}
            />
            森の音楽をつける
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="audio"
              checked={audioMode === "mute"}
              onChange={() => setAudioMode("mute")}
            />
            音なし
          </label>
        </fieldset>
        {audioMode === "bgm" ? (
          <label className="mt-3 flex flex-col gap-1">
            <span className="font-medium">BGM</span>
            <select
              value={bgmId}
              onChange={(e) => setBgmId(e.target.value)}
              className="rounded-lg border border-[#d9cbb8] px-2 py-1.5"
            >
              {bgmTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.id})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <fieldset className="mt-3">
          <legend className="font-medium">装飾バリアント（開発強制指定）</legend>
          {(["lantern", "owl", "quill"] as const).map((v) => (
            <label key={v} className="mr-4 inline-flex items-center gap-1">
              <input
                type="radio"
                name="decoration"
                checked={decoration === v}
                onChange={() => setDecoration(v)}
              />
              {v}
            </label>
          ))}
        </fieldset>
        <label className="mt-3 flex flex-col gap-1">
          <span className="font-medium">タイトル（空欄可）</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-[#d9cbb8] px-2 py-1.5"
            placeholder="森のひとこま"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!file || busy}
            onClick={() => void runEncode()}
            className="rounded-full bg-[#3f5f4c] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? "エンコード中…" : "エンコード開始"}
          </button>
          {busy && abortController ? (
            <button
              type="button"
              onClick={() => abortController.abort()}
              className="rounded-full border border-[#c4b49a] px-3 py-2 text-xs"
            >
              キャンセル
            </button>
          ) : null}
          <span className="text-xs text-[#6a5b4a]">
            進捗 {(progress * 100).toFixed(0)}%
            {elapsedMs != null ? ` / ${(elapsedMs / 1000).toFixed(1)}s` : ""}
          </span>
        </div>
        {encodeError ? (
          <p className="mt-2 rounded-lg bg-[#fdeceb] px-3 py-2 text-xs text-[#8a3b32]" role="alert">
            {encodeError.code}: {encodeError.message}
            <br />
            段階: {mapFailStage(encodeError.code)}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="rounded-xl border border-[#d9cbb8] bg-white px-4 py-3">
          <h2 className="font-semibold">結果</h2>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <li>MIME: {result.mimeType}</li>
            <li>拡張子: {result.fileExtension}</li>
            <li>尺: {result.durationSec.toFixed(2)}s</li>
            <li>
              出力: {result.width}×{result.height}
            </li>
            <li>encoder: {result.diagnostics?.encoder}</li>
            <li>audioMode: {result.audioMode}</li>
            {result.bgmId ? <li>bgmId: {result.bgmId}</li> : null}
            {result.bgmName ? <li>bgmName: {result.bgmName}</li> : null}
            <li>所要: {elapsedMs != null ? `${(elapsedMs / 1000).toFixed(1)}s` : "-"}</li>
          </ul>
          <div className="mt-3 grid gap-3">
            {movieUrl ? (
              <video
                src={movieUrl}
                controls
                playsInline
                muted={result.audioMode === "mute"}
                className="w-full rounded-lg bg-black"
              />
            ) : null}
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt="poster" className="w-full rounded-lg border border-[#e6dac8]" />
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#d9cbb8] bg-white px-4 py-3">
        <h2 className="font-semibold">記録メモ（コピペ用）</h2>
        <p className="mt-1 text-xs text-[#6a5b4a]">
          ケースA〜C を試したあと、目視結果を短く書いて「レポートをコピー」→チャットへ貼ってください。
        </p>
        <div className="mt-2 grid gap-2">
          {(
            [
              ["device", "機種（例: iPhone 15）"],
              ["ios", "iOS（例: 18.5）"],
              ["orientationOk", "縦横OK?（yes/no）"],
              ["audioOk", "音声OK?（original/mute それぞれ）"],
              ["posterOk", "ポスターOK?"],
              ["playbackOk", "Safari再生OK?"],
              ["crash", "クラッシュ/強制リロード?"],
              ["heat", "発熱・重さ?"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1 text-xs">
              <span>{label}</span>
              <input
                value={notes[key]}
                onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                className="rounded-lg border border-[#d9cbb8] px-2 py-1.5"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void copyReport()}
          className="mt-3 rounded-full border border-[#3f5f4c] px-4 py-2 text-xs font-semibold text-[#3f5f4c]"
        >
          レポートをコピー
        </button>
        {copyFlash ? <p className="mt-2 text-xs text-[#4f6a52]">{copyFlash}</p> : null}
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f7f1e6] p-3 text-[10px] leading-relaxed text-[#4f4336]">
          {reportText}
        </pre>
      </section>
    </div>
  );
}
