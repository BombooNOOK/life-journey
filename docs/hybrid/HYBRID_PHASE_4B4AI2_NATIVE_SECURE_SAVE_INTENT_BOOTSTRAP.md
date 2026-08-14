# 4B-4AI-2 Native Secure Save Intent Bootstrap

## Formal boundary

`initializeSaveIntentStore()` is native-only infrastructure, not a Journal UI
API. It returns one of `ready`, `unsupported_platform`,
`secure_store_unavailable`, `database_unavailable`, or `schema_error`.
AI-3 must require `ready` **and** a server capability before attaching a
`saveOperationId`; every other result preserves the legacy save path.

Browser has no encrypted, plaintext, Preferences, localStorage, or IndexedDB
fallback.

## Storage and key policy

- DB name: `ljd_client_save_operation_intent`
- Location: Capacitor SQLite's configured Application Support directory:
  `Library/Application Support/app.bamboonook.ljd`
- SQLCipher mode: plugin `secret`
- Key path: one plugin built-in Keychain item, never a parallel LJD keystore.
  Bootstrap reads no secret. If the item is absent, it generates in-memory
  material once and passes it to `setEncryptionSecret`; later launches reuse
  the plugin-held item.
- The DB is excluded from backup and must verify
  `NSFileProtectionComplete`. Any attribute or Keychain failure is fail-closed.
- The DB contains intent metadata only; it excludes journal body, photo,
  cookie, token, password, DB URL, and other request secrets.

## Schema and lifecycle

Schema version 1 is persisted in `PRAGMA user_version`. A new empty DB is
created once; a partial/unversioned table, unknown version, or unexpected
columns fails closed. Bootstrap never deletes or recreates a DB.

Allowed transitions are forward-only with same-status idempotency. `completed`
and `failed_final` are terminal; for example,
`completed → awaiting_result` is rejected. The client lifecycle remains
separate from server JSO checkpoints.

## AI-2 local verification status

- Unit tests verify browser rejection, Keychain/bootstrap fail-closed mapping,
  idempotent readiness, backup exclusion, lifecycle validation, actor-scoped
  store behavior, and existing Save Intent service regressions.
- iOS Simulator Debug build succeeds.
- On the disposable iPhone Simulator, the developer-only diagnostics shell
  reports `secure_store_unavailable`; no DB is created and no fallback occurs.
  This establishes fail-closed behavior, but does **not** establish a ready
  Keychain/SQLCipher open for the new DB.

Therefore native ready/restart/encrypted-header/wrong-key runtime verification
remains required before AI-2 may be marked PASS. No personal or company device
was used, no Keychain reset, app uninstall, erase, restore, or app-data deletion
was performed.
