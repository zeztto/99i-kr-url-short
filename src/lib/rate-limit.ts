interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private lastSweepAt = 0;

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60_000
  ) {}

  private cleanupExpired(now: number) {
    if (now - this.lastSweepAt < this.windowMs) {
      return;
    }

    for (const [ip, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(ip);
      }
    }

    this.lastSweepAt = now;
  }

  get size(): number {
    return this.store.size;
  }

  check(ip: string): boolean {
    const now = Date.now();
    this.cleanupExpired(now);
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }
}

export const rateLimiter = new RateLimiter();
