import type { APIContext } from "astro";
import {
	createSalt,
	getD1Database,
	hashPassword,
	parseRequestBody,
} from "../../../utils/d1Auth";
import { verifyTurnstileToken } from "../../../utils/turnstile";

export const prerender = false;

interface UserRecord {
	id: number;
	username: string;
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}

function validateUsername(value: string): string | null {
	if (!/^[a-zA-Z0-9]+$/.test(value)) {
		return "账号只能由字母和数字组成，不能包含符号";
	}
	if (value.length < 5 || value.length > 16) {
		return "账号长度必须为 5 到 16 个字符";
	}
	return null;
}

function validatePassword(value: string): string | null {
	if (value.length < 8 || value.length > 32) {
		return "密码长度必须为 8 到 32 个字符";
	}
	return null;
}

export async function POST(context: APIContext): Promise<Response> {
	const db = getD1Database(context);
	if (!db) {
		return jsonResponse({ success: false, message: "D1 数据库绑定未配置" }, 500);
	}

	const payload = await parseRequestBody(context.request);
	const username = (payload.username ?? "").trim();
	// Do NOT trim password: trailing spaces may be intentional
	const password = payload.password ?? "";
	const turnstileToken = (payload["cf-turnstile-response"] ?? "").trim();

	if (!username || !password) {
		return jsonResponse({ success: false, message: "用户名和密码不能为空" }, 400);
	}

	// Basic format validation before Turnstile to avoid wasted verifications
	const usernameError = validateUsername(username);
	if (usernameError) {
		return jsonResponse({ success: false, message: usernameError }, 400);
	}

	const passwordError = validatePassword(password);
	if (passwordError) {
		return jsonResponse({ success: false, message: passwordError }, 400);
	}

	const verified = await verifyTurnstileToken(context, turnstileToken);
	if (!verified) {
		return jsonResponse({ success: false, message: "请先完成人机验证" }, 403);
	}

	const existing = await db
		.prepare("SELECT id FROM users WHERE username = ?1")
		.bind(username)
		.first<UserRecord>();
	if (existing) {
		return jsonResponse({ success: false, message: "用户名已存在" }, 409);
	}

	const salt = createSalt();
	const passwordHash = await hashPassword(password, salt);
	const result = await db
		.prepare(
			"INSERT INTO users (username, password_hash, password_salt) VALUES (?1, ?2, ?3)",
		)
		.bind(username, passwordHash, salt)
		.run();

	if (!result || result.success === false) {
		return jsonResponse({ success: false, message: "注册失败，请重试" }, 500);
	}

	return jsonResponse({ success: true, message: "注册成功" });
}
