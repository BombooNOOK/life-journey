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

## AI-2.1 native verification status

The initial Simulator HOLD was diagnosed as a **test-build signing condition**:
the app had been built with `CODE_SIGNING_ALLOWED=NO`, so plugin
`setEncryptionSecret` failed at its Keychain write. Plugin registration and
`isSecretStored` had already succeeded. The formal Keychain path, accessibility
policy, SQLCipher mode, and Capacitor configuration were not changed.

A normally locally signed Debug Simulator build then verified:

- fresh boot: no stored secret → keyless encrypted open rejected → plugin
  Keychain secret created → bootstrap `ready`;
- process restart: stored secret reused and the existing prepared test-metadata
  intent was found;
- a different in-memory candidate was rejected by the plugin's non-mutating
  secret comparison API;
- intent DB exists beneath Application Support, does not have the plaintext
  SQLite header, has `user_version=1`/expected schema enforced by the ready
  gate, is backup-excluded, and has `NSFileProtectionComplete`;
- completed / failed-final lifecycle handling, terminal rewind rejection,
  pending listing, actor isolation, and `deleteByActor` preservation of another
  actor's row.

Safe developer-only diagnostic stage codes expose no secret or native error
text. Browser remains `unsupported_platform` with no store fallback.

No personal or company device was used, and no Keychain reset, app uninstall,
erase, restore, or app-data deletion was performed.
