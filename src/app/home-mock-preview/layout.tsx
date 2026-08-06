import { DiaryLoggedInPageShell } from "@/components/journal/DiaryLoggedInPageShell";

/** トップ用モック撮影：あしあと画面と同じ下部メニューを含める */
export default function HomeMockPreviewLayout({ children }: { children: React.ReactNode }) {
  return <DiaryLoggedInPageShell>{children}</DiaryLoggedInPageShell>;
}
