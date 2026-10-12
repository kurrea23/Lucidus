import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const MAGIC = Buffer.from("TRIPCOOKER_BACKUP_1\n");
export const MAX_BACKUP_BYTES = 128 * 1024 * 1024;
export class BackupError extends Error {}

export function connectionSettings(value) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new BackupError("Use a PostgreSQL connection.");
  const user = decodeURIComponent(url.username);
  const database = decodeURIComponent(url.pathname.slice(1));
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const direct = url.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.(co|com)$/);
  const pooled = url.hostname.endsWith(".pooler.supabase.com") && user.match(/\.([a-z0-9]{20})$/);
  const identity = local ? `local:${url.port || "5432"}:${database}` : direct?.[1] || pooled?.[1];
  if (!identity || !user || !database) throw new BackupError("Use a dedicated Supabase project or a localhost test database.");
  if (url.searchParams.has("options")) throw new BackupError("Connection options must not change backup behavior.");
  return {
    identity,
    env: {
      PATH: process.env.PATH,
      PGHOST: url.hostname.replace(/^\[|\]$/g, ""),
      PGPORT: url.port || "5432",
      PGUSER: user,
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: database,
      PGCONNECT_TIMEOUT: "15",
      PGSSLMODE: local ? "disable" : "verify-full",
      PGSSLROOTCERT: local ? undefined : process.env.TRIPCOOKER_BACKUP_CA_FILE || "system",
      PGCLIENTENCODING: "UTF8",
    },
  };
}

export function sealBackup(archive, manifest, key) {
  if (key.length !== 32) throw new BackupError("The backup key must contain 32 bytes.");
  if (!archive.subarray(0, 5).equals(Buffer.from("PGDMP"))) throw new BackupError("Expected a PostgreSQL custom archive.");
  const metadata = Buffer.from(JSON.stringify({ ...manifest, format: 1 }));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(metadata.length);
  const payload = Buffer.concat([length, metadata, archive]);
  if (payload.length > MAX_BACKUP_BYTES) throw new BackupError("Backup exceeds the MVP size limit; use a reviewed streaming backup process.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(MAGIC);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted]);
}

export function openBackup(encrypted, key) {
  if (encrypted.length > MAX_BACKUP_BYTES + MAGIC.length + 28 || encrypted.length < MAGIC.length + 33)
    throw new BackupError("Invalid backup size.");
  if (!encrypted.subarray(0, MAGIC.length).equals(MAGIC) || key.length !== 32)
    throw new BackupError("Invalid backup format or key.");
  const offset = MAGIC.length;
  const decipher = createDecipheriv("aes-256-gcm", key, encrypted.subarray(offset, offset + 12));
  decipher.setAAD(MAGIC);
  decipher.setAuthTag(encrypted.subarray(offset + 12, offset + 28));
  // No plaintext is returned or sent to a database until the entire tag verifies.
  const payload = Buffer.concat([decipher.update(encrypted.subarray(offset + 28)), decipher.final()]);
  const length = payload.readUInt32BE(0);
  if (length > 64 * 1024 || length + 9 > payload.length) throw new BackupError("Invalid backup manifest.");
  const manifest = JSON.parse(payload.subarray(4, 4 + length).toString("utf8"));
  const archive = payload.subarray(4 + length);
  if (manifest.format !== 1 || typeof manifest.identity !== "string" || typeof manifest.authSchemaHash !== "string" || !archive.subarray(0, 5).equals(Buffer.from("PGDMP")))
    throw new BackupError("Invalid authenticated backup.");
  return { manifest, archive };
}

export function schemaHash(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function restoreEntries(toc) {
  const entries = toc.split("\n").filter((line) => {
    if (!/^\d+;/.test(line)) return false;
    // A fresh Supabase project already owns its managed auth schema and migrations.
    if (/ TABLE DATA auth (migrations|schema_migrations)\s/.test(line)) return false;
    if (/ (TABLE DATA|SEQUENCE SET) auth /.test(line)) return true;
    if (/ SCHEMA - public\s/.test(line)) return false;
    return / public /.test(line);
  });
  const required = ["tripcooker_state", "tripcooker_billing", "tripcooker_billing_events", "tripcooker_request_limits"];
  if (required.some((table) => !entries.some((line) => line.includes(` TABLE DATA public ${table} `))) ||
      !entries.some((line) => / TABLE DATA auth users\s/.test(line)))
    throw new BackupError("Archive does not contain TripCooker state and account data.");
  return entries.join("\n") + "\n";
}

export function validateRestoreTarget(manifest, target, confirmation, targetSchemaHash, emptyState) {
  if (manifest.identity === target.identity) throw new BackupError("Refusing to restore over the source project.");
  if (confirmation !== target.identity) throw new BackupError("Confirm the exact isolated restore project before proceeding.");
  if (targetSchemaHash !== manifest.authSchemaHash) throw new BackupError("Managed auth schemas differ. Use a matching Supabase version and review the restore.");
  if (emptyState.trim() !== "0:0") throw new BackupError("Restore target must have no public tables and no account users.");
}
