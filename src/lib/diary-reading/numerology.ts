import type { NumerologyNumber } from "./types";

export function reduceToSingleDigit(value: number): NumerologyNumber {
  let n = Math.abs(Math.trunc(value));
  while (n > 9) {
    n = String(n)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  // 0 は数秘の運用上扱いづらいため 9 に寄せる
  return (n === 0 ? 9 : n) as NumerologyNumber;
}
