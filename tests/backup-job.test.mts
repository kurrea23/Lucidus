import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { sealBackup } from "../scripts/backup-core.mjs";

test("daily job requires authenticated off-site bytes before success and rejects unsafe retention", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tripcooker-job-"));
  const stateFile = join(directory, "state.json");
  const configFile = join(directory, "config.json");
  const keyFile = join(directory, "key.bin");
  const settingsFile = join(directory, "settings.json");
  const downloaded = join(directory, "download.tcbackup");
  const key = randomBytes(32);
  const createdAt = new Date().toISOString();
  const bytes = sealBackup(Buffer.from("PGDMPfixture"), { identity: "local:5432:test", authSchemaHash: "fixture", createdAt }, key);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  async function put(file: string, value: unknown) { await writeFile(file, JSON.stringify(value), { mode: 0o600 }); }
  const invoke = (...args: string[]) => execFileSync(process.execPath, ["scripts/backup-job.mjs", ...args.slice(0, 1), configFile, ...args.slice(1)], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    await writeFile(keyFile, key, { mode: 0o600 });
    await put(settingsFile, { TRIPCOOKER_BACKUP_DATABASE_URL: "postgres://postgres@localhost:5432/test" });
    await put(configFile, { settingsFile, keyFile, directory, stateFile, pgBin: directory, sourceProject: "local:5432:test", folderId: "private-folder", retentionDays: 30, retentionApproval: "2026-10-11-v1" });
    await put(stateFile, { records: [], pending: { sha256, createdAt, name: "fixture.tcbackup" } });
    const tampered = Buffer.from(bytes); tampered[tampered.length - 1] ^= 1;
    await writeFile(downloaded, tampered, { mode: 0o600 });
    assert.throws(() => invoke("record", "drive-file", downloaded));
    let state = JSON.parse(await readFile(stateFile, "utf8"));
    assert.equal(state.lastSuccessAt, undefined);
    assert.equal(state.records.length, 0);
    assert.ok(state.pending);
    await writeFile(downloaded, bytes, { mode: 0o600 });
    invoke("record", "drive-file", downloaded);
    state = JSON.parse(await readFile(stateFile, "utf8"));
    assert.ok(state.lastSuccessAt);
    assert.equal(state.pending, undefined);
    assert.equal(state.records[0].sha256, sha256);
    state.lastSuccessAt = "invalid-date";
    await put(stateFile, state);
    assert.throws(() => invoke("prune"), /Command failed/);
    state.records.push({ fileId: "old-file", folderId: "private-folder", name: "old.tcbackup", createdAt: new Date(Date.now() - 40 * 86_400_000).toISOString(), sha256 });
    state.records.push({ fileId: "other-folder", folderId: "unrelated", createdAt: new Date(0).toISOString() });
    await put(stateFile, state);
    assert.deepEqual(JSON.parse(invoke("expiry")).map((r: { fileId: string }) => r.fileId), ["old-file"]);
    assert.throws(() => invoke("expired", "drive-file"));
    invoke("expired", "old-file");
    assert.equal(JSON.parse(invoke("expiry")).length, 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
