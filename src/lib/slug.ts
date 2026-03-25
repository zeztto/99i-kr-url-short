import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  6
);

const RESERVED_PATHS = new Set([
  "api",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function generateSlug(): string {
  return nanoid();
}

export function isReservedPath(slug: string): boolean {
  return RESERVED_PATHS.has(slug);
}
