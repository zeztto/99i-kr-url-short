import { afterEach, describe, expect, it } from "vitest";
import {
  getAuthSecret,
  getAdminAuthSetupIssues,
  getAdminEmails,
  getGoogleClientId,
  getGoogleClientSecret,
  isAdminEmail,
} from "@/lib/admin-auth";

const originalAdminEmails = process.env.ADMIN_EMAILS;
const originalAuthGoogleId = process.env.AUTH_GOOGLE_ID;
const originalAuthGoogleSecret = process.env.AUTH_GOOGLE_SECRET;
const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;

afterEach(() => {
  process.env.ADMIN_EMAILS = originalAdminEmails;
  process.env.AUTH_GOOGLE_ID = originalAuthGoogleId;
  process.env.AUTH_GOOGLE_SECRET = originalAuthGoogleSecret;
  process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
  process.env.GOOGLE_CLIENT_SECRET = originalGoogleClientSecret;
  process.env.AUTH_SECRET = originalAuthSecret;
  process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
});

describe("getAdminEmails", () => {
  it("returns an empty list when env is empty", () => {
    delete process.env.ADMIN_EMAILS;

    expect(getAdminEmails()).toEqual([]);
  });

  it("normalizes and deduplicates configured admin emails", () => {
    process.env.ADMIN_EMAILS =
      " OWNER@example.com,admin@example.com,owner@example.com ";

    expect(getAdminEmails()).toEqual([
      "owner@example.com",
      "admin@example.com",
    ]);
  });
});

describe("isAdminEmail", () => {
  it("matches emails case-insensitively", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";

    expect(isAdminEmail("Owner@example.com")).toBe(true);
    expect(isAdminEmail("other@example.com")).toBe(false);
  });
});

describe("getAdminAuthSetupIssues", () => {
  it("returns missing env keys", () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ADMIN_EMAILS;

    expect(getAdminAuthSetupIssues()).toEqual([
      "AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID",
      "AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET",
      "AUTH_SECRET or NEXTAUTH_SECRET",
      "ADMIN_EMAILS",
    ]);
  });

  it("returns an empty array when auth env is configured", () => {
    process.env.AUTH_GOOGLE_ID = "google-id";
    process.env.AUTH_GOOGLE_SECRET = "google-secret";
    process.env.AUTH_SECRET = "secret";
    process.env.ADMIN_EMAILS = "admin@example.com";

    expect(getAdminAuthSetupIssues()).toEqual([]);
  });
});

describe("legacy auth env aliases", () => {
  it("accepts GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET", () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    process.env.GOOGLE_CLIENT_ID = "legacy-google-id";
    process.env.GOOGLE_CLIENT_SECRET = "legacy-google-secret";

    expect(getGoogleClientId()).toBe("legacy-google-id");
    expect(getGoogleClientSecret()).toBe("legacy-google-secret");
  });

  it("accepts NEXTAUTH_SECRET as auth secret", () => {
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "legacy-secret";

    expect(getAuthSecret()).toBe("legacy-secret");
  });
});
