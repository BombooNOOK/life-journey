import { buildReadingFontSizePagePath } from "@/lib/navigation/readingFontSizeNav";

export type GuestReadingFontSizePageKey = "about" | "guide" | "contact";

export type GuestReadingFontSizePage = {
  key: GuestReadingFontSizePageKey;
  pathname: `/${string}`;
  sectionId: string;
  topId: string;
  hash: `#${string}`;
};

export const GUEST_READING_FONT_SIZE_PAGES: GuestReadingFontSizePage[] = [
  {
    key: "about",
    pathname: "/about",
    sectionId: "about-font-size",
    topId: "about-top",
    hash: "#about-font-size",
  },
  {
    key: "guide",
    pathname: "/guide",
    sectionId: "guide-font-size",
    topId: "guide-top",
    hash: "#guide-font-size",
  },
  {
    key: "contact",
    pathname: "/contact",
    sectionId: "contact-font-size",
    topId: "contact-top",
    hash: "#contact-font-size",
  },
];

export function findGuestReadingFontSizePageByPathname(
  pathname: string,
): GuestReadingFontSizePage | null {
  return GUEST_READING_FONT_SIZE_PAGES.find((page) => page.pathname === pathname) ?? null;
}

export function guestReadingFontSizeHref(pathname: string, search = ""): string {
  const page = findGuestReadingFontSizePageByPathname(pathname);
  if (page) return `${page.pathname}${page.hash}`;
  return buildReadingFontSizePagePath(`${pathname}${search}`);
}

export function scrollToGuestReadingFontSizeSection(pathname: string): void {
  const page = findGuestReadingFontSizePageByPathname(pathname);
  if (page) {
    const section = document.getElementById(page.sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    window.location.assign(`${page.pathname}${page.hash}`);
    return;
  }

  window.location.assign(
    buildReadingFontSizePagePath(
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : pathname,
    ),
  );
}
