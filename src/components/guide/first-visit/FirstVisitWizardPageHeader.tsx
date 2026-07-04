type Props = {
  /** 第2幕・第3幕など、ページ内セクションの見出し補助 */
  stepLabel?: string;
  className?: string;
};

/** about / owl など通常幅ページの共通ヘッダー */
export function FirstVisitWizardPageHeader({ stepLabel, className }: Props) {
  return (
    <header className={["space-y-1", className].filter(Boolean).join(" ")}>
      <p className="text-xs tracking-wide text-emerald-800/90 sm:text-sm">BambooNOOK / Life Journey Diary</p>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">はじめての方へ</h1>
      {stepLabel ? <p className="text-sm font-medium text-stone-600">{stepLabel}</p> : null}
    </header>
  );
}
