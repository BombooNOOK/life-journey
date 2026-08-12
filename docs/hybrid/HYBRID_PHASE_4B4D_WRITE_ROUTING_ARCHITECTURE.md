# Hybrid Phase 4B-4D｜Post-Activation Write Routing Architecture

**Base:** `docs/local-journal-activation-architecture` @ `2afc6209c9d84c72a3d747bceaca69b9ad2c3b65`  
**This branch:** `docs/local-journal-write-routing-architecture`  
**SoT candidate:** `docs/product/ljd-local-journal-write-routing-spec.md`  
**Companion:** `docs/product/ljd-local-journal-activation-spec.md`  
**Scope:** docs only — no write impl, builds, Simulator, Server write tests, main merge

Mac 空き約 4GB のため重い処理なし。

---

## 1. 目的

technical activation 後も **Server が原本**の移行期間に、新規あしあとの write 経路を決める。  
activation pointer 実装や Local原本化はしない。

---

## 2. Strategy A〜D

| Strategy | 要約 | 判定 |
| --- | --- | --- |
| A Server only | Server のみ。Local は後 copy | 移行期単独第一にしない（Local 乖離） |
| B independent dual-write | 同時・独立 write | **不採用（第一にしない）** — partial / dup / divergence |
| **C Server-authoritative write-through mirror** | Server 成功 → canonical 取得 → Local generation へ mirror | **移行期第一候補** |
| D Local-first write | Local 先・後で Server | **Future**（RG・offline・conflict 後） |

---

## 3. C の失敗モード

**Server OK + Local mirror NG → Server を rollback しない。**

Local は `mirror_pending` / `retry_needed` / `lastMirroredServerUpdatedAt` 等で追跡しうる。  
sync engine は未実装。resume は `legacyServerId` dedupe 再 mirror で足りる想定（4B-4B 同型）。

---

## 4. Local read

一般 Journal UI をすぐ Local-only にすると、mirror 遅延で「保存したのに見えない」。

**初期 PoC 第一候補:** pointer を入れても **一般 UI は Server read のまま**。Local は diagnostics / 検証のみ。

---

## 5. ID / media

- Server 原本期間: Local **新 ULID** + `legacyServerId` = cuid（cuid を永久 ID にしない）
- 将来 D: 最初から Local ULID が primary（連続性あり）
- media: Server 確定 → canonical GET → generation media root。**別加工で hash 改変しない**

---

## 6. 順序

1. write-through semantics 確定（本Phase）  
2. write-through mirror PoC  
3. developer-only activation pointer（一般 UI は Local-only にしない）  
4. のち SoT / Local-first write（別 Gate）

---

## 7. Local-first 切替条件（別 Gate・RG定義は不変）

backup/restore、Local write persistence、offline write、recovery、conflict policy 等。  
RG-1〜4 は変更・PASS 化しない。

---

## 8. 実施していないこと

実装・Server write test・Local write・pointer・activation・原本化・build・Simulator・main merge。
