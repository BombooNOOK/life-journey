import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";
import { Text, type TextProps } from "@react-pdf/renderer";

import { sanitizePdfBodyText } from "@/lib/pdf/sanitizeBodyText";

/**
 * textkit の Knuth–Plass はハイフン位置に penalty ノードを置き、行末に "-" を描画する。
 * hyphenationCallback だけでは残るケースがあるため、penalty を無限大相当にして当該ブレークを選ばせない。
 * （@react-pdf/layout は node.props.hyphenationPenalty を読むが、型定義に未記載）
 */
const NO_HYPHEN_BREAK_PENALTY = 10_000;
const MIN_ORPHANS = 2;
const MIN_WIDOWS = 2;
const MIN_PRESENCE_AHEAD = 12;

function sanitizeTextChildren(node: ReactNode): ReactNode {
  if (node == null || typeof node === "boolean") return node;
  if (typeof node === "string") return sanitizePdfBodyText(node);
  if (typeof node === "number") return node;
  if (Array.isArray(node)) return node.map(sanitizeTextChildren);
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    const ch = el.props.children;
    return cloneElement(el, undefined, sanitizeTextChildren(ch));
  }
  return node;
}

export function PdfText(props: PropsWithChildren<TextProps>) {
  const { children, ...rest } = props;
  return (
    <Text
      {...rest}
      hyphenationCallback={(word: string) => [sanitizePdfBodyText(word)]}
      orphans={rest.orphans ?? MIN_ORPHANS}
      widows={rest.widows ?? MIN_WIDOWS}
      minPresenceAhead={rest.minPresenceAhead ?? MIN_PRESENCE_AHEAD}
      // @react-pdf/layout が参照するが公開 TextProps に無い
      // @ts-expect-error hyphenationPenalty は textkit のハイフン用 penalty を実質無効化する
      hyphenationPenalty={NO_HYPHEN_BREAK_PENALTY}
    >
      {sanitizeTextChildren(children)}
    </Text>
  );
}
