"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

import {
  formatEraDateFromIso,
  formatWesternDateJa,
  formatYearOptionLabel,
} from "@/lib/date/japaneseEra";
import { daysInMonth, toIsoDateString } from "@/lib/order/birthDate";
import { romanizeFromKanaParts } from "@/lib/numerology/kanaToRomaji";
import { OrderFormProfileNotice } from "@/components/orders/OrderFormProfileNotice";
import { FirstVisitFlowBrowserBackGuard } from "@/components/orders/FirstVisitFlowBrowserBackGuard";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import {
  FIRST_VISIT_OWL_LOADING_HINT,
  ORDER_NAVIGATING_BOOKSHELF_HINT,
  ORDER_NAVIGATING_BOOKSHELF_LABEL,
  ORDER_SUBMITTING_LABEL,
} from "@/lib/onboarding/firstVisitWizard/loadingCopy";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";
import { FIRST_VISIT_KANTEI_HALL_SIGN_LABEL } from "@/lib/onboarding/firstVisitWizard/kanteiHallCopy";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";
import { setBookshelfKanteiGuideFlag } from "@/lib/onboarding/firstVisitWizard/session";
import { isHiraganaOnly } from "@/lib/validation/hiragana";

const MIN_YEAR = 1870;

function yearRange(): number[] {
  const max = new Date().getFullYear();
  const ys: number[] = [];
  for (let y = max; y >= MIN_YEAR; y--) ys.push(y);
  return ys;
}

type FormState = {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
};

const initialYear = 1990;

