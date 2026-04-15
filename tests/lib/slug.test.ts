import { describe, it, expect } from "vitest";
import { generateSlug, isReservedPath } from "@/lib/slug";

describe("generateSlug", () => {
  it("returns a 6-character string", () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(6);
  });

  it("only contains alphanumeric characters", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("generates unique slugs", () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});

describe("isReservedPath", () => {
  it("rejects 'api'", () => {
    expect(isReservedPath("api")).toBe(true);
  });

  it("rejects '_next'", () => {
    expect(isReservedPath("_next")).toBe(true);
  });

  it("rejects 'admin'", () => {
    expect(isReservedPath("admin")).toBe(true);
  });

  it("rejects 'favicon.ico'", () => {
    expect(isReservedPath("favicon.ico")).toBe(true);
  });

  it("accepts regular slug", () => {
    expect(isReservedPath("abc123")).toBe(false);
  });
});
