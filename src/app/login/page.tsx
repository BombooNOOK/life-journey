import { Suspense } from "react";

import { LoginClient } from "./LoginClient";

export const metadata = {
  title: "ログイン | Life Journey",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
      <LoginClient />
    </Suspense>
  );
}
