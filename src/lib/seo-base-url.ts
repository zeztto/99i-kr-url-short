function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function ensureAbsoluteUrl(value: string): string {
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export function getSeoBaseUrl(): string {
  const configuredBaseUrl = process.env.BASE_URL?.trim();

  if (configuredBaseUrl) {
    return stripTrailingSlash(ensureAbsoluteUrl(configuredBaseUrl));
  }

  const configuredDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim();

  if (configuredDomain) {
    return stripTrailingSlash(ensureAbsoluteUrl(configuredDomain));
  }

  return "https://99i.kr";
}
