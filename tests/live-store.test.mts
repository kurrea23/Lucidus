import test from "node:test";
import assert from "node:assert/strict";
import { emptyDatabase } from "../src/lib/database";
process.env.NEXT_PUBLIC_APP_MODE = "live";
const entries = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  },
  configurable: true,
});
const {
  connectRemote,
  currentData,
  updateUser,
  retrySave,
  clearRemote,
  hasUnsavedChanges,
} = await import("../src/lib/store");
test("live store protects plan/identity and recovers the latest unsaved profile edits", async () => {
  const db = emptyDatabase("verified-user", "qa@example.com");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let version = 0;
  connectRemote(db, 0, async (data) => {
    await gate;
    return { version: ++version, user: data.user };
  });
  updateUser({
    plan: "premium",
    id: "forged",
    email: "wrong@example.com",
    displayName: "First",
  });
  updateUser({ displayName: "Latest" });
  assert.equal(currentData().user.plan, "free");
  assert.equal(currentData().user.id, "verified-user");
  assert.equal(currentData().user.email, "qa@example.com");
  assert.equal(
    JSON.parse(entries.get("tripcooker:pending:verified-user")!).user
      .displayName,
    "Latest",
  );
  release();
  await retrySave();
  assert.equal(currentData().user.displayName, "Latest");
  assert.equal(entries.has("tripcooker:pending:verified-user"), false);
  connectRemote(currentData(), version, async () => {
    throw new Error("Offline");
  });
  updateUser({ displayName: "Recovered name" });
  await retrySave();
  assert.equal(hasUnsavedChanges(), true);
  clearRemote();
  connectRemote(db, version, async () => ({
    version: version + 1,
    user: db.user,
  }));
  assert.equal(currentData().user.displayName, "Recovered name");
  assert.equal(currentData().user.plan, "free");
  assert.equal(hasUnsavedChanges(), true);
  clearRemote();
});
