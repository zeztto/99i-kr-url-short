interface RequestLike {
  headers: Headers;
  nextUrl?: URL;
  url?: string;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function ensureAbsoluteUrl(value: string): string {
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

function normalizeForwardedValue(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.split(",")[0]?.trim();
  return normalized || null;
}

function isLocalHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/:\d+$/, "");
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
}

function isTrustedRequestHost(
  requestHost: string | null,
  configuredHost: string | null
): boolean {
  if (!requestHost) return false;
  if (!configuredHost) return true;

  return (
    isLocalHost(requestHost) ||
    requestHost.trim().toLowerCase() === configuredHost.trim().toLowerCase()
  );
}

export function resolvePublicBaseUrl(request: RequestLike): string {
  const configuredBaseUrl = process.env.BASE_URL?.trim()
    ? stripTrailingSlash(ensureAbsoluteUrl(process.env.BASE_URL.trim()))
    : null;
  const configuredHost = configuredBaseUrl
    ? new URL(configuredBaseUrl).host
    : null;
  const forwardedHost = normalizeForwardedValue(
    request.headers.get("x-forwarded-host")
  );
  const forwardedProto =
    normalizeForwardedValue(request.headers.get("x-forwarded-proto")) || "https";

  if (forwardedHost && isTrustedRequestHost(forwardedHost, configuredHost)) {
    return stripTrailingSlash(
      `${forwardedProto}://${forwardedHost}`
    );
  }

  const requestOrigin =
    request.nextUrl?.origin || (request.url ? new URL(request.url).origin : null);

  if (
    requestOrigin &&
    isTrustedRequestHost(new URL(requestOrigin).host, configuredHost)
  ) {
    return stripTrailingSlash(requestOrigin);
  }

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return "http://localhost:3000";
}
