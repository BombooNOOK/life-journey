import {
  buildSupportInquiryReplyLinks,
  type SupportInquiryReplyContext,
} from "@/lib/support/supportInquiryReplyLinks";

type Props = {
  replyContext: SupportInquiryReplyContext;
};

export function SupportInquiryReplyActions({ replyContext }: Props) {
  const { gmailUrl, mailtoUrl } = buildSupportInquiryReplyLinks(replyContext);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-stone-900">返信</h2>
      <p className="text-xs leading-relaxed text-stone-500">
        Gmailで返信する場合は、このブラウザでログイン中のGoogleアカウントから送信されます。
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={gmailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-950 hover:bg-sky-100"
        >
          Gmailで返信する
        </a>
        <a
          href={mailtoUrl}
          className="inline-flex min-h-[36px] items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          メールアプリで返信する
        </a>
      </div>
    </div>
  );
}
