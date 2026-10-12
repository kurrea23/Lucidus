import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { emptyDatabase } from "../src/lib/database";
test("Postgres migration enforces private access, free limits, stale-write rejection and cascade deletion", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(
      "create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon, authenticated, service_role;",
    );
    // Optional Supabase setup helper starts with PostgreSQL's PUBLIC execute grant.
    await pg.exec("create function public.rls_auto_enable() returns event_trigger language plpgsql security definer as $$ begin return; end $$;");
    await pg.exec(readFileSync("supabase/launch.sql", "utf8"));
    assert.deepEqual(
      (await pg.query("select has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') as anon_execute, has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE') as browser_execute, has_function_privilege(current_user,'public.rls_auto_enable()','EXECUTE') as owner_execute")).rows[0],
      { anon_execute: false, browser_execute: false, owner_execute: true },
    );
    const a = "11111111-1111-4111-8111-111111111111",
      b = "22222222-2222-4222-8222-222222222222";
    await pg.query("insert into auth.users values ($1),($2)", [a, b]);
    const initial = emptyDatabase(a);
    await pg.query(
      "insert into tripcooker_state(user_id,data) values ($1,$2::jsonb),($3,$2::jsonb)",
      [a, JSON.stringify(initial), b],
    );
    const trip = (id: string, status = "planning") => ({ id, status });
    const save = (data: unknown, version: number, premium = false) =>
      pg.query<{ save_tripcooker_state: number }>(
        "select save_tripcooker_state($1,$2,$3::jsonb,$4)",
        [a, version, JSON.stringify(data), premium],
      );
    assert.equal(
      (await save({ ...initial, trips: [trip("one")] }, 0)).rows[0]
        .save_tripcooker_state,
      1,
    );
    await assert.rejects(
      save({ ...initial, trips: [trip("one"), trip("two")] }, 1),
      /premium_required/,
    );
    await assert.rejects(save(initial, 0), /state_conflict/);
    assert.equal(
      (await save({ ...initial, trips: [trip("one"), trip("two")] }, 1, true))
        .rows[0].save_tripcooker_state,
      2,
    );
    // Preserve existing trips after downgrade; block extra active trips.
    await save({ ...initial, trips: [trip("one"), trip("two")] }, 2, false);
    await assert.rejects(
      save(
        { ...initial, trips: [trip("one"), trip("two"), trip("three")] },
        3,
        false,
      ),
      /premium_required/,
    );
    await save(
      {
        ...initial,
        trips: [trip("one", "completed"), trip("two", "archived")],
      },
      3,
      false,
    );
    await save(
      {
        ...initial,
        trips: [
          trip("one", "completed"),
          trip("two", "archived"),
          trip("three"),
        ],
      },
      4,
      false,
    );
    assert.equal(
      (
        await pg.query<{ version: number }>(
          "select version from tripcooker_state where user_id=$1",
          [b],
        )
      ).rows[0].version,
      0,
    );
    await pg.query(
      "insert into tripcooker_billing(user_id,customer_id) values ($1,$2)",
      [a, "cus_qa"],
    );
    await pg.query(
      "insert into tripcooker_billing_events(event_id,user_id,event_type,plan_observed) values ('evt_qa',$1,'invoice.paid','premium')",
      [a],
    );
    await assert.rejects(
      pg.query(
        "insert into tripcooker_billing_events(event_id,user_id,event_type,plan_observed) values ('evt_qa',$1,'invoice.paid','premium')",
        [a],
      ),
      /duplicate key/,
    );
    assert.equal(
      (
        await pg.query<{ locked: boolean }>(
          "select lock_tripcooker_checkout($1) as locked",
          [a],
        )
      ).rows[0].locked,
      true,
    );
    assert.equal(
      (
        await pg.query<{ locked: boolean }>(
          "select lock_tripcooker_checkout($1) as locked",
          [a],
        )
      ).rows[0].locked,
      false,
    );
    for (let n = 0; n < 180; n++)
      assert.equal(
        (
          await pg.query<{ allowed: boolean }>(
            "select allow_tripcooker_request($1) as allowed",
            [a],
          )
        ).rows[0].allowed,
        true,
      );
    assert.equal(
      (
        await pg.query<{ allowed: boolean }>(
          "select allow_tripcooker_request($1) as allowed",
          [a],
        )
      ).rows[0].allowed,
      false,
    );
    assert.equal(
      (
        await pg.query<{ allowed: boolean }>(
          "select allow_tripcooker_request($1) as allowed",
          [b],
        )
      ).rows[0].allowed,
      true,
    );
    await pg.exec("set role authenticated");
    await assert.rejects(
      pg.query("select * from tripcooker_state"),
      /permission denied/,
    );
    await assert.rejects(
      pg.query("select * from tripcooker_billing_events"),
      /permission denied/,
    );
    await assert.rejects(
      pg.query("select save_tripcooker_state($1,0,$2::jsonb,true)", [
        b,
        JSON.stringify(initial),
      ]),
      /permission denied/,
    );
    await pg.exec("reset role");
    await pg.query("delete from auth.users where id=$1", [a]);
    assert.equal(
      (await pg.query("select * from tripcooker_state where user_id=$1", [a]))
        .rows.length,
      0,
    );
    assert.equal(
      (
        await pg.query(
          "select * from tripcooker_billing_events where user_id=$1",
          [a],
        )
      ).rows.length,
      0,
    );
  } finally {
    await pg.close();
  }
});
