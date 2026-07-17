import type { SystemNoticeAdminView } from "@/lib/loghouse/systemNotices";

type CreateProps = {
  mode: "create";
  action: (formData: FormData) => Promise<void>;
};

type EditProps = {
  mode: "edit";
  notice: SystemNoticeAdminView;
  saveAction: (formData: FormData) => Promise<void>;
  publishAction: (formData: FormData) => Promise<void>;
  unpublishAction: (formData: FormData) => Promise<void>;
};

type Props = CreateProps | EditProps;

export function AdminSystemNoticeForm(props: Props) {
  const notice = props.mode === "edit" ? props.notice : null;
  const isPublished = notice?.status === "published";

  return (
    <form
      action={props.mode === "create" ? props.action : props.saveAction}
      className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"
    >
      {notice ? <input type="hidden" name="id" value={notice.id} /> : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-800">タイトル</span>
        <input
          name="title"
          required
          defaultValue={notice?.title ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          placeholder="例: メンテナンスのお知らせ"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-800">本文</span>
        <textarea
          name="body"
          required
          rows={10}
          defaultValue={notice?.body ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm leading-relaxed"
          placeholder="アップデート・メンテナンス・重要なお知らせなど"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-stone-800">アクション文言（任意）</span>
          <input
            name="actionLabel"
            defaultValue={notice?.actionLabel ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            placeholder="例: ガイドを見る"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-stone-800">アクション経路（任意）</span>
          <input
            name="actionRoute"
            defaultValue={notice?.actionRoute ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            placeholder="例: /help"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          {props.mode === "create" ? "下書き保存" : "内容を保存"}
        </button>

        {props.mode === "edit" && !isPublished ? (
          <button
            type="submit"
            formAction={props.publishAction}
            className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            保存して公開
          </button>
        ) : null}

        {props.mode === "edit" && isPublished ? (
          <button
            type="submit"
            formAction={props.unpublishAction}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            非公開にする
          </button>
        ) : null}
      </div>
    </form>
  );
}
