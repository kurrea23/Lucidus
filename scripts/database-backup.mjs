import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { chmod, lstat, mkdir, mkdtemp, open, readFile, readdir, realpath, rm, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { BackupError, connectionSettings, MAX_BACKUP_BYTES, openBackup, restoreEntries, schemaHash, sealBackup, validateRestoreTarget } from "./backup-core.mjs";

const repository = resolve(fileURLToPath(new URL("../", import.meta.url)));
const schemaQuery = `SELECT coalesce(string_agg(table_name || '.' || column_name || ':' || data_type || ':' || udt_name || ':' || is_nullable, E'\n' ORDER BY table_name, ordinal_position), '') FROM information_schema.columns WHERE table_schema = 'auth'`;
const emptyQuery = `SELECT (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::text || ':' || (SELECT count(*) FROM auth.users)::text`;

async function privateDirectory(value) {
  if (!value) throw new BackupError("Configure a private backup directory outside the repository.");
  const location = resolve(value);
  await mkdir(location, { recursive: true, mode: 0o700 });
  const actual = await realpath(location);
  if (actual === repository || actual.startsWith(repository + sep))
    throw new BackupError("Backups and keys must stay outside the repository.");
  for (let parent = actual; ; parent = dirname(parent)) {
    try {
      await stat(join(parent, ".git"));
      throw new BackupError("Backups and keys must stay outside Git checkouts.");
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (dirname(parent) === parent) break;
  }
  if (((await stat(actual)).mode & 0o077) !== 0)
    throw new BackupError("Choose a private directory with mode 0700; existing shared directories are not changed.");
  return actual;
}

async function loadKey() {
  const file = process.env.TRIPCOOKER_BACKUP_KEY_FILE;
  if (!file) throw new BackupError("Configure TRIPCOOKER_BACKUP_KEY_FILE privately.");
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const details = await handle.stat();
    if (!details.isFile() || details.size !== 32 || (details.mode & 0o077) !== 0)
      throw new BackupError("The key must be a private 32-byte file with mode 0600.");
    return await handle.readFile();
  } finally { await handle.close(); }
}

function run(command, args, env) {
  return new Promise((accept, reject) => {
    execFile(command, args, { env, timeout: 120_000, maxBuffer: MAX_BACKUP_BYTES, encoding: "buffer" }, (error, stdout, stderr) => {
      // Provider stderr can contain account identifiers, SQL rows or credentials.
      if (error || (command === "pg_dump" && stderr.length))
        reject(new BackupError(`${command} did not complete cleanly. Verify the client, permissions, TLS and database configuration privately.`));
      else accept(stdout);
    });
  });
}

async function query(settings, sql) {
  return (await run("psql", ["-X", "--no-password", "-At", "--set", "ON_ERROR_STOP=1", "--command", sql], settings.env)).toString("utf8").trim();
}

async function main() {
  const command = process.argv[2];
  if (command === "key") {
    const file = process.env.TRIPCOOKER_BACKUP_KEY_FILE;
    if (!file) throw new BackupError("Configure TRIPCOOKER_BACKUP_KEY_FILE privately.");
    const directory = await privateDirectory(dirname(resolve(file)));
    await writeFile(join(directory, basename(file)), randomBytes(32), { mode: 0o600, flag: "wx" });
    console.log("Backup key created privately. Keep a separate secure recovery copy; its value is never printed.");
    return;
  }
  if (!["create", "restore", "prune"].includes(command)) throw new BackupError("Choose key, create, restore, or prune.");
  const key = await loadKey();
  const directory = await privateDirectory(process.env.TRIPCOOKER_BACKUP_DIRECTORY);
  if (command === "prune") {
    const policy = JSON.parse(await readFile(new URL("../src/lib/policy-release.json", import.meta.url), "utf8"));
    if (process.env.TRIPCOOKER_BACKUP_RETENTION_APPROVED !== policy.version)
      throw new BackupError("Approve the current backup retention policy before removing expired snapshots.");
    const source = connectionSettings(process.env.TRIPCOOKER_BACKUP_DATABASE_URL);
    const cutoff = Date.now() - policy.backupRetentionDays * 86_400_000;
    const expired = [];
    for (const name of await readdir(directory)) {
      if (!/^tripcooker-\d+-[a-f0-9-]{36}\.tcbackup$/.test(name)) continue;
      const file = join(directory, name);
      const details = await lstat(file);
      if (!details.isFile() || details.size > MAX_BACKUP_BYTES + 256)
        throw new BackupError("Unexpected backup file; no retention cleanup has run.");
      const { manifest } = openBackup(await readFile(file), key);
      const created = Date.parse(manifest.createdAt);
      if (!Number.isFinite(created) || created > Date.now())
        throw new BackupError("Invalid snapshot date; no retention cleanup has run.");
      if (manifest.identity === source.identity && created < cutoff) expired.push(file);
    }
    // Validate all recognized snapshots before deleting any; never touch unrelated files.
    for (const file of expired) await unlink(file);
    console.log(`Expired TripCooker snapshots removed: ${expired.length}. Apply the same approved retention to off-site copies.`);
    return;
  }
  if (command === "create") {
    const settings = connectionSettings(process.env.TRIPCOOKER_BACKUP_DATABASE_URL);
    const authSchemaHash = schemaHash(await query(settings, schemaQuery));
    const serverVersion = await query(settings, "SHOW server_version_num");
    const archive = await run("pg_dump", ["--no-password", "--format=custom", "--schema=public", "--schema=auth", "--no-owner"], settings.env);
    if (schemaHash(await query(settings, schemaQuery)) !== authSchemaHash)
      throw new BackupError("Auth schema changed during backup. Retry after the migration completes.");
    const encrypted = sealBackup(archive, { identity: settings.identity, authSchemaHash, serverVersion, createdAt: new Date().toISOString() }, key);
    const file = join(directory, `tripcooker-${Date.now()}-${randomUUID()}.tcbackup`);
    await writeFile(file, encrypted, { flag: "wx", mode: 0o600 });
    console.log("Encrypted database backup created. A restore test and an approved off-site copy are still required.");
    return;
  }
  const file = process.env.TRIPCOOKER_RESTORE_BACKUP_FILE;
  if (!file || (await stat(file)).size > MAX_BACKUP_BYTES + 256)
    throw new BackupError("Configure a supported encrypted backup file.");
  const { manifest, archive } = openBackup(await readFile(file), key);
  const target = connectionSettings(process.env.TRIPCOOKER_RESTORE_DATABASE_URL);
  if (target.identity === manifest.identity || process.env.TRIPCOOKER_RESTORE_CONFIRM !== target.identity)
    throw new BackupError("Restore requires an explicitly confirmed, different project.");
  validateRestoreTarget(manifest, target, process.env.TRIPCOOKER_RESTORE_CONFIRM,
    schemaHash(await query(target, schemaQuery)), await query(target, emptyQuery));
  const temporary = await mkdtemp(join(directory, "restore-"));
  try {
    await chmod(temporary, 0o700);
    const archiveFile = join(temporary, "verified.dump");
    const entriesFile = join(temporary, "entries.txt");
    await writeFile(archiveFile, archive, { flag: "wx", mode: 0o600 });
    const toc = (await run("pg_restore", ["--list", archiveFile], { PATH: process.env.PATH })).toString("utf8");
    await writeFile(entriesFile, restoreEntries(toc), { flag: "wx", mode: 0o600 });
    await run("pg_restore", ["--no-password", "--no-owner", "--single-transaction", "--exit-on-error", "--use-list", entriesFile, "--dbname", target.env.PGDATABASE, archiveFile],
      { ...target.env, PGOPTIONS: "-c session_replication_role=replica" });
    console.log("Restore completed in the isolated project. Verify access policies, accounts, trip counts, billing mappings and deletion exclusions before use.");
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

main().catch((error) => {
  // Only our fixed messages are safe. Unexpected filesystem/URL errors may include sensitive paths or values.
  const message = error instanceof BackupError ? error.message : "Backup operation failed. Check private configuration, key, archive integrity, target and PostgreSQL dependencies.";
  console.error(message);
  process.exitCode = 1;
});
