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

export function guestReadingFontSizeHref(pathname: string): string {
  const page = findGuestReadingFontSizePageByPathname(pathname);
  if (page) return `${page.pathname}${page.hash}`;
  return "/about#about-font-size";
}

export function scrollToGuestReadingFontSizeSection(pathname: string): void {
  const page = findGuestReadingFontSizePageByPathname(pathname);
  if (!page) {
    window.location.assign("/about#about-font-size");
    return;
  }

  const section = document.getElementById(page.sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  window.location.assign(`${page.pathname}${page.hash}`);
}
