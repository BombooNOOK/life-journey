import { DiaryLoggedInPageShell } from "@/components/journal/DiaryLoggedInPageShell";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <DiaryLoggedInPageShell>{children}</DiaryLoggedInPageShell>;
}
