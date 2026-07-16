import assert from "node:assert/strict";
import test from "node:test";
import type { APIContext } from "astro";
import { getD1Database } from "../d1Auth.ts";
import { verifyTurnstileToken } from "../turnstile.ts";

test("getD1Database returns null when locals/runtime is missing", () => {
	const context = {} as APIContext;
	assert.equal(getD1Database(context), null);
});

test("verifyTurnstileToken returns false without throwing when runtime env is missing", async () => {
	const context = {} as APIContext;
	await assert.doesNotReject(() => verifyTurnstileToken(context, "token"));
	assert.equal(await verifyTurnstileToken(context, "token"), false);
});
