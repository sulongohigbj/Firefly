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
	D1?: D1DatabaseLike;
	DATABASE?: D1DatabaseLike;
	db?: D1DatabaseLike;
	d1?: D1DatabaseLike;
	database?: D1DatabaseLike;
	ADMIN_USERNAME?: string;
	ADMIN_PASSWORD?: string;
};

function isD1DatabaseLike(value: unknown): value is D1DatabaseLike {
	return Boolean(
		value &&
			typeof value === "object" &&
			"prepare" in value &&
			typeof (value as { prepare?: unknown }).prepare === "function",
	);
}

function getRuntimeEnv(context: APIContext): RuntimeEnv | undefined {
	try {
		const locals = (context as {
			locals?: { runtime?: { env?: RuntimeEnv }; env?: RuntimeEnv };
			env?: RuntimeEnv;
		}).locals;
		const directEnv = (context as { env?: RuntimeEnv }).env;
		return locals?.runtime?.env ?? locals?.env ?? directEnv;
	} catch {
		return undefined;
	}
}

export function getD1Database(context: APIContext): D1DatabaseLike | null {
	const runtimeEnv = getRuntimeEnv(context);
	const directCandidates = [
		runtimeEnv?.DB,
		runtimeEnv?.D1,
		runtimeEnv?.DATABASE,
		runtimeEnv?.db,
		runtimeEnv?.d1,
		runtimeEnv?.database,
	];

	for (const candidate of directCandidates) {
		if (isD1DatabaseLike(candidate)) {
			return candidate;
		}
	}

	if (runtimeEnv) {
		for (const candidate of Object.values(runtimeEnv)) {
			if (isD1DatabaseLike(candidate)) {
				return candidate;
			}
		}
	}

	return null;
}

function getEnvValue(context: APIContext, key: keyof RuntimeEnv): string | null {
	const runtimeEnv = getRuntimeEnv(context);
	const value = runtimeEnv?.[key];
	return typeof value === "string" ? value : null;
}

export async function ensureAdminUser(db: D1DatabaseLike, context: APIContext): Promise<void> {
	const username = getEnvValue(context, "ADMIN_USERNAME");
	const password = getEnvValue(context, "ADMIN_PASSWORD");
	if (!username || !password) {
		return;
	}

	const existing = await db
		.prepare("SELECT id FROM users WHERE username = ?1")
		.bind(username)
		.first<{ id: number }>();
	if (existing) {
		return;
	}

	const salt = createSalt();
	const passwordHash = await hashPassword(password, salt);
	const result = await db
		.prepare(
			"INSERT INTO users (username, password_hash, password_salt, is_admin) VALUES (?1, ?2, ?3, 1)",
		)
		.bind(username, passwordHash, salt)
		.run();

	if (!result.success) {
		throw new Error("Admin creation failed");
	}
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

export async function verifyPassword(
	password: string,
	salt: string,
	hash: string,
): Promise<boolean> {
	const candidateHash = await hashPassword(password, salt);
	const candidateBytes = new TextEncoder().encode(candidateHash);
	const storedBytes = new TextEncoder().encode(hash);

	if (candidateBytes.length !== storedBytes.length) {
		return false;
	}

	const candidateArray = new Uint8Array(candidateBytes);
	const storedArray = new Uint8Array(storedBytes);

	let diff = 0;
	for (let index = 0; index < candidateArray.length; index += 1) {
		diff |= candidateArray[index] ^ storedArray[index];
	}

	return diff === 0;
}

export function createSalt(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function ensureSessionsTable(db: D1DatabaseLike): Promise<void> {
	await db
		.prepare(`
			CREATE TABLE IF NOT EXISTS sessions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				token_hash TEXT NOT NULL UNIQUE,
				expires_at TEXT NOT NULL,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`)
		.run();
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
