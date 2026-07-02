/** ユーザー向けボタンラベル（2行表示用） */
export function CompanionWritingButtonLabel({ className = "" }: { className?: string }) {
  return (
    <span className={["inline-block text-center leading-snug", className].join(" ")}>
      <span className="block">どうぶつ鑑定士と</span>
      <span className="block">いっしょに書く</span>
    </span>
  );
}