const empty: FormState = {
  lastName: "",
  firstName: "",
  lastNameKana: "",
  firstNameKana: "",
  birthYear: initialYear,
  birthMonth: 1,
  birthDay: 1,
};

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profile")?.trim() ?? "";
  const [form, setForm] = useState<FormState>(empty);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitPhase, setSubmitPhase] = useState<"idle" | "submitting" | "navigating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  const years = useMemo(() => yearRange(), []);

  const clampDay = useCallback((y: number, m: number, d: number) => {
    const maxD = daysInMonth(y, m);
    return Math.min(d, maxD);
  }, []);

  const setBirthYear = (y: number) => {
    setForm((f) => {
      const d = clampDay(y, f.birthMonth, f.birthDay);
      return { ...f, birthYear: y, birthDay: d };
    });
  };

  const setBirthMonth = (m: number) => {
    setForm((f) => {
      const d = clampDay(f.birthYear, m, f.birthDay);
      return { ...f, birthMonth: m, birthDay: d };
    });
  };

  const setBirthDay = (d: number) => {
    setForm((f) => ({ ...f, birthDay: d }));
  };

  const previewRoman = useMemo(() => {
    try {
      if (!form.lastNameKana.trim() || !form.firstNameKana.trim()) return null;
      if (!isHiraganaOnly(form.lastNameKana) || !isHiraganaOnly(form.firstNameKana)) {
        return null;
      }
      return romanizeFromKanaParts(form.lastNameKana, form.firstNameKana);
    } catch {
      return null;
    }
  }, [form.lastNameKana, form.firstNameKana]);

  const previewDates = useMemo(() => {
    try {
      toIsoDateString(form.birthYear, form.birthMonth, form.birthDay);
      const iso = toIsoDateString(form.birthYear, form.birthMonth, form.birthDay);
      return {
        iso,
        western: formatWesternDateJa(form.birthYear, form.birthMonth, form.birthDay),
        era: formatEraDateFromIso(iso),
      };
    } catch {
      return null;
    }
  }, [form.birthYear, form.birthMonth, form.birthDay]);

  const dayOptions = useMemo(() => {
    const maxD = daysInMonth(form.birthYear, form.birthMonth);
    return Array.from({ length: maxD }, (_, i) => i + 1);
  }, [form.birthYear, form.birthMonth]);

  function validateStep1(): string | null {
    if (!form.lastName.trim() || !form.firstName.trim()) {
      return "姓・名を入力してください。";
    }
    if (!form.lastNameKana.trim() || !form.firstNameKana.trim()) {
      return "ふりがな（せい・めい）は必須です。";
    }
    if (!isHiraganaOnly(form.lastNameKana) || !isHiraganaOnly(form.firstNameKana)) {
      return "ふりがなはひらがなのみで入力してください。";
    }
    try {
      romanizeFromKanaParts(form.lastNameKana.trim(), form.firstNameKana.trim());
    } catch (e) {
      return e instanceof Error ? e.message : "ふりがなを確認してください。";
    }
    try {
      toIsoDateString(form.birthYear, form.birthMonth, form.birthDay);
    } catch {
      return "生年月日を確認してください。";
    }
    return null;
  }

  function goNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    try {
      const msg = validateStep1();
      if (msg) {
        setError(msg);
        return;
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "入力内容を確認してください。");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setSubmitPhase("submitting");
    setError(null);
    setExistingOrderId(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName: form.lastName.trim(),
          firstName: form.firstName.trim(),
          lastNameKana: form.lastNameKana.trim(),
          firstNameKana: form.firstNameKana.trim(),
          birthYear: form.birthYear,
          birthMonth: form.birthMonth,
          birthDay: form.birthDay,
          profileId,
        }),
      });

      let data: {
        id?: string;
        profileId?: string;
        error?: string;
        hint?: string;
        code?: string;
        existingOrderId?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setError(
          res.ok
            ? "サーバーからの応答が読み取れませんでした。しばらくしてから再度お試しください。"
            : `保存に失敗しました（HTTP ${res.status}・サーバーが JSON 以外を返している可能性。ターミナルログを確認）`,
        );
        setSubmitPhase("idle");
        return;
      }

      if (!res.ok) {
        if (res.status === 409 && data.code === "ORDER_EXISTS_FOR_PROFILE") {
          setError(data.error ?? "このプロフィールには既に鑑定書があります。");
          setExistingOrderId(data.existingOrderId ?? null);
          if (data.existingOrderId) {
            setSubmitPhase("navigating");
            router.replace("/orders/bookshelf#bookshelf-kantei-books");
          } else {
            setSubmitPhase("idle");
          }
          return;
        }
        const parts: string[] = [];
        if (data.error) parts.push(data.error);
        else parts.push("保存に失敗しました（理由はサーバーから返っていません）");
        if (data.code) parts.push(`[コード: ${data.code}]`);
        if (data.hint) parts.push(data.hint);
        if (!data.error && res.status >= 500) {
          parts.push(
            "（サーバー内部エラーの可能性。ターミナルログ・DATABASE_URL・npx prisma db push を確認）",
          );
        }
        setError(parts.join(" "));
        setSubmitPhase("idle");
        return;
      }
      if (!data.id) {
        setError("保存には成功したように見えますが、注文IDを取得できませんでした。一覧から確認してください。");
        setSubmitPhase("idle");
        return;
      }
      if (data.profileId) {
        await selectViewerProfile(data.profileId);
      }
      setBookshelfKanteiGuideFlag();
      setSubmitPhase("navigating");
      router.replace("/orders/bookshelf#bookshelf-kantei-books");
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください。");
      setSubmitPhase("idle");
    }
  }

  if (submitPhase !== "idle") {
    return (
      <>
        <FirstVisitFlowBrowserBackGuard />
        <OwlLoadingPanel
          layout="page"
          label={
            submitPhase === "navigating" ? ORDER_NAVIGATING_BOOKSHELF_LABEL : ORDER_SUBMITTING_LABEL
          }
          hint={
            submitPhase === "navigating"
              ? ORDER_NAVIGATING_BOOKSHELF_HINT
              : FIRST_VISIT_OWL_LOADING_HINT
          }
        />
      </>
    );
  }

  return (
    <>
      <FirstVisitFlowBrowserBackGuard />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{FIRST_VISIT_KANTEI_HALL_SIGN_LABEL}</h1>
        <p className="mt-1 text-sm text-stone-600">
          お名前・ふりがな・生年月日を入力すると、無料の鑑定結果へ進みます。
        </p>
        <p className="mt-1 text-xs text-stone-500">
          保存時の連絡先メールは、いまログインしているアカウントのメールが自動で使われます。
        </p>
        <div className="mt-4">
          <OrderFormProfileNotice profileIdFromQuery={profileId} />
        </div>
      </div>

      {step === 1 ? (
        <form
          key="order-step-1"
          method="post"
          noValidate
          onSubmit={goNext}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-800">お名前</h2>
            <p className="text-xs leading-5 text-stone-600">
              原則として、生まれたときのお名前をご入力ください。現在のお名前や普段使っているお名前でも鑑定は可能です。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="姓（必須）"
                value={form.lastName}
                onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                required
              />
              <Field
                label="名（必須）"
                value={form.firstName}
                onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="せい（ひらがな・必須）"
                value={form.lastNameKana}
                onChange={(v) => setForm((f) => ({ ...f, lastNameKana: v }))}
                placeholder="やまだ"
                required
              />
              <Field
                label="めい（ひらがな・必須）"
                value={form.firstNameKana}
                onChange={(v) => setForm((f) => ({ ...f, firstNameKana: v }))}
                placeholder="たろう"
                required
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-800">生年月日</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">年</span>
                <select
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                  value={form.birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {formatYearOptionLabel(y)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">月</span>
                <select
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                  value={form.birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">日</span>
                <select
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                  value={form.birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}日
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {error ? (
            <OrderFormError message={error} existingOrderId={existingOrderId} />
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-stone-800 py-3 text-sm font-medium text-white hover:bg-stone-700"
          >
            入力内容を確認する
          </button>
        </form>
      ) : (
        <form
          key="order-step-2"
          method="post"
          noValidate
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-stone-900">入力内容の確認</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-2 border-b border-stone-100 py-2">
              <dt className="w-40 shrink-0 text-stone-500">氏名</dt>
              <dd className="text-stone-900">
                {form.lastName} {form.firstName}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2 border-b border-stone-100 py-2">
              <dt className="w-40 shrink-0 text-stone-500">ふりがな</dt>
              <dd className="text-stone-900">
                {form.lastNameKana.trim()} {form.firstNameKana.trim()}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2 border-b border-stone-100 py-2">
              <dt className="w-40 shrink-0 text-stone-500">ローマ字（自動）</dt>
              <dd className="text-stone-900">
                {previewRoman ? (
                  <>
                    {previewRoman.romanNameForDisplay}
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2 border-b border-stone-100 py-2">
              <dt className="w-40 shrink-0 text-stone-500">生年月日（西暦）</dt>
              <dd className="text-stone-900">{previewDates?.iso ?? "—"}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2 border-b border-stone-100 py-2">
              <dt className="w-40 shrink-0 text-stone-500">生年月日（和暦併記）</dt>
              <dd className="text-stone-900">{previewDates?.era ?? "—"}</dd>
            </div>
          </dl>

          {error ? (
            <OrderFormError message={error} existingOrderId={existingOrderId} />
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="w-full rounded-lg border border-stone-300 bg-white py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
              onClick={() => {
                setStep(1);
                setError(null);
                setExistingOrderId(null);
              }}
            >
              戻って修正する
            </button>
            <button
              type="submit"
              disabled={submitPhase !== "idle"}
              className="w-full rounded-lg bg-stone-800 py-3 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
            >
              この内容で保存する
            </button>
          </div>
        </form>
      )}
    </div>
    </>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<OwlSuspenseFallback label="鑑定フォームを読み込んでいます…" />}>
      <OrderPageContent />
    </Suspense>
  );
}

function OrderFormError({
  message,
  existingOrderId,
}: {
  message: string;
  existingOrderId?: string | null;
}) {
  return (
    <div
      role="alert"
      className="space-y-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      <p>{message}</p>
      {existingOrderId ? (
        <Link
          href={`/orders/${existingOrderId}`}
          className="inline-block font-medium text-red-950 underline-offset-2 hover:underline"
        >
          保存済み鑑定を開く
        </Link>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-stone-400 focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
      />
    </label>
  );
}
