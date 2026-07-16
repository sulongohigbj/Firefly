import type { APIContext } from "astro";

export interface D1PreparedStatementLike {
	bind(...values: unknown[]): D1PreparedStatementLike;
	first<T = unknown>(): Promise<T | null>;
	run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
	all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
}

export interface D1DatabaseLike {
	prepare(query: string, ...values: unknown[]): D1PreparedStatementLike;
}

type RuntimeEnv = {
	DB?: D1DatabaseLike;
};

export function getD1Database(context: APIContext): D1DatabaseLike | null {
	const runtime = (context.locals as { runtime?: { env?: RuntimeEnv } }).runtime;
	return runtime?.env?.DB ?? null;
}

export async function ensureUsersTable(db: D1DatabaseLike): Promise<void> {
	await db
		.prepare(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				password_salt TEXT NOT NULL,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`)
		.run();
}

export async function hashPassword(password: string, salt: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: encoder.encode(salt),
			iterations: 120000,
		},
		key,
		256,
	);
	return Array.from(new Uint8Array(derivedBits))
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("");
}

export function createSalt(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function parseRequestBody(request: Request): Promise<Record<string, string>> {
	const contentType = request.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		const data = await request.json();
		if (data && typeof data === "object" && !Array.isArray(data)) {
			return Object.fromEntries(
				Object.entries(data).map(([key, value]) => [key, String(value)]),
			);
		}
		return {};
	}

	const formData = await request.formData();
	return Object.fromEntries(
		Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
	);
}
