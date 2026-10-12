import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { connectionSettings, openBackup, restoreEntries, sealBackup, validateRestoreTarget } from "../scripts/backup-core.mjs";

test("encrypted backups authenticate the complete archive and manifest before releasing plaintext", () => {
  const key = randomBytes(32);
  const archive = Buffer.from("PGDMPprivate synthetic trip details");
  const manifest = { identity: "local:55432:source", authSchemaHash: "fixture-hash" };
  const encrypted = sealBackup(archive, manifest, key);
  assert.ok(!encrypted.includes(Buffer.from("private synthetic")));
  assert.ok(!encrypted.includes(Buffer.from("fixture-hash")));
  const recovered = openBackup(encrypted, key);
  assert.deepEqual(recovered.archive, archive);
  assert.equal(recovered.manifest.identity, manifest.identity);
  assert.throws(() => openBackup(encrypted, randomBytes(32)));
  const modified = Buffer.from(encrypted);
  modified[modified.length - 1] ^= 1;
  assert.throws(() => openBackup(modified, key));
  assert.throws(() => openBackup(encrypted.subarray(0, 30), key));
  assert.throws(() => sealBackup(Buffer.from("plain sql"), manifest, key));
});

test("direct and pooler connections identify the same project and remote TLS cannot be disabled", () => {
  const direct = connectionSettings("postgresql://postgres:private-value@db.abcdefghijklmnopqrst.supabase.co:5432/postgres");
  const pooled = connectionSettings("postgresql://postgres.abcdefghijklmnopqrst:private-value@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=disable");
  assert.equal(direct.identity, pooled.identity);
  assert.equal(pooled.env.PGSSLMODE, "verify-full");
  assert.equal(pooled.env.PGSSLROOTCERT, "system");
  assert.ok(!direct.identity.includes("private-value"));
  assert.throws(() => connectionSettings("postgresql://postgres:private-value@unrelated.example/postgres"));
  assert.throws(() => connectionSettings("postgresql://postgres@localhost/test?options=-c%20session_replication_role=replica"));
});

test("restore refuses the source project, an unconfirmed target, incompatible auth and populated targets", () => {
  const manifest = { identity: "source", authSchemaHash: "auth-v1" };
  assert.throws(() => validateRestoreTarget(manifest, { identity: "source" }, "source", "auth-v1", "0:0"));
  assert.throws(() => validateRestoreTarget(manifest, { identity: "target" }, "wrong", "auth-v1", "0:0"));
  assert.throws(() => validateRestoreTarget(manifest, { identity: "target" }, "target", "auth-v2", "0:0"));
  for (const populated of ["1:0", "0:1", "1:1"])
    assert.throws(() => validateRestoreTarget(manifest, { identity: "target" }, "target", "auth-v1", populated));
  assert.doesNotThrow(() => validateRestoreTarget(manifest, { identity: "target" }, "target", "auth-v1", "0:0"));
});

test("restore includes every TripCooker table and auth users while preserving managed auth definitions", () => {
  const toc = [
    "1; 2615 1 SCHEMA - public postgres",
    "2; 2615 2 SCHEMA - auth postgres",
    "3; 1259 3 TABLE auth users postgres",
    "4; 1259 4 TABLE DATA auth users postgres",
    "5; 1259 5 TABLE DATA auth schema_migrations postgres",
    "6; 1259 6 TABLE DATA auth migrations postgres",
    "7; 1259 7 TABLE public tripcooker_state postgres",
    "8; 0 7 TABLE DATA public tripcooker_state postgres",
    "9; 0 8 TABLE DATA public tripcooker_billing postgres",
    "10; 0 9 TABLE DATA public tripcooker_billing_events postgres",
    "11; 0 10 TABLE DATA public tripcooker_request_limits postgres",
    "12; 0 11 ACL public TABLE tripcooker_state postgres",
  ].join("\n");
  const selected = restoreEntries(toc);
  assert.match(selected, /TABLE DATA auth users/);
  assert.match(selected, /TABLE public tripcooker_state/);
  assert.match(selected, /ACL public TABLE tripcooker_state/);
  assert.doesNotMatch(selected, /SCHEMA - public|TABLE auth users|schema_migrations|DATA auth migrations/);
  assert.throws(() => restoreEntries(toc.replace("TABLE DATA public tripcooker_billing ", "TABLE DATA public missing ")));
});
