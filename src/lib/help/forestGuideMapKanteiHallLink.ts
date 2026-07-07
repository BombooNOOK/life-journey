import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { ForestGuideMapKanteiHallBranch } from "@/lib/viewer/forestGuideMapKanteiHallContext";

export type ForestGuideMapKanteiHallLink = {
  href: string;
  linkLabel: string;
};

/** 案内図・鑑定のへやタップ時の行き先 */
export function forestGuideMapKanteiHallLink(
  branch: ForestGuideMapKanteiHallBranch,
): ForestGuideMapKanteiHallLink {
  switch (branch) {
    case "hasKantei":
      return {
        href: "/orders/bookshelf#bookshelf-kantei-books",
        linkLabel: "鑑定結果を見る",
      };
    case "residentNoKantei":
      return {
        href: FIRST_VISIT_ROUTES.kanteiReady,
        linkLabel: "鑑定のへやへの案内を見る",
      };
    case "guestOrNoResident":
      return {
        href: FIRST_VISIT_ROUTES.welcome,
        linkLabel: "はじめての方の案内へ",
      };
  }
}
