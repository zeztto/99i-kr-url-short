import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3, 60_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under limit", () => {
    expect(limiter.check("1.2.3.4")).toBe(true);
    expect(limiter.check("1.2.3.4")).toBe(true);
    expect(limiter.check("1.2.3.4")).toBe(true);
  });

  it("blocks requests over limit", () => {
    limiter.check("1.2.3.4");
    limiter.check("1.2.3.4");
    limiter.check("1.2.3.4");
    expect(limiter.check("1.2.3.4")).toBe(false);
  });

  it("tracks IPs independently", () => {
    limiter.check("1.2.3.4");
    limiter.check("1.2.3.4");
    limiter.check("1.2.3.4");
    expect(limiter.check("5.6.7.8")).toBe(true);
  });

  it("cleans up expired IP entries during periodic sweeps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T00:00:00Z"));

    limiter = new RateLimiter(3, 1_000);
    limiter.check("1.2.3.4");
    limiter.check("5.6.7.8");

    expect(limiter.size).toBe(2);

    vi.setSystemTime(new Date("2026-04-21T00:00:01.500Z"));
    limiter.check("9.9.9.9");

    expect(limiter.size).toBe(1);
  });
});
