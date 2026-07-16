import Link from "next/link";

import { LOG_HOUSE_ROOM_ADMIN_LINK_PLACEMENT } from "@/lib/loghouse/logHouseRoomLayout";

function AdminGearIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.77 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
    </svg>
  );
}

/** 管理者だけ見える入口（ラジカセ右下の控えめ歯車） */
export function LogHouseRoomAdminLinkSpot() {
  const box = LOG_HOUSE_ROOM_ADMIN_LINK_PLACEMENT;

  return (
    <Link
      href="/admin"
      aria-label="管理者ページ"
      title="管理者ページ"
      className={[
        "absolute z-[30] inline-flex items-center justify-center rounded-full",
        "border border-[#d9cbb8]/55 bg-[#fffdf8]/55 text-[#7a6856]/85",
        "shadow-sm backdrop-blur-[1px] transition",
        "hover:bg-[#fffdf8]/9 hover:text-[#5c4a3a] active:scale-[0.96]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800",
      ].join(" ")}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        zIndex: box.zIndex,
      }}
    >
      <AdminGearIcon />
    </Link>
  );
}
