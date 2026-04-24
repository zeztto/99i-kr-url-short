import { describe, expect, it } from "vitest";
import { parseAdminLinkId } from "@/lib/admin-links";

describe("parseAdminLinkId", () => {
  it("accepts positive integer string ids", () => {
    expect(parseAdminLinkId("123")).toBe(123);
    expect(parseAdminLinkId(" 42 ")).toBe(42);
  });

  it("rejects missing, non-integer, and unsafe ids", () => {
    expect(parseAdminLinkId(null)).toBeNull();
    expect(parseAdminLinkId("")).toBeNull();
    expect(parseAdminLinkId("0")).toBeNull();
    expect(parseAdminLinkId("-1")).toBeNull();
    expect(parseAdminLinkId("1.5")).toBeNull();
    expect(parseAdminLinkId("abc")).toBeNull();
    expect(parseAdminLinkId(String(Number.MAX_SAFE_INTEGER + 1))).toBeNull();
  });
});
