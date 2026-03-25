import { describe, it, expect } from "vitest";
import { validateUrl } from "@/lib/url";

describe("validateUrl", () => {
  it("accepts valid http URL", () => {
    expect(validateUrl("http://example.com")).toBe(true);
  });

  it("accepts valid https URL", () => {
    expect(validateUrl("https://example.com/path?q=1")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(validateUrl("")).toBe(false);
  });

  it("rejects non-http protocol", () => {
    expect(validateUrl("ftp://example.com")).toBe(false);
  });

  it("rejects javascript protocol", () => {
    expect(validateUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects URL over 2048 chars", () => {
    const longUrl = "https://example.com/" + "a".repeat(2048);
    expect(validateUrl(longUrl)).toBe(false);
  });

  it("rejects plain text", () => {
    expect(validateUrl("not a url")).toBe(false);
  });
});
