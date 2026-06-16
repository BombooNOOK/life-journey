"use client";

import type { SerializedSupportInquiryMessage } from "@/lib/support/supportInquiryMessageTypes";

type Props = {
  messages: SerializedSupportInquiryMessage[];
  viewerRole?: "user" | "admin";
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupportInquiryThread({ messages, viewerRole = "user" }: Props) {
  if (messages.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
        メッセージはまだありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isAdmin = message.role === "admin";
        const alignRight = viewerRole === "user" ? isAdmin : !isAdmin;
        const label = isAdmin ? "BambooNOOK運営" : "あなた";

        return (
          <div key={message.id} className={alignRight ? "flex justify-end" : "flex justify-start"}>
            <div
              className={[
                "max-w-[92%] rounded-xl border px-3 py-2.5 sm:max-w-[80%]",
                isAdmin
                  ? "border-sky-200 bg-sky-50 text-sky-950"
                  : "border-stone-200 bg-white text-stone-900",
              ].join(" ")}
            >
              <p className="text-[11px] font-medium text-stone-500">{label}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
              <p className="mt-2 text-[11px] text-stone-400">{formatTimestamp(message.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
