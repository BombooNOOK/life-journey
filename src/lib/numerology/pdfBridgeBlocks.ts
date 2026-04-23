import type { NumerologyResult } from "./types";

import {
  type BridgeIntro,
  destinyBirthdayBridgeIntro,
  destinyPersonalityBridgeIntro,
  destinySoulBridgeIntro,
  lifePathBirthdayBridgeIntro,
  lifePathPersonalityBridgeIntro,
  lifePathSoulBridgeIntro,
  personalityBirthdayBridgeIntro,
  soulBirthdayBridgeIntro,
  soulPersonalityBridgeIntro,
  bridgeIntro,
} from "./bridgeProfiles";
import { getBridgeProfile, pairKeyFromTwoCoreNumbers } from "./lifePathDestinyBridge";

/** PDF 上の 1 ブリッジ分（10 ペアを固定順で並べる） */
export type PdfBridgeBlock = {
  id: string;
  heading: string;
  intro: BridgeIntro;
  bridgeNumber: number | null;
  scorePercent: number | null;
  scoreLabel: string | null;
  article: string | null;
  contextLines: { label: string; value: string }[];
};

type PairSpec = {
  id: string;
  heading: string;
  intro: BridgeIntro;
  left: number | null;
  right: number | null;
  computedBridge: number | null;
  contextLines: { label: string; value: string }[];
};

/**
 * 両方のコアが揃っていれば pairKey → bridgeProfiles を参照し、
 * 本文・一致度・表示用ブリッジ番号を埋める。片方でも欠ける場合は profile を付けない。
 */
function pdfBridgeBlockFromPair(spec: PairSpec): PdfBridgeBlock {
  const { id, heading, intro, contextLines, left, right, computedBridge } = spec;
  if (left == null || right == null) {
    return {
      id,
      heading,
      intro,
      bridgeNumber: computedBridge,
      scorePercent: null,
      scoreLabel: null,
      article: null,
      contextLines,
    };
  }
  const pairKey = pairKeyFromTwoCoreNumbers(left, right);
  const profile = getBridgeProfile(pairKey);
  return {
    id,
    heading,
    intro,
    bridgeNumber: profile?.bridgeNumber ?? computedBridge ?? null,
    scorePercent: profile?.scorePercent ?? null,
    scoreLabel: profile?.scoreLabel ?? null,
    article: profile?.article ?? null,
    contextLines,
  };
}

export function buildPdfBridgeBlocks(numerology: NumerologyResult): PdfBridgeBlock[] {
  const { bridges } = numerology;
  const lp = numerology.lifePathNumber;
  const d = numerology.destinyNumber;
  const s = numerology.soulNumber;
  const p = numerology.personalityNumber;
  const bd = numerology.birthdayNumber;

  const specs: PairSpec[] = [
    {
      id: "lifePathDestiny",
      heading: "ライフパス × ディスティニー",
      intro: bridgeIntro,
      left: lp,
      right: d,
      computedBridge: bridges.lifePathDestiny,
      contextLines: [
        { label: "ライフパスナンバー（LP）", value: String(lp) },
        { label: "ディスティニーナンバー（D）", value: d != null ? String(d) : "—" },
      ],
    },
    {
      id: "lifePathSoul",
      heading: "ライフパス × ソウル",
      intro: lifePathSoulBridgeIntro,
      left: lp,
      right: s,
      computedBridge: bridges.lifePathSoul,
      contextLines: [
        { label: "ライフパスナンバー（LP）", value: String(lp) },
        { label: "ソウルナンバー（S）", value: s != null ? String(s) : "—" },
      ],
    },
    {
      id: "lifePathPersonality",
      heading: "ライフパス × パーソナリティ",
      intro: lifePathPersonalityBridgeIntro,
      left: lp,
      right: p,
      computedBridge: bridges.lifePathPersonality,
      contextLines: [
        { label: "ライフパスナンバー（LP）", value: String(lp) },
        {
          label: "パーソナリティナンバー（P）",
          value: p != null ? String(p) : "—",
        },
      ],
    },
    {
      id: "lifePathBirthday",
      heading: "ライフパス × バースデー",
      intro: lifePathBirthdayBridgeIntro,
      left: lp,
      right: bd,
      computedBridge: bridges.birthdayLifePath,
      contextLines: [
        { label: "ライフパスナンバー（LP）", value: String(lp) },
        { label: "バースデーナンバー（BD）", value: String(bd) },
      ],
    },
    {
      id: "destinySoul",
      heading: "ディスティニー × ソウル",
      intro: destinySoulBridgeIntro,
      left: d,
      right: s,
      computedBridge: bridges.destinySoul,
      contextLines: [
        { label: "ディスティニーナンバー（D）", value: d != null ? String(d) : "—" },
        { label: "ソウルナンバー（S）", value: s != null ? String(s) : "—" },
      ],
    },
    {
      id: "destinyPersonality",
      heading: "ディスティニー × パーソナリティ",
      intro: destinyPersonalityBridgeIntro,
      left: d,
      right: p,
      computedBridge: bridges.destinyPersonality,
      contextLines: [
        { label: "ディスティニーナンバー（D）", value: d != null ? String(d) : "—" },
        {
          label: "パーソナリティナンバー（P）",
          value: p != null ? String(p) : "—",
        },
      ],
    },
    {
      id: "destinyBirthday",
      heading: "ディスティニー × バースデー",
      intro: destinyBirthdayBridgeIntro,
      left: d,
      right: bd,
      computedBridge: bridges.destinyBirthday,
      contextLines: [
        { label: "ディスティニーナンバー（D）", value: d != null ? String(d) : "—" },
        { label: "バースデーナンバー（BD）", value: String(bd) },
      ],
    },
    {
      id: "soulPersonality",
      heading: "ソウル × パーソナリティ",
      intro: soulPersonalityBridgeIntro,
      left: s,
      right: p,
      computedBridge: bridges.soulPersonality,
      contextLines: [
        { label: "ソウルナンバー（S）", value: s != null ? String(s) : "—" },
        {
          label: "パーソナリティナンバー（P）",
          value: p != null ? String(p) : "—",
        },
      ],
    },
    {
      id: "soulBirthday",
      heading: "ソウル × バースデー",
      intro: soulBirthdayBridgeIntro,
      left: s,
      right: bd,
      computedBridge: bridges.soulBirthday,
      contextLines: [
        { label: "ソウルナンバー（S）", value: s != null ? String(s) : "—" },
        { label: "バースデーナンバー（BD）", value: String(bd) },
      ],
    },
    {
      id: "personalityBirthday",
      heading: "パーソナリティ × バースデー",
      intro: personalityBirthdayBridgeIntro,
      left: p,
      right: bd,
      computedBridge: bridges.personalityBirthday,
      contextLines: [
        {
          label: "パーソナリティナンバー（P）",
          value: p != null ? String(p) : "—",
        },
        { label: "バースデーナンバー（BD）", value: String(bd) },
      ],
    },
  ];

  return specs.map(pdfBridgeBlockFromPair);
}
