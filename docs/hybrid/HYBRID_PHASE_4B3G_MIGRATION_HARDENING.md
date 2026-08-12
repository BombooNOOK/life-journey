# Hybrid Phase 4B-3G｜Local Journal Encryption Migration Hardening

**Base:** `feat/local-journal-encryption-migration` @ `0eab90d6ee8309829c816ce9165ea813248b442e`  
**Branch:** `refactor/local-journal-encryption-migration-hardening`  
**main merge:** forbidden

---

## 1. staging残骸の原因（4B-3F）

1. **失敗時に cleanup していなかった。** catch は `phase=failed` を書くだけで、staging ファイルを消さなかった。
2. **plugin `deleteDatabase` だけに依存していた。** SQLCipher の本体 / `-wal` / `-shm` / `-journal` と、plugin connection registry から外れた leftover を FileManager で追っていなかった。
3. 削除エラーを swallow していた。

in-place 暗号化は引き続き不採用。

---

## 2. cleanup lifecycle

| ケース | source | staging + sidecars | promoted | state |
| --- | --- | --- | --- | --- |
| successful promote | 残す | 削除 | 残す（正式候補） | `promoted` |
| failed migration | 残す | 削除 | incomplete も削除 | `failed` |
| rollback（未完了） | 残す | 削除 | 削除 | `failed` |
| rollback（既に promoted） | 残す | leftover のみ削除 | **誤削除しない** | `promoted` |
| app kill 途中 | 触らない | 触らない | 触らない | 検知のみ。自動再開しない |

Kill 後は diagnostics が `canResume` / `canRollback` を表示。製品 boot からは呼ばない。

Allowlist: `ljd_enc_mig_fixture_staging` / `ljd_enc_mig_fixture_promoted` のみ。  
`ljd_local_journal` と plaintext source は migrator / cleanup / native の三層で拒否。

Cleanup は idempotent（2回目は missing で成功）。

---

## 3. sidecar

削除対象（logical name ごと）:

- `{name}SQLite.db`
- `{name}SQLite.db-wal`
- `{name}SQLite.db-shm`
- `{name}SQLite.db-journal`

native FileManager が directory listing で prefix 一致した regular file を unlink。

---

## 4. iOS capacity API

slim plugin `getVolumeAvailableCapacity`:

1. `volumeAvailableCapacityForImportantUsage`（第一）
2. fallback `volumeAvailableCapacity`

Android は同じ plugin method を後で実装する。Domain は `readAvailableBytesOrNull()` のみ。

### required / reserve

```
estimate = max(256KiB, source × 3)
required = estimate + reserve
```

| 値 | 用途 |
| --- | --- |
| PoC reserve = 1MiB | fixture 検証用。製品確定ではない |
| production 推奨 reserve = 64MiB | OS 余裕。今回は推奨値の提案のみ |

`available < required` → 開始禁止。  
**capacity unknown → production fail-closed。** fixture のみ `allowUnknownCapacity` override 可。

---

## 5. actual DB / Release Gates

`ljd_local_journal` は encryption / rename / delete / promote しない。  
RG-1〜4 は未完のまま。Web / Neon / Blob 変更なし。

---

## 6. Simulator H1–H9（iPhone 17）

| Step | 結果 |
| --- | --- |
| H1 十分な容量 | PASS available=6780035072 (`volumeAvailableCapacityForImportantUsage`) required=1310720 |
| H2 人工不足 | PASS `insufficient_free_space` |
| H3 capacity unknown / production | PASS `capacity_unknown_fail_closed` |
| H4 success → staging 0 | PASS（wal/shm も無し） |
| H5 failure injection cleanup | PASS stagingArtifacts=0 |
| H6 rollback | PASS staging 削除・source 残存 |
| H7 cleanup 二回 | PASS deleted=0/0 |
| H8 source plaintext | PASS |
| H9 promoted reopen | PASS encryptedFlag=true entries=3 |

本番 `ljd_local_journal` は plaintext のまま（0件）。staging ファイルは success 後 0。

## 7. 判定

- migration engine を main へ統合: **B（まだ。hardening は feature branch に残す）**
- actual journal migration: **B / 禁止**

次Phase推奨: engine を main に載せる前の Security Foundation との小さな移植レビュー。本番 journal 切替・RG-1〜4・Local 原本化はまだ禁止。
