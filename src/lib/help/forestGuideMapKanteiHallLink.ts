import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { ForestGuideMapKanteiHallBranch } from "@/lib/viewer/forestGuideMapKanteiHallContext";

export type ForestGuideMapCoreNumber = {
  label: string;
  value: number | null;
};

export type ForestGuideMapKanteiHallLink = {
  branch: ForestGuideMapKanteiHallBranch;
  href: string;
  linkLabel: string;
  /** 鑑定済みのとき：案内図パネル用 */
  coreNumbers?: ForestGuideMapCoreNumber[];
};

export const FOREST_MAP_KANTEI_BOOKSHELF_HREF = "/orders/bookshelf#bookshelf-kantei-books" as const;
export const FOREST_MAP_KANTEI_BOOKSHELF_LINK_LABEL = "本棚で鑑定書を見る" as const;

/** 案内図・鑑定のへやタップ時の行き先（コアナンバーは API 側で付与） */
export function forestGuideMapKanteiHallLink(
  branch: ForestGuideMapKanteiHallBranch,
): Omit<ForestGuideMapKanteiHallLink, "coreNumbers"> {
  switch (branch) {
    case "hasKantei":
      return {
        branch,
        href: FOREST_MAP_KANTEI_BOOKSHELF_HREF,
        linkLabel: FOREST_MAP_KANTEI_BOOKSHELF_LINK_LABEL,
      };
    case "residentNoKantei":
      return {
        branch,
        href: FIRST_VISIT_ROUTES.kanteiReady,
        linkLabel: "鑑定のへやへ進む",
      };
    case "guestOrNoResident":
      return {
        branch,
        href: FIRST_VISIT_ROUTES.pathGuide,
        linkLabel: "はじめての方の案内へ",
      };
  }
}
