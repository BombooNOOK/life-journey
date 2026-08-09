"use client";

type Props = {
  profileIdFromQuery: string;
};

/** 鑑定申込：このアカウントへ保存する旨のみ（複数枠 UI は出さない） */
export function OrderFormProfileNotice({ profileIdFromQuery }: Props) {
  if (!profileIdFromQuery) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
      <p className="font-medium">鑑定結果は、このアカウントに保存されます</p>
      <p className="mt-1 text-xs text-emerald-900/80">
        ログハウスから開いたときの保存先とつながっています。
      </p>
    </div>
  );
}
