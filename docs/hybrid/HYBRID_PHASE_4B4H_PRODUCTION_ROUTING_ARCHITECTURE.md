# Hybrid Phase 4B-4H｜Production Transitional Routing Architecture

**Base:** `feat/local-generation-resolver-integration-poc` @ `6247f3f8bc2b1f28b935164b5d393e11bb174178`  
**Branch:** `docs/production-transitional-local-routing`  
**SoT candidate:** `docs/product/ljd-transitional-local-routing-spec.md`  
**Cross-link:** activation / write-routing specs  
**Scope:** docs only — no wiring, build, Simulator, main merge

Mac 空き約 8.1GB。docs only。

---

## 1. 目的

Server 原本期間の **production transitional write routing** を設計比較する。  
実装・pending queue・background sync・Local read 切替はしない。

---

## 2. Production save flow（監査要約）

伴走保存: UI → `POST /api/journal` → 検証 → どんぐり事前確認 → create → 写真 → **chargeDiarySaveAcorns**（失敗時 entry delete）→ 200 `{ entry, code: OK }` → client が `entry.id` 確認 → カレンダー遷移。

**Server 確定（client 側）:** `res.ok && data.entry.id`。  
**注意:** create 直後だけでは不十分（charge 失敗で delete あり得る）。

---

## 3. Mirror 挿入

| Strategy | 判定 |
| --- | --- |
| A UI 直結 | 非推奨 |
| **B client application service（save 成功後）** | **第一候補** |
| C Server→native | 不成立 |
| D navigation 後追い | 主経路にしない |

推奨:

```text
saveJournalToServer → success(entryId)
→ resolve generation → mirrorServerJournalEntryToLocalGeneration
```

UI に埋め込まない。orchestration layer。

---

## 4. Matrix / UX

Server NG → mirror しない。  
Server OK / Local NG → **Server 成功維持・非 rollback**。ユーザーには通常成功。Local は内部 pending / retry。

---

## 5. Pending

- 保存先第一候補: **独立 metadata / outbox DB**（manifest に混ぜない）
- 最小: serverEntryId, targetGenerationId, requestedAt, retryCount, lastResult, lastAttemptAt
- 本文・写真・secret 禁止。retry は Server GET
- retry: foreground 限定。background 禁止
- pending は **作成時 generation 固定**。silent retarget 禁止

---

## 6. 分離

- Create mirror = 本設計主対象  
- Update mirror = 別Phase  
- Delete propagation = 対象外（SoT 前 Gate）  
- Read = Server 維持（write と別Phase）  
- Offline final = 導入しない（draft まで）

---

## 7. どんぐり / media

Mirror ≠ 課金。retry で再課金しない。  
Photo は canonical GET + hash / already_present。

---

## 8. SoT Gate / rollback / rollout

SoT 前: RG-1〜3 系 + offline CRUD + conflict + recovery + moving + delete policy（RG定義不変）。  
配線後: feature 無効化で Server-only 復帰可。Local データ削除しない。  
Rollout: developer → internal → cohort → full。

---

## 9. 実施していないこと

配線・pending 実装・build・Simulator・main merge。
