import type { StoneCandidate, StoneSelection } from "./types";

function isCandidate(v: unknown): v is StoneCandidate {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.nameJa === "string" &&
    Array.isArray(o.tags)
  );
}

function coerceCandidates(v: unknown): StoneCandidate[] {
  if (!Array.isArray(v)) return [];
  const out: StoneCandidate[] = [];
  for (const x of v) {
    if (isCandidate(x)) {
      out.push({
        id: x.id,
        nameJa: x.nameJa,
        tags: x.tags.filter((t): t is string => typeof t === "string"),
      });
    }
  }
  return out;
}

/**
 * DB の `stonesJson` をパースする。壊れていても例外にせず null。
 */
export function parseStoredStoneSelection(raw: string | null | undefined): StoneSelection | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  try {
    const o = JSON.parse(s) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const r = o as Record<string, unknown>;
    if (!isCandidate(r.mainStone) || !isCandidate(r.charmStone)) return null;
    const rationale = Array.isArray(r.rationale)
      ? r.rationale.filter((x): x is string => typeof x === "string")
      : [];

    return {
      mainStone: {
        id: r.mainStone.id,
        nameJa: r.mainStone.nameJa,
        tags: r.mainStone.tags.filter((t): t is string => typeof t === "string"),
      },
      mainAlternates: coerceCandidates(r.mainAlternates),
      charmStone: {
        id: r.charmStone.id,
        nameJa: r.charmStone.nameJa,
        tags: r.charmStone.tags.filter((t): t is string => typeof t === "string"),
      },
      charmAlternates: coerceCandidates(r.charmAlternates),
      rationale,
    };
  } catch {
    return null;
  }
}
