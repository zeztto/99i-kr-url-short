export interface SiteConfig {
  domain: string;
  name: string;
  baseUrl: string;
  title: string;
  description: string;
  tagline: string;
}

interface ResolveSiteConfigOptions {
  host?: string | null;
  proto?: string | null;
  domain?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  tagline?: string | null;
  baseUrl?: string | null;
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

export function resolveSiteConfig(
  options: ResolveSiteConfigOptions = {}
): SiteConfig {
  const requestHost = normalizeForwardedValue(options.host);
  const requestProto = normalizeForwardedValue(options.proto) || "https";
  const envDomain = options.domain ?? process.env.NEXT_PUBLIC_SITE_DOMAIN ?? null;
  const fallbackBaseUrl =
    requestHost
      ? `${requestProto}://${requestHost}`
      : options.baseUrl ||
        process.env.BASE_URL ||
        (envDomain ? `https://${envDomain}` : "http://localhost:3000");
  const baseUrl = stripTrailingSlash(ensureAbsoluteUrl(fallbackBaseUrl));
  const resolvedBaseUrl = new URL(baseUrl);
  const siteDomain = requestHost || envDomain || resolvedBaseUrl.host;
  const siteName =
    requestHost || options.name || process.env.NEXT_PUBLIC_SITE_NAME || siteDomain;

  return {
    domain: siteDomain,
    name: siteName,
    baseUrl,
    title:
      requestHost
        ? `${siteName} - URL 단축 서비스`
        : options.title ||
          process.env.NEXT_PUBLIC_SITE_TITLE ||
          `${siteName} - URL 단축 서비스`,
    description:
      options.description ||
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
      "긴 URL을 짧게 줄이고 클릭 통계를 확인하세요",
    tagline:
      options.tagline ||
      process.env.NEXT_PUBLIC_SITE_TAGLINE ||
      "URL을 짧게 줄이세요",
  };
}

export async function getRequestSiteConfig(): Promise<SiteConfig> {
  const { headers } = await import("next/headers");
  const requestHeaders = await headers();

  return resolveSiteConfig({
    host:
      requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"),
    proto: requestHeaders.get("x-forwarded-proto"),
  });
}
