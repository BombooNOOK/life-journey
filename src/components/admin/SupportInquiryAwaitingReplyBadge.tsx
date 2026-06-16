type Props = {
  awaiting: boolean;
  className?: string;
};

export function SupportInquiryAwaitingReplyBadge({ awaiting, className = "" }: Props) {
  if (!awaiting) return null;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-950 ring-1 ring-amber-200",
        className,
      ].join(" ")}
    >
      要返信
    </span>
  );
}
