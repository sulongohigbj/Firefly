import type { APIContext } from "astro";

interface TurnstileVerificationResponse {
	success: boolean;
	"error-codes"?: string[];
}

function getTurnstileSecret(context: APIContext): string | null {
	const runtimeEnv = (context.locals as { runtime?: { env?: Record<string, string | undefined> } }).runtime?.env;
	return runtimeEnv?.TURNSTILE_SECRET_KEY ?? (import.meta.env.TURNSTILE_SECRET_KEY as string | undefined) ?? null;
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
