import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, open, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BackupError, connectionSettings, MAX_BACKUP_BYTES, openBackup } from "./backup-core.mjs";

const DAY = 86_400_000;
const script = fileURLToPath(new URL("./database-backup.mjs", import.meta.url));
let stateFile, state, jobLock, jobLockPath;

async function privateJson(file) {
  const details = await lstat(file);
  if (!details.isFile() || (details.mode & 0o077)) throw new BackupError("Job configuration must be a private regular file.");
  return JSON.parse(await readFile(file, "utf8"));
}
async function save() {
  const temporary = stateFile + ".tmp";
  await writeFile(temporary, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  await rename(temporary, stateFile);
}
function run(command, env) {
  return new Promise((accept, reject) => execFile(process.execPath, [script, command],
    { env, timeout: 360_000, maxBuffer: 4096 }, (error) =>
      error ? reject(new BackupError("Database backup operation failed. Inspect private configuration and connectivity.")) : accept()));
}
async function inspect(file, key, identity) {
  const details = await lstat(file);
  if (!details.isFile() || details.size > MAX_BACKUP_BYTES + 256 || (details.mode & 0o077))
    throw new BackupError("Snapshot must be a supported private regular file.");
  const bytes = await readFile(file);
  const { manifest } = openBackup(bytes, key);
  const created = Date.parse(manifest.createdAt);
  if (manifest.identity !== identity || !Number.isFinite(created) || created > Date.now())
    throw new BackupError("Snapshot identity or date does not match this backup job.");
  return { file: resolve(file), name: basename(file), createdAt: manifest.createdAt,
    bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}

async function main() {
  const [command, configFile, argument, downloadedFile] = process.argv.slice(2);
  if (!["capture", "record", "prune", "expiry", "expired", "status"].includes(command) || !configFile)
    throw new BackupError("Use capture, record, prune, expiry, expired, or status with a private job configuration.");
  const config = await privateJson(configFile);
  const settings = await privateJson(config.settingsFile);
  const identity = connectionSettings(settings.TRIPCOOKER_BACKUP_DATABASE_URL).identity;
  if (identity !== config.sourceProject || config.retentionDays !== 30)
    throw new BackupError("Backup job source or retention is not approved.");
  const keyDetails = await lstat(config.keyFile);
  if (!keyDetails.isFile() || keyDetails.size !== 32 || (keyDetails.mode & 0o077))
    throw new BackupError("Recovery key must remain a private 32-byte regular file.");
  const key = await readFile(config.keyFile);
  stateFile = config.stateFile;
  jobLockPath = stateFile + ".lock";
  try { jobLock = await open(jobLockPath, "wx", 0o600); }
  catch { throw new BackupError("Backup job lock is unavailable. Check other runs and private file permissions before retrying."); }
  try { state = await privateJson(stateFile); }
  catch (error) { if (error.code !== "ENOENT") throw error; state = { records: [] }; }
  const env = { PATH: config.pgBin + ":" + process.env.PATH,
    TRIPCOOKER_BACKUP_DATABASE_URL: settings.TRIPCOOKER_BACKUP_DATABASE_URL,
    TRIPCOOKER_BACKUP_CA_FILE: settings.TRIPCOOKER_BACKUP_CA_FILE,
    TRIPCOOKER_BACKUP_DIRECTORY: config.directory,
    TRIPCOOKER_BACKUP_KEY_FILE: config.keyFile,
    TRIPCOOKER_BACKUP_RETENTION_APPROVED: config.retentionApproval };
  if (command === "capture") {
    // Reuse an authenticated pending snapshot after a failed upload, rather than
    // silently treating a local dump as a completed off-site backup.
    if (!state.pending || Date.now() - Date.parse(state.pending.createdAt) >= DAY) {
      const previous = new Set(await readdir(config.directory));
      await run("create", env);
      const added = (await readdir(config.directory)).filter(name => !previous.has(name) && /^tripcooker-\d+-[a-f0-9-]{36}\.tcbackup$/.test(name));
      if (added.length !== 1) throw new BackupError("Expected exactly one new encrypted snapshot.");
      state.pending = await inspect(join(config.directory, added[0]), key, identity);
    } else state.pending = await inspect(state.pending.file, key, identity);
    state.lastAttemptAt = new Date().toISOString();
    delete state.lastError;
    await save();
    console.log(JSON.stringify({ ...state.pending, folderId: config.folderId, owner: config.owner, offsiteVerified: false }));
  } else if (command === "record") {
    if (!state.pending || !/^[A-Za-z0-9_-]+$/.test(argument || "") || !downloadedFile)
      throw new BackupError("Record requires a pending snapshot, confirmed Drive file ID and private downloaded copy.");
    const checked = await inspect(downloadedFile, key, identity);
    if (checked.sha256 !== state.pending.sha256) throw new BackupError("Downloaded off-site snapshot differs; no backup success recorded.");
    state.records = state.records.filter(record => record.fileId !== argument);
    state.records.push({ ...state.pending, fileId: argument, folderId: config.folderId });
    state.lastSuccessAt = new Date().toISOString();
    delete state.pending;
    delete state.lastError;
    await save();
    console.log("Off-site backup authenticated and recorded.");
  } else if (command === "prune") {
    const success = Date.parse(state.lastSuccessAt);
    if (!Number.isFinite(success) || success > Date.now() || Date.now() - success >= DAY || state.pending)
      throw new BackupError("Retention requires a fresh verified off-site backup; no cleanup ran.");
    const expiredCaches = [];
    for (const name of ["offsite-roundtrip.tcbackup", "daily-offsite-verification.tcbackup"]) {
      const file = join(config.directory, name);
      try {
        const checked = await inspect(file, key, identity);
        if (Date.parse(checked.createdAt) < Date.now() - config.retentionDays * DAY) expiredCaches.push(file);
      } catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    await run("prune", env);
    for (const file of expiredCaches) await unlink(file);
    console.log("Approved local 30-day retention completed.");
  } else if (command === "expiry") {
    const cutoff = Date.now() - config.retentionDays * DAY;
    console.log(JSON.stringify(state.records.filter(record => record.folderId === config.folderId &&
      Number.isFinite(Date.parse(record.createdAt)) && Date.parse(record.createdAt) < cutoff)
      .map(({ fileId, name, sha256, createdAt, folderId }) => ({ fileId, name, sha256, createdAt, folderId }))));
  } else if (command === "expired") {
    const candidate = state.records.find(record => record.fileId === argument);
    if (!candidate || !Number.isFinite(Date.parse(candidate.createdAt)) || Date.parse(candidate.createdAt) >= Date.now() - config.retentionDays * DAY)
      throw new BackupError("Only an expired known snapshot can be removed from the retention ledger.");
    state.records = state.records.filter(record => record.fileId !== argument);
    await save();
    console.log("Confirmed expired off-site snapshot removed from ledger.");
  } else {
    console.log(JSON.stringify({ lastAttemptAt: state.lastAttemptAt || null, lastSuccessAt: state.lastSuccessAt || null,
      pendingUpload: Boolean(state.pending), lastError: state.lastError || null, snapshots: state.records.length, retentionDays: config.retentionDays }));
  }
}
main().catch(async error => {
  const message = error instanceof BackupError ? error.message : "Backup job failed. Check private files, archive authentication and dependencies.";
  if (state && stateFile) { state.lastError = message; state.lastFailureAt = new Date().toISOString(); await save().catch(() => {}); }
  console.error(message);
  process.exitCode = 1;
}).finally(async () => {
  if (jobLock) { await jobLock.close(); await unlink(jobLockPath); }
});
