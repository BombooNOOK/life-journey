/**
 * Simulator-safe analogue of native SQLCipher file durability.
 *
 * Node cannot open Capacitor SQLCipher here. This session still:
 * - opens an encrypted-at-rest container
 * - persists intent+payload through the shared SQL store
 * - closes the SQLite handle
 * - discards the store instance
 * - reopens the same file and loads exact request_json
 *
 * Not imported by Production Web or Vercel paths.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  createClientSaveDurableStoreFromSql,
  ensureClientSaveIntentSchema,
  type ClientSaveIntentSqlConnection,
  type ClientSaveIntentSqlSession,
} from "@/lib/journal/clientSaveIntent/clientSaveIntentSqlStore";
import type { ClientSaveDurableStore } from "@/lib/journal/clientSaveIntent/types";

const MAGIC = Buffer.from("LJDCS1");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LENGTH);
}

function encryptSqliteBytes(plaintext: Buffer, passphrase: string): Buffer {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, salt, iv, tag, ciphertext]);
}

function decryptSqliteBytes(container: Buffer, passphrase: string): Buffer {
  if (container.length < MAGIC.length + SALT_LENGTH + IV_LENGTH + 16) {
    throw new Error("encrypted_intent_db_corrupt");
  }
  if (!container.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("encrypted_intent_db_magic_mismatch");
  }
  let offset = MAGIC.length;
  const salt = container.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  const iv = container.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const tag = container.subarray(offset, offset + 16);
  offset += 16;
  const ciphertext = container.subarray(offset);
  try {
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("encrypted_intent_db_passphrase_mismatch");
  }
}

function adaptNodeSqlite(db: DatabaseSync): ClientSaveIntentSqlConnection {
  return {
    async query(sql, params = []) {
      const statement = db.prepare(sql);
      const rows = (
        params.length > 0 ? statement.all(...params) : statement.all()
      ) as Record<string, unknown>[];
      return { values: rows };
    },
    async run(sql, params = []) {
      const statement = db.prepare(sql);
      const info = params.length > 0 ? statement.run(...params) : statement.run();
      return { changes: { changes: Number(info.changes ?? 0) } };
    },
    async execute(statements) {
      db.exec(statements);
    },
  };
}

export function createEncryptedFileSqliteSession(options: {
  encryptedPath: string;
  passphrase: string;
}): ClientSaveIntentSqlSession {
  return {
    async withDb(fn) {
      const workDir = await mkdtemp(join(tmpdir(), "ljd-intent-sql-"));
      const sqlitePath = join(workDir, "intent.sqlite");
      try {
        let existing: Buffer | null = null;
        try {
          existing = await readFile(options.encryptedPath);
        } catch {
          existing = null;
        }
        if (existing && existing.length > 0) {
          await writeFile(sqlitePath, decryptSqliteBytes(existing, options.passphrase));
        }
        const native = new DatabaseSync(sqlitePath);
        try {
          const db = adaptNodeSqlite(native);
          await ensureClientSaveIntentSchema(db);
          await db.execute("PRAGMA foreign_keys = ON");
          return await fn(db);
        } finally {
          native.close();
        }
      } finally {
        try {
          const plaintext = await readFile(sqlitePath);
          await writeFile(
            options.encryptedPath,
            encryptSqliteBytes(plaintext, options.passphrase),
          );
        } catch {
          // Open failures (bad passphrase) must not rewrite the container.
        }
        await rm(workDir, { recursive: true, force: true });
      }
    },
  };
}

export function createEncryptedFileClientSaveDurableStore(options: {
  encryptedPath: string;
  passphrase: string;
}): ClientSaveDurableStore {
  return createClientSaveDurableStoreFromSql(createEncryptedFileSqliteSession(options));
}

export async function readEncryptedIntentContainerBytes(encryptedPath: string): Promise<Buffer> {
  return readFile(encryptedPath);
}

export async function unlinkEncryptedIntentContainer(encryptedPath: string): Promise<void> {
  try {
    await unlink(encryptedPath);
  } catch {
    // Test cleanup only.
  }
}
