import type { APIContext } from "astro";
import {
	createSessionToken,
	ensureSessionsTable,
	getD1Database,
	hashPassword,
	parseRequestBody,
	verifyPassword,
} from "../../../utils/d1Auth";
import { verifyTurnstileToken } from "../../../utils/turnstile";

export const prerender = false;

interface UserRecord {
	id: number;
	username: string;
	password_hash: string;
	password_salt: string;
	is_admin: number;
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}

export async function POST(context: APIContext): Promise<Response> {
	const db = getD1Database(context);
	if (!db) {
		const runtimeKeys = Object.keys((context as { locals?: unknown; env?: unknown }).locals ?? {});
		const envKeys = Object.keys((context as { env?: Record<string, unknown> }).env ?? {});
		return jsonResponse(
			{
				success: false,
				message: "D1 数据库绑定未配置",
				debug: {
					localsKeys: runtimeKeys,
					envKeys,
				},
			},
			500,
		);
	}

	await ensureSessionsTable(db);

	const payload = await parseRequestBody(context.request);
	const username = (payload.username ?? "").trim();
	// Do NOT trim password
	const password = payload.password ?? "";
	const turnstileToken = (payload["cf-turnstile-response"] ?? "").trim();

	if (!username || !password) {
		return jsonResponse({ success: false, message: "用户名和密码不能为空" }, 400);
	}

	// Basic username format check before Turnstile
	function validateUsername(value: string): string | null {
		if (!/^[a-zA-Z0-9]+$/.test(value)) return "账号只能由字母和数字组成，不能包含符号";
		if (value.length < 5 || value.length > 16) return "账号长度必须为 5 到 16 个字符";
		return null;
	}

	const usernameError = validateUsername(username);
	if (usernameError) return jsonResponse({ success: false, message: usernameError }, 400);

	const verified = await verifyTurnstileToken(context, turnstileToken);
	if (!verified) {
		return jsonResponse({ success: false, message: "请先完成人机验证" }, 403);
	}

	const user = await db
		.prepare(
			"SELECT id, username, password_hash, password_salt, is_admin FROM users WHERE username = ?1",
		)
		.bind(username)
		.first<UserRecord>();

	if (!user) {
		return jsonResponse({ success: false, message: "用户名或密码错误" }, 401);
	}

	const isPasswordValid = await verifyPassword(password, user.password_salt, user.password_hash);
	if (!isPasswordValid) {
		return jsonResponse({ success: false, message: "用户名或密码错误" }, 401);
	}

	const token = createSessionToken();
	const tokenHash = await hashPassword(token, "session");
	const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
	await db
		.prepare(
			"INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?1, ?2, ?3)",
		)
		.bind(user.id, tokenHash, expiresAt)
		.run();

	const headers = new Headers();
	headers.set(
		"set-cookie",
		`session=${token}; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Lax`,
	);

	return new Response(
		JSON.stringify({
			success: true,
			message: "登录成功",
			user: { id: user.id, username: user.username, is_admin: user.is_admin ?? 0 },
		}),
		{
			status: 200,
			headers,
		},
	);
}
