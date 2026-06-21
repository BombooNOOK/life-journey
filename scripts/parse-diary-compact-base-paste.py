#!/usr/bin/env python3
"""Parse compact base paste (No.001-162) into manifest JSON draft keys."""
import json
import re
import sys
from pathlib import Path

DRAFT_KEY_BY_ACTION = {
    "work_study": "work_study",
    "family_friends": "family_friends",
    "new_challenge": "new_challenge",
    "rest": "rest",
    "organize": "organize",
    "favorite_fun": "enjoyed",
    "outing": "outing",
    "health_care": "health_care",
    "very_happy": "very_happy",
    "heart_unsettled": "emotional_wave",
    "hard_day": "hard_day",
    "sad": "sad",
    "anxious": "anxious",
    "irritated": "irritated",
    "lost_confidence": "lost_confidence",
    "nothing_to_do": "no_energy",
    "did_not_go_well": "down",
    "ordinary_record": "record_anyway",
}

LINE_RE = re.compile(
    r"^No\.\d+\s*\|\s*[\w_]+\s*\|\s*([\w_]+)\s*\|\s*(\d)\s*(.+)$"
)


def main() -> None:
    paste_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        "docs/diary-reading-compact-base.paste.txt"
    )
    out_path = Path("scripts/diary-reading-compact-copy-manifest.json")
    text = paste_path.read_text(encoding="utf-8")
    base: dict[str, dict[str, str]] = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line.startswith("No."):
            continue
        m = LINE_RE.match(line)
        if not m:
            raise SystemExit(f"Could not parse line: {line[:80]!r}")
        action, day, body = m.group(1), m.group(2), m.group(3).strip()
        draft_key = DRAFT_KEY_BY_ACTION.get(action)
        if not draft_key:
            raise SystemExit(f"Unknown action category: {action}")
        base.setdefault(draft_key, {})[day] = body

    expected = 18 * 9
    count = sum(len(v) for v in base.values())
    if count != expected:
        raise SystemExit(f"Expected {expected} base entries, got {count}")

    manifest: dict = {"base": base}
    if out_path.exists():
        existing = json.loads(out_path.read_text(encoding="utf-8"))
        manifest = {**existing, "base": base}
    out_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {count} base entries to {out_path}")


if __name__ == "__main__":
    main()
