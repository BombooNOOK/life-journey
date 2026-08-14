# Hybrid Phase 4B-4X｜Actor Identity & Email Change Safety

**Status:** Design + read-only code audit only — **no Production write / schema / POST wiring**  
**Prior:** 4B-4W / 4B-4W.1 **PASS = A**（JSO schema live; rows=0 after cleanup）  
**Date:** 2026-08-14  

**Purpose:** Decide SoT for `JournalSaveOperation.actorKey` **before** Production `POST /api/journal` wiring.

**Forbidden this Phase:** Production DB write, schema change, migration, POST wiring, feature enable, deploy, main merge.

**Cross-links:**
- [HYBRID_PHASE_4B4W_PRODUCTION_INTERNAL_JSO_VERIFICATION.md](./HYBRID_PHASE_4B4W_PRODUCTION_INTERNAL_JSO_VERIFICATION.md)
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)
- [ljd-local-save-operation-intent-spec.md](../product/ljd-local-save-operation-intent-spec.md) §1

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`

---

## 0. Production snapshot (context)

| Item | State |
| --- | --- |
| JournalSaveOperation | exists; rows = 0 |
| migration pending | 0 |
| JournalEntry / donguri | 65 / 79 |
| Production POST wiring | **No** |
| feature | OFF |

---

## 1. 現行 auth / ownership 構造（コード監査）

### 1.1 Login / session identity

| Layer | Fact |
| --- | --- |
| Client Auth | Firebase JS Auth（email/password + Google） |
| Server JWT verify | **なし** — viewer API は cookie email を信頼 |
| Cookie | `lj_logged_in=1`, `lj_user_email`（maxAge 30d, not httpOnly） |
| Session API | `POST/DELETE /api/auth/session` — body email を trim+lower して Set-Cookie |
| Client sync | `syncLjAuthClientCookies` / `FirebaseAuthProvider` / `useEnsureServerAuthSession` |

**SoT for Server journal APIs today:**  
`getViewerEmailFromCookie()` → decodeURIComponent → **trim + toLowerCase**  
（`src/lib/auth/viewer.ts`）

### 1.2 JournalEntry ownership

| Path | Key |
| --- | --- |
| `POST/GET /api/journal` | `email: viewerEmail` (+ `profileId`) |
| `/api/journal/[id]` | `{ id, email: viewerEmail }` |
| Drafts / tags / diary-books | same cookie email |
| Donguri / entitlement | email (+ profileId) |

**Firebase UID is not used for ownership.**

### 1.3 Email 変更経路

| Question | Finding |
| --- | --- |
| Product email-change UI/API | **なし** |
| Firebase `updateEmail` / `verifyBeforeUpdateEmail` | **未使用** |
| Account settings | email **表示のみ**（編集なし） |
| Admin | AccountSettings upsert by email — ownership remap ではない |

→ **現行プロダクトに email 変更フローは存在しない。**  
ただし schema / 住民番号コメントは「メール変更後も不変」を想定している。

### 1.4 Stable identity の有無

| Candidate | In DB? | Used as journal ownership? |
| --- | --- | --- |
| Firebase UID | **No**（client / Admin delete 時のみ） | No |
| `AccountSettings.id` (cuid) | Yes | **No** — lookups are `where: { email }` |
| `forestResidentNumber` | Yes unique optional; comment「メール変更後も不変」 | **No** for Journal |
| `Profile.id` | Yes | Scoped under `Profile.email` |
| `User` model | **None** | — |

**結論:** Server 側に「Journal 所有の正式な immutable account id」は **未導入**。  
実務上の所有キーは **normalized email 一択**。

### 1.5 Signup / login / logout lifecycle

```
Firebase login success
  → client cookies + POST /api/auth/session
  → journal APIs use lj_user_email

logout / account delete
  → clear cookies + (delete) Firebase user
  → account delete: deleteMany by email on product tables
  → JournalSaveOperation は deleteUserAccount 一覧に **未掲載**（wiring 後は要追加）
