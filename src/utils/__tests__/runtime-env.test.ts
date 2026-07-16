import assert from "node:assert/strict";
import test from "node:test";
import type { APIContext } from "astro";
import { getD1Database } from "../d1Auth.ts";
import { verifyTurnstileToken } from "../turnstile.ts";

test("getD1Database returns null when locals/runtime is missing", () => {
	const context = {} as APIContext;
	assert.equal(getD1Database(context), null);
});

test("getD1Database reads from context.env fallback", () => {
	const db = { prepare() { return { bind() { return this; }, first() { return Promise.resolve(null); }, run() { return Promise.resolve({ success: true }); }, all() { return Promise.resolve({ results: [], success: true }); } }; } };
	const context = { env: { DB: db } } as APIContext & { env?: { DB?: unknown } };
	assert.equal(getD1Database(context), db);
});

test("getD1Database detects D1 binding under alternate names", () => {
	const db = { prepare() { return { bind() { return this; }, first() { return Promise.resolve(null); }, run() { return Promise.resolve({ success: true }); }, all() { return Promise.resolve({ results: [], success: true }); } }; } };
	const context = { env: { D1: db } } as APIContext & { env?: { D1?: unknown } };
	assert.equal(getD1Database(context), db);
});

test("verifyTurnstileToken returns false without throwing when runtime env is missing", async () => {
	const context = {} as APIContext;
	await assert.doesNotReject(() => verifyTurnstileToken(context, "token"));
	assert.equal(await verifyTurnstileToken(context, "token"), false);
});
