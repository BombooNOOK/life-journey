import { DiaryLoggedInPageShell } from "@/components/journal/DiaryLoggedInPageShell";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <DiaryLoggedInPageShell>{children}</DiaryLoggedInPageShell>;
}
