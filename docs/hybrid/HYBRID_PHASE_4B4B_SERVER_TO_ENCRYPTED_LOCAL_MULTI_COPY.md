# Hybrid Phase 4B-4B｜Server → Encrypted Local Candidate Multi-entry Copy

**Base branch:** `feat/fresh-encrypted-local-journal-bootstrap` @ `c24e1258337f1c6a4d0294d03a666b834f2d03ee`  
**This branch:** `feat/server-to-encrypted-local-multi-copy`  
**main:** `a160d25743d82713b3d218abacd2d26833b0bc9b`（未 merge）

---

## 1. 目的

明示指定した **テスト用** Server あしあと複数件を、encrypted candidate `ljd_local_journal_secure_candidate` へ copy できることを実証する。

active DB 切替・Local 原本化・Server 更新は行わない。

---

## 2. explicit entry IDs（確定）

自動 discovery なし。確定テスト3件のみ:

| | entry ID | 照合 |
| --- | --- | --- |
| A | `cmsplldz50000l904mbblxu4t` | `#テスト` `#LocalCopyTest`・写真あり |
| B | `cmsplmm9q0002js04piqo3ls4` | `#テスト`・写真なし |
| C | `cmsploc7p0004js04emyv2kz9` | `#お引越しテスト`・写真あり |

失敗注入（実 Server 非破壊）: `ljd-poc-missing-entry-id`

---

## 3. Server GET-only

- `GET /api/journal/[id]`
- `GET /api/journal/entries/[entryId]/photo`
- cookie session
- Neon 直 SQL 禁止 / Server write 禁止

Simulator diagnostics は local assets のため、PoC 時のみ `CapacitorHttp` + session cookie で本番 origin へ GET（cookie は端末 Library に置き、repo に含めない・log しない）。

---

## 4. candidate-only

allowlist: `ljd_local_journal_secure_candidate` のみ。  
`ljd_local_journal` write 拒否。通常 `JournalRepository` 未変更。

media: `ljd/media/journal-secure-candidate/`

---

## 5. mapping / dedupe / source_changed

- 新 ULID `stableId` / `legacyServerId` = server cuid / `source=migrated_server`
- dedupe 第一キー `legacyServerId` → `already_present`
- fingerprint 変化 → `source_changed`（自動 overwrite なし）

---

## 6. Simulator C1–C10

| Step | 結果 |
| --- | --- |
| C1 candidate ready | **PASS**（初回 entries=0 encrypted） |
| C2 明示3件 fetch + test tag | **PASS** |
| C3 3件 copy | **PASS**（copied=3） |
| C4 entry/tag/media | **PASS**（entries=3 tags=4 media=2 user_version=1） |
| C5 encrypted / backup / Complete | **PASS** |
| C6 failure injection | **PASS**（missing fail・他 already_present・entries=3） |
| C7 kill/relaunch | **PASS**（relaunch 後も Complete + encrypted + rows 維持） |
| C8 同一 ID 再実行 | **PASS**（copied=0 already_present=3 / stableId 不変） |
| C9 duplicate なし | **PASS**（entries=3 media=2） |
| C10 actual plaintext + Server | **PASS**（prod plaintext 無変更 / Server updatedAt 一致・GET only） |

stableIds（初回 copy）:

- A → `01KZT6Q8Y5BNYRSRNMM2YKSEHV`
- B → `01KZT6Q9TRPREZXJEM62070ME6`
- C → `01KZT6QC0P05JV889RCTPH5412`

---

## 7. RG / active / main

RG-1〜4 未完のまま。active 未切替。main 未 merge。
