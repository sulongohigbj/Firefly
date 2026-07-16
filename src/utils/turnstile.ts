import type { APIContext } from "astro";

interface TurnstileVerificationResponse {
	success: boolean;
	"error-codes"?: string[];
}

function getTurnstileSecret(context: APIContext): string | null {
	try {
		const locals = (context as {
			locals?: { runtime?: { env?: Record<string, string | undefined> }; env?: Record<string, string | undefined> };
			env?: Record<string, string | undefined>;
		}).locals;
		const directEnv = (context as { env?: Record<string, string | undefined> }).env;
		const runtimeEnv = locals?.runtime?.env ?? locals?.env ?? directEnv;
		const runtimeSecret = runtimeEnv?.TURNSTILE_SECRET_KEY;
		if (typeof runtimeSecret === "string" && runtimeSecret.length > 0) {
			return runtimeSecret;
		}

		const importMetaSecret = import.meta.env?.TURNSTILE_SECRET_KEY;
		return typeof importMetaSecret === "string" && importMetaSecret.length > 0
			? importMetaSecret
			: null;
	} catch {
		return null;
	}
}

export async function verifyTurnstileToken(context: APIContext, token: string): Promise<boolean> {
	const secret = getTurnstileSecret(context);
	if (!token || !secret) {
		return false;
	}

	const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			secret,
			response: token,
		}).toString(),
	});

	const data = (await response.json()) as TurnstileVerificationResponse;
	return data.success === true;
}
