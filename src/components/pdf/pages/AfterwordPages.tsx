import { AfterwordBleedPage } from "./AfterwordBleedPage";

/** おわりに 2ページ（`afterword-1-bg` / `afterword-2-bg` + 生成テキスト） */
export function AfterwordPages() {
  return (
    <>
      <AfterwordBleedPage pageKey="left" />
      <AfterwordBleedPage pageKey="right" />
    </>
  );
}
