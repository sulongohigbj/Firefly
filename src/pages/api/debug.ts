import type { APIContext } from "astro";

export const prerender = false;

export async function GET(context: APIContext) {
	const locals = context.locals as any;

	return new Response(
		JSON.stringify({
			runtimeEnvKeys: Object.keys(locals.runtime?.env ?? {}),
			platformEnvKeys: Object.keys(locals.platform?.env ?? {}),
		}),
		{
			headers: {
				"content-type": "application/json"
			}
		}
	);
}