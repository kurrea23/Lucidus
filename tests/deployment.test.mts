import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("production hosts refuse an unconfigured or payment-disabled release", () => {
  for (const target of [
    { VERCEL_ENV: "production" },
    { RAILWAY_ENVIRONMENT_NAME: "production" },
    { TRIPCOOKER_RELEASE_TARGET: "production" },
  ]) {
    const result = spawnSync(process.execPath, ["scripts/prebuild.mjs"], {
      env: { ...target, NODE_ENV: "test", PATH: process.env.PATH },
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /NEXT_PUBLIC_APP_MODE=live/);
    assert.match(result.stderr, /Payments are disabled/);
  }
});

test("staging and local builds can run the labeled demo without enabling payments", () => {
  const result = spawnSync(process.execPath, ["scripts/prebuild.mjs"], {
    env: {
      RAILWAY_ENVIRONMENT_NAME: "staging",
      NODE_ENV: "test",
      PATH: process.env.PATH,
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
});
