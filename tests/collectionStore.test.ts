import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Point the store at a throwaway dir before importing it (env reads DATA_DIR at load).
const tmpDir = path.join(os.tmpdir(), `aura-store-test-${Date.now()}`);
process.env.DATA_DIR = tmpDir;

const store = await import("../server/store/collectionStore.js");

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("collectionStore", () => {
  it("returns an empty array for a missing collection", async () => {
    expect(await store.readCollection("missing")).toEqual([]);
  });

  it("round-trips a written collection", async () => {
    const items = [{ id: "1", text: "hello" }, { id: "2", text: "world" }];
    await store.writeCollection("notes", items);
    expect(await store.readCollection("notes")).toEqual(items);
  });

  it("round-trips a single object and deletes it", async () => {
    await store.writeObject("token", { access: "abc" });
    expect(await store.readObject("token")).toEqual({ access: "abc" });
    await store.deleteObject("token");
    expect(await store.readObject("token")).toBeNull();
  });

  it("rejects unsafe collection names", async () => {
    await expect(store.readCollection("../escape")).rejects.toThrow();
  });
});
