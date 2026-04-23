import {
  normalizeNumerologyResult,
  numerologyWithRefreshedLifePath,
} from "@/lib/order/numerologyDisplay";
import type { NumerologyResult } from "@/lib/numerology/types";
import { STONE_FOCUS_THEME_NONE } from "@/lib/stones/stoneFocusTheme";
import { recalculateStonesFromNumerology } from "@/lib/stones/fromNumerology";
import { parseStoredStoneSelection } from "@/lib/stones/parseStoredSelection";
import type { StoneSelection } from "@/lib/stones/types";
import type { StonesComparisonPanelProps } from "@/components/orders/StonesComparisonPanel";

export type StoneSectionBuildResult =
  | { ok: true; props: StonesComparisonPanelProps }
  | { ok: false; message: string };

type OrderStoneSlice = {
  numerologyJson: string;
  birthDate: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  stonesJson: string;
  stoneFocusTheme?: string | null;
};

/**
 * 注文行から守護石比較パネル用 props を組み立てる。例外は握りつぶして ok: false にする。
 */
export function buildStoneComparisonProps(order: OrderStoneSlice): StoneSectionBuildResult {
  try {
    let numerologyAtSave: NumerologyResult | null = null;
    try {
      numerologyAtSave = normalizeNumerologyResult(JSON.parse(order.numerologyJson));
    } catch {
      numerologyAtSave = null;
    }

    const numerologyCurrent = numerologyWithRefreshedLifePath(
      order.numerologyJson,
      order.birthDate,
      {
        birthYear: order.birthYear,
        birthMonth: order.birthMonth,
        birthDay: order.birthDay,
      },
    );

    const stonesStored = parseStoredStoneSelection(order.stonesJson);

    let stonesRecalculated: StoneSelection | null = null;
    let stonesRecalculateError: string | null = null;
    if (numerologyCurrent != null) {
      try {
        const theme = order.stoneFocusTheme?.trim() || STONE_FOCUS_THEME_NONE;
        stonesRecalculated = recalculateStonesFromNumerology(numerologyCurrent, {
          focusThemeLabel: theme,
        });
      } catch (e) {
        stonesRecalculateError =
          e instanceof Error ? e.message : "守護石の再計算中にエラーが発生しました。";
      }
    }

    return {
      ok: true,
      props: {
        numerologyAtSave,
        numerologyCurrent,
        stonesStored,
        stonesRecalculated,
        stonesRecalculateError,
      },
    };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof Error
          ? e.message
          : "守護石ブロック用データの準備中にエラーが発生しました。",
    };
  }
}
