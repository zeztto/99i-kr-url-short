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
  hostname?: string;
}

function isFalseLike(value?: string | null): boolean {
  if (!value) return false;
  return /^(0|false|off|no)$/i.test(value.trim());
}

function normalizeValue(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.split(",")[0]?.trim();
  return normalized || null;
}

function normalizeHostname(value?: string | null): string | null {
  const normalized = normalizeValue(value);
  if (!normalized) return null;

  try {
    const url = /^[a-z]+:\/\//i.test(normalized)
      ? new URL(normalized)
      : new URL(`https://${normalized}`);
    return url.hostname || null;
  } catch {
    return normalized.replace(/:\d+$/, "");
  }
}

export function getTurnstileSiteKey(): string | null {
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    process.env.TURNSTILE_SITE_KEY?.trim();
  return siteKey || null;
}

export function getTurnstileSecretKey(): string | null {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  return secretKey || null;
}

export function getTurnstileExpectedHostname(
  requestHostname?: string | null
): string | null {
  return (
    normalizeHostname(process.env.TURNSTILE_EXPECTED_HOSTNAME) ||
    normalizeHostname(requestHostname) ||
    normalizeHostname(process.env.BASE_URL)
  );
}

export function isTurnstileEnabled(): boolean {
  if (isFalseLike(process.env.TURNSTILE_ENABLED)) {
    return false;
  }

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
    return {
      success: false,
      errorCodes: ["hostname-mismatch"],
      ...(normalizedReturnedHostname
        ? { hostname: normalizedReturnedHostname }
        : {}),
    };
  }

  return {
    success: result.success,
    errorCodes: result["error-codes"] || [],
    ...(normalizedReturnedHostname
      ? { hostname: normalizedReturnedHostname }
      : {}),
  };
}
