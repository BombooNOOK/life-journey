type Props = {
  nickname: string;
  className?: string;
};

/** 選択中プロフィールの控えめな表示 */
export function ActiveProfileLabel({ nickname, className = "" }: Props) {
  return (
    <p
      className={[
        "text-xs leading-snug text-stone-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={`現在のプロフィール：${nickname}`}
    >
      現在のプロフィール：<span className="font-medium text-stone-700">{nickname}</span>
    </p>
  );
}
