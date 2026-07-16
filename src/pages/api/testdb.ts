import type { APIContext } from "astro";

export const prerender = false;

export async function GET(context: APIContext) {
	const env =
		(context.locals as any).runtime?.env ??
		(context.locals as any).platform?.env;

	return new Response(
		JSON.stringify({
			ok: !!env?.DB,
			keys: env ? Object.keys(env) : [],
		}),
		{
			headers: {
				"content-type": "application/json",
			},
		},
	);
}