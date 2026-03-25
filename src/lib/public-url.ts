interface RequestLike {
  headers: Headers;
  nextUrl?: URL;
  url?: string;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolvePublicBaseUrl(request: RequestLike): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return stripTrailingSlash(
      `${forwardedProto || "https"}://${forwardedHost}`
    );
  }

  if (request.nextUrl?.origin) {
    return stripTrailingSlash(request.nextUrl.origin);
  }

  if (request.url) {
    return stripTrailingSlash(new URL(request.url).origin);
  }

  return stripTrailingSlash(process.env.BASE_URL || "http://localhost:3000");
}
