import test from "node:test";
import assert from "node:assert/strict";
import { OmniaClient } from "../dist/client.js";

test("OmniaClient initializes without crashing", () => {
  const client = new OmniaClient({ apiKey: "test_key_12345678901234567890" });
  assert.equal(client.hasKey(), true);
});

test("OmniaClient detects missing key correctly", () => {
  const client = new OmniaClient({ apiKey: "" });
  assert.equal(client.hasKey(), false);
});
