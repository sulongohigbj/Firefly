import type { APIContext } from "astro";
import {
	createSalt,
	ensureUsersTable,
	getD1Database,
	hashPassword,
	parseRequestBody,
} from "../../../utils/d1Auth";

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

export async function POST(context: APIContext): Promise<Response> {
	const db = getD1Database(context);
	if (!db) {
		return jsonResponse({ success: false, message: "D1 数据库绑定未配置" }, 500);
	}

	await ensureUsersTable(db);

	const payload = await parseRequestBody(context.request);
	const username = (payload.username ?? "").trim();
	const password = (payload.password ?? "").trim();

	if (!username || !password) {
		return jsonResponse({ success: false, message: "用户名和密码不能为空" }, 400);
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
	await db
		.prepare(
			"INSERT INTO users (username, password_hash, password_salt) VALUES (?1, ?2, ?3)",
		)
		.bind(username, passwordHash, salt)
		.run();

	return jsonResponse({ success: true, message: "注册成功" });
}
