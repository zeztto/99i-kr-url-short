import type { Session } from "next-auth";

const DEFAULT_ADMIN_EMAILS = ["zeztto@gmail.com"];

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

export function getAdminEmails(): string[] {
  const configured = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((value) => normalizeEmail(value))
    .filter((value): value is string => Boolean(value));

  if (!configured?.length) {
    return DEFAULT_ADMIN_EMAILS;
  }

  return Array.from(new Set(configured));
}

export function getGoogleClientId(): string | null {
  return (
    process.env.AUTH_GOOGLE_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    null
  );
}

export function getGoogleClientSecret(): string | null {
  return (
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    null
  );
}

export function getAuthSecret(): string | null {
  return process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || null;
}

export function isAdminEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  return getAdminEmails().includes(normalized);
}

export function isAdminSession(session: Session | null): boolean {
  return isAdminEmail(session?.user?.email);
}

export function getAdminAuthSetupIssues(): string[] {
  const issues: string[] = [];

  if (!getGoogleClientId()) issues.push("AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID");
  if (!getGoogleClientSecret()) {
    issues.push("AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET");
  }
  if (!getAuthSecret()) issues.push("AUTH_SECRET");

  return issues;
}

export function getGoogleCallbackUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/auth/callback/google`;
}
