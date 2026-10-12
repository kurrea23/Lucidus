import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { openBackup, sealBackup } from "../../scripts/backup-core.mjs";

const execute = promisify(execFile);
const bin = process.env.TRIPCOOKER_TEST_PG_BIN;

test("PostgreSQL backup and isolated restore preserve accounts, trips, billing, RLS and RPC permissions", { skip: !bin }, async () => {
  const folder = await mkdtemp(join(tmpdir(), "tc-backup-"));
  const baseEnv = { NODE_ENV: "test" as const, PATH: `${bin}:${process.env.PATH}`, LANG: "en_US.UTF-8" };
  const portServer = createServer();
  await new Promise<void>((resolve, reject) => {
    portServer.once("error", reject);
    portServer.listen(0, "127.0.0.1", resolve);
  });
  const address = portServer.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  await new Promise<void>((resolve, reject) => portServer.close((error) => error ? reject(error) : resolve()));
  const cluster = join(folder, "cluster");
  let running = false;
  try {
    await execute("initdb", ["-D", cluster, "--username=postgres", "--auth=trust"], { env: baseEnv });
    await execute("pg_ctl", ["-D", cluster, "-l", join(folder, "postgres.log"), "-o", `-h 127.0.0.1 -p ${port} -k ${folder}`, "-w", "start"], { env: baseEnv });
    running = true;
    const pgEnv = { ...baseEnv, PGHOST: "127.0.0.1", PGPORT: String(port), PGUSER: "postgres" };
    async function query(database: string, sql: string) {
      return (await execute("psql", ["-X", "-At", "--set", "ON_ERROR_STOP=1", "--command", sql], {
        env: { ...pgEnv, PGDATABASE: database },
      })).stdout.trim();
    }
    await query("postgres", "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS");
    await query("postgres", "CREATE DATABASE source_fixture");
    await query("postgres", "CREATE DATABASE restore_fixture");
    const authSchema = "CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email text); CREATE TABLE auth.schema_migrations(version text PRIMARY KEY); INSERT INTO auth.schema_migrations VALUES ('managed-baseline-v1')";
    await query("source_fixture", authSchema);
    await query("restore_fixture", authSchema);
    await query("source_fixture", await readFile("supabase/launch.sql", "utf8"));
    const user = "11111111-1111-4111-8111-111111111111";
    const tripData = { user: { id: user, email: "fixture@example.com", plan: "free" }, trips: [{ id: "trip-fixture", status: "planning", destination: "Synthetic destination" }] };
    await query("source_fixture", `INSERT INTO auth.users VALUES ('${user}', 'fixture@example.com'); INSERT INTO public.tripcooker_state(user_id, data, version) VALUES ('${user}', '${JSON.stringify(tripData)}', 5); INSERT INTO public.tripcooker_billing(user_id, customer_id) VALUES ('${user}', 'cus_fixture'); INSERT INTO public.tripcooker_billing_events(event_id, user_id, event_type, plan_observed) VALUES ('evt_fixture', '${user}', 'invoice.paid', 'free'); INSERT INTO public.tripcooker_request_limits(user_id, request_count) VALUES ('${user}', 3)`);
    const privateEnv = {
      ...baseEnv,
      TRIPCOOKER_BACKUP_KEY_FILE: join(folder, "key"),
      TRIPCOOKER_BACKUP_DIRECTORY: join(folder, "backups"),
      TRIPCOOKER_BACKUP_DATABASE_URL: `postgresql://postgres@127.0.0.1:${port}/source_fixture`,
      TRIPCOOKER_RESTORE_DATABASE_URL: `postgresql://postgres@127.0.0.1:${port}/restore_fixture`,
      TRIPCOOKER_RESTORE_CONFIRM: `local:${port}:restore_fixture`,
    };
    const run = (command: string, extra: Record<string, string> = {}) => execute(process.execPath, ["scripts/database-backup.mjs", command], { env: { ...privateEnv, ...extra } });
    await run("key");
    await run("create");
    const backups = await readdir(privateEnv.TRIPCOOKER_BACKUP_DIRECTORY);
    assert.equal(backups.length, 1);
    const backupFile = join(privateEnv.TRIPCOOKER_BACKUP_DIRECTORY, backups[0]);
    assert.equal((await stat(backupFile)).mode & 0o777, 0o600);
    assert.equal((await stat(privateEnv.TRIPCOOKER_BACKUP_KEY_FILE)).mode & 0o777, 0o600);
    const ciphertext = await readFile(backupFile);
    assert.ok(!ciphertext.includes(Buffer.from("Synthetic destination")));
    const corrupt = Buffer.from(ciphertext);
    corrupt[corrupt.length - 1] ^= 1;
    const corruptFile = join(folder, "corrupt.tcbackup");
    await writeFile(corruptFile, corrupt, { mode: 0o600 });
    await assert.rejects(run("restore", { TRIPCOOKER_RESTORE_BACKUP_FILE: corruptFile }));
    assert.equal(await query("restore_fixture", "SELECT count(*) FROM auth.users"), "0");
    await assert.rejects(run("restore", { TRIPCOOKER_RESTORE_BACKUP_FILE: backupFile, TRIPCOOKER_RESTORE_DATABASE_URL: privateEnv.TRIPCOOKER_BACKUP_DATABASE_URL, TRIPCOOKER_RESTORE_CONFIRM: `local:${port}:source_fixture` }));
    await run("restore", { TRIPCOOKER_RESTORE_BACKUP_FILE: backupFile });
    assert.deepEqual(JSON.parse(await query("restore_fixture", "SELECT data::text FROM public.tripcooker_state")), tripData);
    assert.equal(await query("restore_fixture", "SELECT version FROM public.tripcooker_state"), "5");
    assert.equal(await query("restore_fixture", "SELECT customer_id FROM public.tripcooker_billing"), "cus_fixture");
    assert.equal(await query("restore_fixture", "SELECT event_id FROM public.tripcooker_billing_events"), "evt_fixture");
    assert.equal(await query("restore_fixture", "SELECT request_count FROM public.tripcooker_request_limits"), "3");
    assert.equal(await query("restore_fixture", "SELECT email FROM auth.users"), "fixture@example.com");
    assert.equal(await query("restore_fixture", "SELECT count(*) FROM auth.schema_migrations"), "1");
    assert.equal(await query("restore_fixture", "SELECT count(*) FROM pg_class WHERE relname LIKE 'tripcooker_%' AND relkind = 'r' AND relrowsecurity"), "4");
    assert.equal(await query("restore_fixture", "SELECT has_table_privilege('anon', 'public.tripcooker_state', 'SELECT')"), "f");
    assert.equal(await query("restore_fixture", "SELECT has_table_privilege('service_role', 'public.tripcooker_state', 'SELECT')"), "t");
    assert.equal(await query("restore_fixture", "SELECT has_function_privilege('anon', 'public.save_tripcooker_state(uuid,bigint,jsonb,boolean)', 'EXECUTE')"), "f");
    assert.equal(await query("restore_fixture", `SET ROLE service_role; SELECT public.save_tripcooker_state('${user}', 5, '${JSON.stringify(tripData)}', false)`), "SET\n6");
    await assert.rejects(run("restore", { TRIPCOOKER_RESTORE_BACKUP_FILE: backupFile }));
    assert.equal(await query("restore_fixture", "SELECT version FROM public.tripcooker_state"), "6");
    assert.equal((await readdir(privateEnv.TRIPCOOKER_BACKUP_DIRECTORY)).filter((file) => file.startsWith("restore-")).length, 0);
    const key = await readFile(privateEnv.TRIPCOOKER_BACKUP_KEY_FILE);
    const verified = openBackup(ciphertext, key);
    const oldFile = join(privateEnv.TRIPCOOKER_BACKUP_DIRECTORY, "tripcooker-1-11111111-1111-4111-8111-111111111111.tcbackup");
    await writeFile(oldFile, sealBackup(verified.archive, { ...verified.manifest, createdAt: new Date(Date.now() - 31 * 86_400_000).toISOString() }, key), { mode: 0o600 });
    await assert.rejects(run("prune"));
    assert.equal((await readdir(privateEnv.TRIPCOOKER_BACKUP_DIRECTORY)).length, 2);
    await run("prune", { TRIPCOOKER_BACKUP_RETENTION_APPROVED: "2026-10-11-v1" });
    assert.deepEqual(await readdir(privateEnv.TRIPCOOKER_BACKUP_DIRECTORY), [backups[0]]);
  } finally {
    if (running) await execute("pg_ctl", ["-D", cluster, "-w", "-m", "fast", "stop"], { env: baseEnv });
    await rm(folder, { recursive: true, force: true });
  }
});
