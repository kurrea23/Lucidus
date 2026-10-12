# TripCooker backup and recovery

This procedure is prepared for the current MVP. A local PostgreSQL test proves encryption and isolated restoration of synthetic account, trip, billing and request-limit records, RLS, grants and save functions. It does **not** prove a hosted Supabase restore, an off-site copy, scheduled execution or production recovery. Complete those before customer data is accepted.

Supabase recommends regular exports and off-site backups for Free projects; automatic daily backups are supplied on its paid plans. Database backups exclude Storage file contents. TripCooker currently stores its planner in Postgres and does not use Storage. See [Supabase backups](https://supabase.com/docs/guides/platform/backups) and [Supabase logical restore guidance](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## Private setup

- Use PostgreSQL client tools at least as new as the source database. PostgreSQL 18 clients are installed locally at `/opt/homebrew/opt/postgresql@18/bin`; no system database service was started. The integration test creates and stops its own temporary localhost-only cluster.
- Keep the database connection, backup key and backup locations in an ignored `.env.backup.local` or the job host's private environment. Never send passwords, connection strings, recovery keys, archives or raw dump errors to chat, Git or public logs.
- Configure `TRIPCOOKER_BACKUP_DATABASE_URL` using the dedicated project's session-pooler or direct connection. Do not use a transaction pooler. Remote connections require TLS with hostname/certificate validation and the system trust store. Provide a privately validated CA configuration if the provider requires it; do not disable validation to make a backup succeed.
- Configure `TRIPCOOKER_BACKUP_DIRECTORY` and `TRIPCOOKER_BACKUP_KEY_FILE` outside all Git checkouts. Directories must be private (0700); the 32-byte key and archives are created with mode 0600. Existing shared directories are rejected rather than having their permissions changed.
- Run `npm run backup:key` once. It refuses to overwrite an existing key. Keep a separate secure recovery copy of the key. Losing the key makes these backups unrecoverable.

## Capture and retention

1. Run `npm run backup:database` with the PostgreSQL binaries on `PATH`. The password is passed through the subprocess environment, never command arguments. The script makes one consistent custom-format dump of `public` and `auth`, including the four TripCooker tables and account data. It checks for managed auth schema changes during capture.
2. The archive and recovery metadata are encrypted together with AES-256-GCM. No unencrypted dump is written during capture. The bounded MVP implementation supports a maximum 128 MiB authenticated payload; larger databases require a reviewed streaming process. A failed or warning-producing dump is not recorded as a successful backup.
3. After approval of policy version `2026-10-11-v1`, configure `TRIPCOOKER_BACKUP_RETENTION_APPROVED` to that version. `npm run backup:prune` authenticates recognized archives first and removes only that project's snapshots older than 30 days. It refuses cleanup without approval, on corrupt recognized archives or invalid dates. Apply the same expiry to off-site copies.
4. Before release, select an owner-approved private off-site destination and verify an encrypted upload and retrieval. Keep the recovery key separate. No off-site upload has been made.
5. Configure and verify a daily backup job, cleanup and failure notification, and capture an extra snapshot before schema/deployment changes. A daily job has up to approximately one day of data-loss exposure; it is not point-in-time recovery. No schedule or additional hosting service has been created yet. Confirm its actual cost before deployment.

## Isolated restore test

1. Create a separate empty Supabase project with matching managed auth schema and required extensions. Leave its app, email and billing endpoints disconnected. Never restore a backup into the running source project. The archive covers the current MVP's public schema and auth data, not all provider settings, global roles, Vault keys, Storage files, Realtime publications or custom managed-schema objects.
2. Configure the destination privately in `TRIPCOOKER_RESTORE_DATABASE_URL`, the snapshot in `TRIPCOOKER_RESTORE_BACKUP_FILE`, and explicitly set `TRIPCOOKER_RESTORE_CONFIRM` to the destination project reference. The script recognizes source identity across direct/pooler aliases. Local test targets use `local:PORT:DATABASE`.
3. Run `npm run backup:restore`. The complete authentication tag must verify before any database connection or plaintext file is created. The target must have no public tables and no auth users; its auth columns must match. Existing managed auth definitions and migration rows are retained. A private temporary archive is removed after success or failure. A host crash can leave that temporary folder; secure and remove it before the host is reused.
4. Restore runs in one transaction without `--clean` or overwrite. It retains public access grants and RLS. This MVP has no custom database roles; a future custom role or extension requires review before this procedure is reused.
5. Compare account IDs, trip JSON/version, billing customer mappings, event receipts and request limits with the frozen acceptance fixture. Verify no browser role can read the private tables or execute private RPCs. Test verified account sign-in, save conflict handling and subscription refresh against the actual hosted target.
6. Keep a separate private deletion register when handling account deletion. Remove deleted accounts and their cascaded planner records from an old recovery snapshot before reconnecting it to customer service. Test that exclusion. Restore provider auth/SMTP settings separately, rotate environment credentials as appropriate, and do not send signup mail or Stripe events from the recovery test.
7. Record the snapshot time, completion time, counts, RLS checks and human recovery decision without private rows or credentials. Never treat a successful dump as a proven restore.

## Local verification

`npm test` verifies archive authentication, wrong-key/tamper rejection, project alias identity, TLS settings and restore target guards. `TRIPCOOKER_TEST_PG_BIN=/opt/homebrew/opt/postgresql@18/bin npm run test:backup` performs a full capture/restore against a disposable PostgreSQL fixture, verifies data and permissions, checks source/populated-target refusal, and exercises approved retention. Synthetic keys and fixture databases are cleaned up after the test. Hosted recovery remains pending the dedicated project.
