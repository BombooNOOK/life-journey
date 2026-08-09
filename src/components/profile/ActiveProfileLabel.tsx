type Props = {
  nickname: string;
  className?: string;
};

/** admin 向け：選択中記録枠の控えめな表示 */
export function ActiveProfileLabel({ nickname, className = "" }: Props) {
  return (
    <p
      className={[
        "text-xs leading-snug text-stone-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={`現在の記録枠：${nickname}`}
    >
      現在の記録枠：<span className="font-medium text-stone-700">{nickname}</span>
    </p>
  );
}
