import type { APIContext } from "astro";
import {
	ensureUsersTable,
	getD1Database,
	hashPassword,
	parseRequestBody,
} from "../../../utils/d1Auth";

export const prerender = false;

interface UserRecord {
	id: number;
	username: string;
	password_hash: string;
	password_salt: string;
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

	const user = await db
		.prepare(
			"SELECT id, username, password_hash, password_salt FROM users WHERE username = ?1",
		)
		.bind(username)
		.first<UserRecord>();

	if (!user) {
		return jsonResponse({ success: false, message: "用户不存在" }, 401);
	}

	const passwordHash = await hashPassword(password, user.password_salt);
	if (passwordHash !== user.password_hash) {
		return jsonResponse({ success: false, message: "密码错误" }, 401);
	}

	const headers = new Headers();
	headers.set(
		"set-cookie",
		`session=${encodeURIComponent(user.username)}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`,
	);

	return new Response(
		JSON.stringify({
			success: true,
			message: "登录成功",
			user: { id: user.id, username: user.username },
		}),
		{
			status: 200,
			headers,
		},
	);
}
