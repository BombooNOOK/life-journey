/** コアナンバー（1–9 またはマスター 11, 22, 33） */
export type CoreNumber = number;

export interface BirthDateParts {
  year: number;
  month: number;
  day: number;
}

/** 数秘計算の入力（ローマ字名はディスティニー等に使用。空なら名前系は null） */
export interface NumerologyInput {
  birthDate: BirthDateParts;
  romanName: string | null;
}

export interface BridgeNumbers {
  /** LP×D — ディスティニー無しのときは null */
  lifePathDestiny: CoreNumber | null;
  /** LP×S */
  lifePathSoul: CoreNumber | null;
  /** LP×P */
  lifePathPersonality: CoreNumber | null;
  /** LP×BD（バースデー×LP と同値・対称） */
  birthdayLifePath: CoreNumber;
  /** D×S */
  destinySoul: CoreNumber | null;
  /** D×P */
  destinyPersonality: CoreNumber | null;
  /** D×BD */
  destinyBirthday: CoreNumber | null;
  /** S×P */
  soulPersonality: CoreNumber | null;
  /** S×BD */
  soulBirthday: CoreNumber | null;
  /** P×BD */
  personalityBirthday: CoreNumber | null;
}

export interface NumerologyResult {
  lifePathNumber: CoreNumber;
  destinyNumber: CoreNumber | null;
  soulNumber: CoreNumber | null;
  personalityNumber: CoreNumber | null;
  birthdayNumber: CoreNumber;
  bridges: BridgeNumbers;
}
