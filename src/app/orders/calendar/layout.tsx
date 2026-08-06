/**
 * あしあとホームはスマホでカレンダーを上に寄せる（ルート main の py-8 を相殺）。
 */
export default function OrdersCalendarLayout({ children }: { children: React.ReactNode }) {
  return <div className="-mt-5 max-sm:pt-0 sm:mt-0 sm:pt-0">{children}</div>;
}