```

### 1.6 Trust caveat（配線前に認識）

Session cookie は Firebase ID token 検証なしで設定可能。  
`actorKey` も同一境界を継承する。本 Phase の主目的は identity **キー選択**であり、auth hardening は別 Gate。

---

## 2. 候補比較 A〜D

| | A Normalized email | B Firebase UID | C Internal immutable account ID | D Transitional dual / mapping |
| --- | --- | --- | --- | --- |
| **定義** | `normalizeEmail(viewerEmail)` ≡ 今日の PoC | `User.uid` | `AccountSettings.id` または新 `accountId`（将来） | email actorKey + mapping table / dual write |
| **ownership 整合** | **最良**（JournalEntry と一致） | 不一致（DB に UID なし） | Journal が email のままなら **split-brain** | 複雑だが移行用 |
| **email 変更耐性** | 弱い（remap 必須） | 強い（UID 不変） | 強い | 設計次第 |
| **retry safety（同一 cookie）** | 良い | cookie に UID 無し → 要新経路 | 要 journal 所有移行 | 移行期は注意 |
| **cross-device** | email 同一なら可 | UID 同一なら可 | accountId 同一なら可 | mapping 依存 |
| **account deletion** | email で掃除しやすい | UID→email 解決が必要 | accountId cascade | mapping 掃除も必要 |
| **migration complexity** | **最低**（現状一致） | 高（全テーブル＋cookie＋API） | 高（Journal 所有移行と同梱必須） | 中〜高 |
| **split-brain risk** | 低（単一キー） | 配線直後は高 | 所有移行なしだと **高** | 移行設計失敗で高 |

### 推奨順位（Production POST wiring 時点）

1. **A（第一候補）** — 現行 SoT と一致。配線可能条件付き。  
2. **D** — email→stable id へ移行する **将来 Phase** の手段。今すぐの actorKey 第一値にはしない。  
3. **C** — Journal ownership 移行と **同時**なら本命候補。単独採用は禁止。  
4. **B** — **却下（当面）**。UID が Server DB / cookie SoT に無い。推測採用禁止。

---

## 3. Email 変更ケース（`old@` → `new@`）明文化

前提: 将来 email 変更が実装された場合。現行 UI は無し。

| Surface | old cookie / old email のまま | new cookie / new email のみ |
| --- | --- | --- |
| **未完了 JSO** (`processing` under old actorKey) | new 側から **見えない** | 同一 `saveOperationId` で **新規 claim** → **二重作成/二重課金リスク** |
| **completed JSO lookup** | old actorKey でしか取れない | new では `not_found` → 再 POST 危険 |
| **same saveOperationId retry** | old なら idempotent | new なら **別ユニークキー** |
| **Local Save Intent** | actorKey=email なら旧キーに残存 | 新デバイス/新 email と不一致 |
| **mirror / outbox** | 現行は email スコープの製品データと別系統だが、Server confirm id は email 所有 Journal に紐づく | 所有キー不一致で復旧困難 |

**Local Save Intent / mirror:** 本番未接続でも、将来接続時は **同一 actorKey 規則**が必須。

---

## 4. 暫定案（第一候補 = A）と不変条件

### 4.1 Decision（本 Phase SoT）

**Production POST wiring 第一候補: Option A**  
`actorKey = normalizeEmail(viewerEmail)`  
（`getViewerEmailFromCookie()` / `actorKeyFromViewerEmail` と同値）

これは **現行 ownership との整合を優先**する暫定〜中期決定。  
**「email が永遠の identity」という意味ではない。**  
列名は引き続き `actorKey`（email にスキーマ固定しない）。

### 4.2 不変条件（wiring 前 Gate）

| ID | Invariant |
| --- | --- |
| **X1** | Journal ownership が email の間、JSO `actorKey` も **同一正規化 email** |
| **X2** | Product **email 変更**を導入するなら、**同一 transaction / 同一運用手順**で少なくとも: `JournalEntry.email`, `AccountSettings.email`, `Profile.email`, donguri ledger email, **`JournalSaveOperation.actorKey`**, Local intent actorKey 規則を remap |
| **X3** | Email 変更中の in-flight `saveOperationId` は **完了または明示 abort** まで変更を拒否、または remap 後に old キーを残さない |
| **X4** | Account delete は `JournalSaveOperation` を `actorKey = email` で削除対象に含める |
| **X5** | Firebase UID / AccountSettings.id を actorKey に **単独採用しない**（Journal 所有移行セットなし） |
| **X6** | Email-change remap Gate = **OPEN** のまま。**Gate CLOSE なしに email 変更機能を ship しない** |

### 4.3 将来の stable identity（C）への道

推奨順序（別 Phase）:

1. Server に immutable `accountId`（または AccountSettings.id を正式所有キー化）  
2. JournalEntry / Profile / donguri を accountId 所有へ移行  
3. JSO `actorKey` を accountId へ remap（D を短期間使っても可）  
4. cookie / session が accountId を運べるようにする  

**住民番号 (`forestResidentNumber`)** は「表示・継続性」用途。Journal 所有キーへの流用は、番号未発行アカウントや再発行ポリシーの監査が別途必要 → **今は actorKey にしない**。

---

## 5. Production POST wiring 前 blocker 一覧

| Blocker | Status |
| --- | --- |
| JSO schema on Production | **PASS**（4B-4V.1） |
| Internal JSO verify on Production | **PASS**（4B-4W） |
| Test row cleanup | **PASS**（4B-4W.1） |
| **Actor identity SoT** | **本 Phase で A を正式候補化** |
| Email-change remap Gate | **OPEN**（変更機能が無い間は latent；機能追加前に必須） |
| Account delete に JSO 掃除 | **CLOSED in 4B-4Y**（`actorKey = email` deleteMany） |
| Session cookie vs Firebase token trust | **既知 caveat**（別 hardening Gate） |
| Local intent / mirror 本番接続 | **未**（別 Phase） |
| Feature flag / POST wiring 実装 | **CLOSED in 4B-4Y**（default OFF; Production enable は別 Gate） |
| Pagination / reconciliation caps | **別 blocker**（既存） |

---

## 6. 最終報告（要約）

| Question | Answer |
| --- | --- |
| 現行 auth/ownership | Cookie normalized email；JournalEntry.email 所有 |
| stable identity | AccountSettings.id / forestResidentNumber はあるが **Journal 所有には未使用**；UID は DB に無い |
| email 変更経路 | **製品として未実装** |
| A〜D | **A 第一**；B 却下；C は所有移行と同梱時；D は将来移行手段 |
| 第一候補 | **`actorKey = normalizeEmail(viewerEmail)`** |
| 必要な migration/remap | **今すぐの schema migration 不要**；email 変更導入時に **JSO actorKey remap（X2）** |
| Wiring 前 blocker | identity SoT（本 doc）以外は実装・flag・delete 掃除・（任意）auth trust |
| **次に進めるか** | **A（条件付き）** — POST wiring **設計/実装 Phase** へ進めてよい。ただし **email-change remap Gate は OPEN のまま**残し、email 変更機能と同時 ship 禁止 |

---

## 7. 次にやらないこと（停止）

- Production write / schema / migration  
- Production POST wiring 実装（次 Phase で明示承認）  
- feature enable / deploy / main merge  
