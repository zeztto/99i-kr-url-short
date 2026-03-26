interface VerifyTurnstileTokenOptions {
  token?: string | null;
  remoteIp?: string | null;
  expectedHostname?: string | null;
}

interface TurnstileSiteVerifyResponse {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
}

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes: string[];
}

function normalizeValue(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.split(",")[0]?.trim();
  return normalized || null;
}

function normalizeHostname(value?: string | null): string | null {
  const normalized = normalizeValue(value);
  if (!normalized) return null;
  return normalized.replace(/:\d+$/, "");
}

export function getTurnstileSiteKey(): string | null {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return siteKey || null;
}

export function getTurnstileSecretKey(): string | null {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  return secretKey || null;
}

export function isTurnstileEnabled(): boolean {
  return Boolean(getTurnstileSiteKey() && getTurnstileSecretKey());
}

export async function verifyTurnstileToken({
  token,
  remoteIp,
  expectedHostname,
}: VerifyTurnstileTokenOptions): Promise<TurnstileVerificationResult> {
  const secretKey = getTurnstileSecretKey();

  if (!secretKey) {
    return { success: true, errorCodes: [] };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const responseBody = new URLSearchParams({
    secret: secretKey,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });

  const normalizedRemoteIp = normalizeValue(remoteIp);
  if (normalizedRemoteIp) {
    responseBody.set("remoteip", normalizedRemoteIp);
  }

  let response: Response;

  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: responseBody,
        signal: AbortSignal.timeout(5_000),
        cache: "no-store",
      }
    );
  } catch {
    return { success: false, errorCodes: ["turnstile-unreachable"] };
  }

  if (!response.ok) {
    return { success: false, errorCodes: ["bad-server-response"] };
  }

  const result =
    (await response.json()) as TurnstileSiteVerifyResponse;
  const normalizedExpectedHostname = normalizeHostname(expectedHostname);
  const normalizedReturnedHostname = normalizeHostname(result.hostname);

  if (
    result.success &&
    normalizedExpectedHostname &&
    normalizedReturnedHostname &&
    normalizedExpectedHostname !== normalizedReturnedHostname
  ) {
    return { success: false, errorCodes: ["hostname-mismatch"] };
  }

  return {
    success: result.success,
    errorCodes: result["error-codes"] || [],
  };
}
