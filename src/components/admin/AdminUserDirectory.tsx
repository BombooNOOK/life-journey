"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  toggleAdminRole,
  toggleMonitorRole,
  toggleSubscriberPdfAccess,
  updatePdfDownloadLimitPerOrder,
  updateProfileLimit,
} from "@/app/admin/actions";
import {
  ADMIN_EMAIL_ALPHABET,
  compareAdminDirectoryRows,
  emailAlphabetBucket,
  type AdminEmailAlphabetBucket,
  type AdminListSortDir,
} from "@/lib/admin/adminUserDirectory";
import { formatAccountMemberNumber } from "@/lib/account/accountMemberNumberFormat";

export type AdminDirectoryRow = {
  email: string;
  memberNumber: number | null;
  registeredAt: string | null;
  profileIds: string[];
  profileNames: string[];
  planLabel: string;
  planStartedLabel: string;
  firstAppraisalLabel: string;
  sourceOrderCount: number;
  sourceJournalCount: number;
  isAdmin: boolean;
  isMonitor: boolean;
  profileLimit: number;
  monitorLimitLabel: string | null;
  pdfDownloadLimitPerOrder: number;
  subscriberPdfAccess: boolean;
};

type Props = {
  rows: AdminDirectoryRow[];
};

function letterButtonClass(active: boolean, empty: boolean): string {
  if (active) return "bg-stone-800 text-white";
  if (empty) return "bg-stone-50 text-stone-300";
  return "bg-white text-stone-700 hover:bg-stone-100";
}

