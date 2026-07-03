"use client";

import { SupportInquiryMessageComposer } from "@/components/support/SupportInquiryMessageComposer";
import { SupportInquiryThread } from "@/components/support/SupportInquiryThread";
import type { SerializedSupportInquiryMessage } from "@/lib/support/supportInquiryMessageTypes";

type Props = {
  inquiryId: string;
  messages: SerializedSupportInquiryMessage[];
  canReply: boolean;
};

export function AdminSupportInquiryThreadPanel({ inquiryId, messages, canReply }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">会話</h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          ここから返信すると、ユーザーのログハウスに表示され、メールでも通知されます。
        </p>
      </div>

      <SupportInquiryThread messages={messages} viewerRole="admin" />

      {canReply ? (
        <SupportInquiryMessageComposer
          inquiryId={inquiryId}
          apiPath={`/api/admin/support-inquiries/${encodeURIComponent(inquiryId)}/messages`}
          submitLabel="返信を送る"
          placeholder="ユーザーへの返信内容を入力してください"
        />
      ) : (
        <p className="text-sm text-stone-500">このお問い合わせは終了しているため、返信できません。</p>
      )}
    </div>
  );
}
