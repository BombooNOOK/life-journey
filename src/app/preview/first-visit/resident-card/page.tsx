import Link from "next/link";

import { FirstVisitResidentCardPreviewClient } from "@/components/guide/first-visit/FirstVisitResidentCardPreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export default async function FirstVisitResidentCardPreviewPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div>
      <FirstVisitResidentCardPreviewClient />
      <p className="px-4 pb-8 text-center text-xs text-stone-500">
        <Link href="/preview/first-visit/loghouse-sign" className="underline hover:text-stone-800">
          ログハウス看板プレビューへ
        </Link>
        {" · "}
        <Link href="/preview" className="underline hover:text-stone-800">
          校正メニューへ
        </Link>
      </p>
    </div>
  );
}