export function AdminUserDirectory({ rows }: Props) {
  // 初期は All（従来どおり全件）。アルファベット箱は All をオフにしたとき。
  const [allMode, setAllMode] = useState(true);
  const [letter, setLetter] = useState<AdminEmailAlphabetBucket | null>(null);
  const [sortDir, setSortDir] = useState<AdminListSortDir>("asc");

  const countsByLetter = useMemo(() => {
    const map = new Map<AdminEmailAlphabetBucket, number>();
    for (const key of ADMIN_EMAIL_ALPHABET) map.set(key, 0);
    for (const row of rows) {
      const bucket = emailAlphabetBucket(row.email);
      map.set(bucket, (map.get(bucket) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const visibleRows = useMemo(() => {
    let list = rows;
    if (!allMode) {
      if (!letter) return [];
      list = rows.filter((r) => emailAlphabetBucket(r.email) === letter);
    }
    return [...list].sort((a, b) => compareAdminDirectoryRows(a, b, allMode ? sortDir : "asc"));
  }, [allMode, letter, rows, sortDir]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAllMode((v) => !v);
              if (allMode) setLetter(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              allMode ? "bg-emerald-800 text-white" : "border border-stone-300 bg-white text-stone-700"
            }`}
            aria-pressed={allMode}
          >
            All
          </button>
          {allMode ? (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span>会員番号（登録順）</span>
              <button
                type="button"
                onClick={() => setSortDir("asc")}
                className={`rounded-md px-2 py-1 text-xs ${
                  sortDir === "asc" ? "bg-stone-800 text-white" : "border border-stone-300"
                }`}
              >
                昇順
              </button>
              <button
                type="button"
                onClick={() => setSortDir("desc")}
                className={`rounded-md px-2 py-1 text-xs ${
                  sortDir === "desc" ? "bg-stone-800 text-white" : "border border-stone-300"
                }`}
              >
                降順
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-500">アルファベットを選ぶと、その箱のメールが一覧されます</p>
          )}
        </div>

        {!allMode ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ADMIN_EMAIL_ALPHABET.map((key) => {
              const count = countsByLetter.get(key) ?? 0;
              const active = letter === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setLetter(key)}
                  className={`min-w-[2.25rem] rounded-md border border-stone-200 px-2 py-1 text-xs font-medium ${letterButtonClass(
                    active,
                    count === 0,
                  )}`}
                  title={`${key}: ${count}件`}
                >
                  {key}
                  {count > 0 ? (
                    <span className="ml-0.5 text-[10px] opacity-70">{count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <p className="mt-3 text-xs text-stone-500">
          表示中 {visibleRows.length} / 全 {rows.length} 件
          {!allMode && letter ? `（${letter}）` : null}
          {allMode ? `（All・${sortDir === "asc" ? "昇順" : "降順"}）` : null}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-medium">会員番号</th>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">プロフィールID / 名</th>
              <th className="px-4 py-3 font-medium">プラン名</th>
              <th className="px-4 py-3 font-medium">プラン開始日</th>
              <th className="px-4 py-3 font-medium">初回鑑定日</th>
              <th className="px-4 py-3 font-medium">鑑定</th>
              <th className="px-4 py-3 font-medium">日記</th>
              <th className="px-4 py-3 font-medium">プロフィール上限</th>
              <th className="px-4 py-3 font-medium">PDF無料回数</th>
              <th className="px-4 py-3 font-medium">鑑定書 高画質PDF</th>
              <th className="px-4 py-3 font-medium">モニター</th>
              <th className="px-4 py-3 font-medium">管理者</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-sm text-stone-500">
                  {allMode
                    ? "該当するユーザーがいません"
                    : letter
                      ? "この文字のメールはありません"
                      : "アルファベットボタンをタップするか、All で全件表示してください"}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.email} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-mono text-xs text-stone-700">
                    {row.memberNumber != null
                      ? formatAccountMemberNumber(row.memberNumber)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-800">{row.email}</td>
                  <td className="px-4 py-3 text-xs text-stone-700">
                    {row.profileIds.length === 0 ? (
                      <span className="text-stone-400">未設定</span>
                    ) : (
                      <div className="space-y-1">
                        {row.profileIds.map((id, idx) => (
                          <div key={`${row.email}-${id}`}>
                            <p className="font-mono text-[11px]">{id}</p>
                            <p className="text-stone-500">
                              {row.profileNames[idx] ?? "プロフィール名未設定"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{row.planLabel}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">{row.planStartedLabel}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">{row.firstAppraisalLabel}</td>
                  <td className="px-4 py-3 text-stone-600">{row.sourceOrderCount}</td>
                  <td className="px-4 py-3 text-stone-600">{row.sourceJournalCount}</td>
                  <td className="px-4 py-3">
                    {row.isMonitor ? (
                      <div className="space-y-1 text-xs text-stone-700">
                        <p className="font-medium text-amber-900">{row.monitorLimitLabel}</p>
                        <p className="text-stone-500">保存値: {row.profileLimit}</p>
                      </div>
                    ) : (
                      <form action={updateProfileLimit} className="flex items-center gap-2">
                        <input type="hidden" name="email" value={row.email} />
                        <select
                          name="profileLimit"
                          defaultValue={String(row.profileLimit)}
                          className="rounded-md border border-stone-300 px-2 py-1"
                        >
                          <option value="1">1</option>
                          <option value="3">3</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                        >
                          上限更新
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={updatePdfDownloadLimitPerOrder}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="email" value={row.email} />
                      <input
                        type="number"
                        name="pdfDownloadLimitPerOrder"
                        min={0}
                        max={999}
                        defaultValue={String(row.pdfDownloadLimitPerOrder)}
                        className="w-20 rounded-md border border-stone-300 px-2 py-1"
                        title="鑑定1件あたりの無料PDFダウンロード回数（閲覧・DL共通）"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                      >
                        更新
                      </button>
                    </form>
                    <p className="mt-1 text-[10px] leading-tight text-stone-400">
                      保存するとこのメールの既存鑑定にも上限を反映します
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleSubscriberPdfAccess} className="flex items-center gap-2">
                      <input type="hidden" name="email" value={row.email} />
                      <input
                        type="hidden"
                        name="subscriberPdfAccess"
                        value={row.subscriberPdfAccess ? "0" : "1"}
                      />
                      <span
                        className={row.subscriberPdfAccess ? "text-violet-700" : "text-stone-500"}
                      >
                        {row.subscriberPdfAccess ? "ON" : "OFF"}
                      </span>
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                        title="鑑定書の高画質PDFダウンロード権限（プレビュー版は全員）"
                      >
                        切替
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleMonitorRole} className="flex flex-col gap-1">
                      <input type="hidden" name="email" value={row.email} />
                      <input type="hidden" name="isMonitor" value={row.isMonitor ? "0" : "1"} />
                      <span className={row.isMonitor ? "text-amber-800" : "text-stone-500"}>
                        {row.isMonitor ? "モニター利用中" : "—"}
                      </span>
                      <button
                        type="submit"
                        className="w-fit rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                      >
                        {row.isMonitor ? "OFF" : "ON"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleAdminRole} className="flex items-center gap-2">
                      <input type="hidden" name="email" value={row.email} />
                      <input type="hidden" name="isAdmin" value={row.isAdmin ? "0" : "1"} />
                      <span className={row.isAdmin ? "text-emerald-700" : "text-stone-500"}>
                        {row.isAdmin ? "ON" : "OFF"}
                      </span>
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                      >
                        切替
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/donguri/${encodeURIComponent(row.email)}`}
                      className="text-xs font-medium text-emerald-800 underline-offset-2 hover:underline"
                    >
                      どんぐり
                    </Link>
                    <p className="mt-1 text-[11px] text-stone-400">保存は即時反映</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
