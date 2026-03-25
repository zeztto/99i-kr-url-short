# qqwe.kr URL Shortener Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working URL shortener at qqwe.kr with redirect, analytics, and a stats page.

**Architecture:** Next.js 15 App Router monolith on Railway. Redirects are handled by a catch-all route handler (`src/app/[slug]/route.ts`) instead of middleware, because `@libsql/client` requires the Node.js runtime (not Edge). Analytics are recorded asynchronously via Next.js 15 `after()`. Turso (libSQL) for persistence via Drizzle ORM.

**Tech Stack:** Next.js 15, Drizzle ORM, Turso, Tailwind CSS, Recharts, nanoid, ua-parser-js, Vitest

**Spec:** `docs/superpowers/specs/2026-03-25-url-shortener-design.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout (Tailwind, metadata)
│   ├── page.tsx                     # Homepage (URL input form)
│   ├── not-found.tsx                # 404 page
│   ├── [slug]/
│   │   ├── route.ts                 # Catch-all redirect handler + async analytics
│   │   └── stats/
│   │       ├── page.tsx             # Stats page (server component)
│   │       └── charts.tsx           # Chart components (client component)
│   └── api/
│       ├── shorten/
│       │   └── route.ts             # POST /api/shorten
│       └── stats/
│           └── [slug]/
│               └── route.ts         # GET /api/stats/[slug]
├── lib/
│   ├── db/
│   │   ├── index.ts                 # Drizzle client + Turso connection
│   │   └── schema.ts                # Drizzle schema (links, clicks)
│   ├── slug.ts                      # Slug generation + reserved path check
│   ├── url.ts                       # URL validation
│   ├── analytics.ts                 # UA parsing + click data extraction
│   └── rate-limit.ts                # In-memory rate limiter
drizzle.config.ts                    # Drizzle Kit config
vitest.config.ts                     # Vitest config
tests/
├── lib/
│   ├── slug.test.ts
│   ├── url.test.ts
│   ├── analytics.test.ts
│   └── rate-limit.test.ts
```

**Key architecture decision:** Middleware runs in Edge Runtime, which cannot use `@libsql/client` (Node.js APIs). Instead, `src/app/[slug]/route.ts` handles redirects as a route handler with `export const runtime = "nodejs"`. The `after()` API records analytics after the redirect response is sent.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.local`, `.gitignore`, `drizzle.config.ts`, `vitest.config.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @libsql/client drizzle-orm nanoid ua-parser-js recharts
npm install -D drizzle-kit vitest @types/ua-parser-js
```

- [ ] **Step 3: Create `.env.local`**

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
BASE_URL=http://localhost:3000
```

- [ ] **Step 4: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 6: Add test scripts to `package.json`**

Add `"test": "vitest"` and `"test:run": "vitest run"` to scripts.

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server running on http://localhost:3000

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Initialize Next.js project with dependencies"
```

---

## Task 2: Database Schema & Client

**Files:**
- Create: `src/lib/db/schema.ts`, `src/lib/db/index.ts`

- [ ] **Step 1: Create Drizzle schema**

```ts
// src/lib/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").unique().notNull(),
  url: text("url").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const clicks = sqliteTable("clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkId: integer("link_id")
    .notNull()
    .references(() => links.id),
  clickedAt: text("clicked_at").default(sql`(datetime('now'))`),
  referer: text("referer"),
  country: text("country"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
});
```

- [ ] **Step 2: Create DB client**

```ts
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

- [ ] **Step 3: Generate and push migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Expected: Tables `links` and `clicks` created in Turso.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add database schema and Drizzle client"
```

---

## Task 3: URL Validation Library

**Files:**
- Create: `src/lib/url.ts`, `tests/lib/url.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/url.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/url.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/lib/url.ts
export function validateUrl(url: string): boolean {
  if (!url || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/url.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/url.ts tests/lib/url.test.ts
git commit -m "Add URL validation with tests"
```

---

## Task 4: Slug Generation Library

**Files:**
- Create: `src/lib/slug.ts`, `tests/lib/slug.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/slug.test.ts
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

  it("rejects 'favicon.ico'", () => {
    expect(isReservedPath("favicon.ico")).toBe(true);
  });

  it("accepts regular slug", () => {
    expect(isReservedPath("abc123")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/slug.test.ts
```

- [ ] **Step 3: Implement**

Note: Must use `customAlphabet` to restrict to alphanumeric only (default nanoid includes `-` and `_`).

```ts
// src/lib/slug.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/slug.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts tests/lib/slug.test.ts
git commit -m "Add slug generation and reserved path check"
```

---

## Task 5: Analytics Helper

**Files:**
- Create: `src/lib/analytics.ts`, `tests/lib/analytics.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/analytics.test.ts
import { describe, it, expect } from "vitest";
import { parseClickData } from "@/lib/analytics";

describe("parseClickData", () => {
  it("parses desktop Chrome on Windows", () => {
    const headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      referer: "https://twitter.com/post/123",
    });
    const result = parseClickData(headers);
    expect(result.device).toBe("desktop");
    expect(result.browser).toBe("Chrome");
    expect(result.os).toBe("Windows");
    expect(result.referer).toBe("https://twitter.com/post/123");
  });

  it("parses mobile Safari on iOS", () => {
    const headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const result = parseClickData(headers);
    expect(result.device).toBe("mobile");
    expect(result.browser).toBe("Mobile Safari");
    expect(result.os).toBe("iOS");
    expect(result.referer).toBeNull();
  });

  it("extracts country from geo headers", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0",
      "x-vercel-ip-country": "KR",
    });
    const result = parseClickData(headers);
    expect(result.country).toBe("KR");
  });

  it("returns null country when no geo header", () => {
    const headers = new Headers({ "user-agent": "Mozilla/5.0" });
    const result = parseClickData(headers);
    expect(result.country).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/analytics.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/lib/analytics.ts
import { UAParser } from "ua-parser-js";

export interface ClickData {
  referer: string | null;
  country: string | null;
  device: string;
  browser: string;
  os: string;
}

export function parseClickData(headers: Headers): ClickData {
  const ua = new UAParser(headers.get("user-agent") || "");
  const deviceType = ua.getDevice().type;

  let device = "desktop";
  if (deviceType === "mobile") device = "mobile";
  else if (deviceType === "tablet") device = "tablet";

  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country") ||
    null;

  return {
    referer: headers.get("referer") || null,
    country,
    device,
    browser: ua.getBrowser().name || "Unknown",
    os: ua.getOS().name || "Unknown",
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/analytics.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts tests/lib/analytics.test.ts
git commit -m "Add analytics click data parser"
```

---

## Task 6: Rate Limiter

**Files:**
- Create: `src/lib/rate-limit.ts`, `tests/lib/rate-limit.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/rate-limit.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3, 60_000);
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/rate-limit.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/lib/rate-limit.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60_000
  ) {}

  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetAt) {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/rate-limit.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limit.ts tests/lib/rate-limit.test.ts
git commit -m "Add in-memory rate limiter"
```

---

## Task 7: POST /api/shorten Endpoint

**Files:**
- Create: `src/app/api/shorten/route.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/api/shorten/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { generateSlug, isReservedPath } from "@/lib/slug";
import { validateUrl } from "@/lib/url";
import { rateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!rateLimiter.check(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.url || !validateUrl(body.url)) {
    return NextResponse.json(
      { error: "올바른 URL을 입력해주세요" },
      { status: 400 }
    );
  }

  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    const slug = generateSlug();
    if (isReservedPath(slug)) continue;

    try {
      await db.insert(links).values({ slug, url: body.url });
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      return NextResponse.json({ shortUrl: `${baseUrl}/${slug}`, slug });
    } catch (error: any) {
      if (error?.message?.includes("UNIQUE constraint")) continue;
      throw error;
    }
  }

  console.error("Slug generation failed after max retries");
  return NextResponse.json(
    { error: "잠시 후 다시 시도해주세요" },
    { status: 500 }
  );
}
```

- [ ] **Step 2: Manual test via curl**

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Expected: `{"shortUrl":"http://localhost:3000/xxxxxx","slug":"xxxxxx"}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/shorten/route.ts
git commit -m "Add POST /api/shorten endpoint"
```

---

## Task 8: Redirect Route Handler

**Files:**
- Create: `src/app/[slug]/route.ts`

This is a route handler (not middleware) because `@libsql/client` requires Node.js runtime.

- [ ] **Step 1: Implement**

```ts
// src/app/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseClickData } from "@/lib/analytics";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (result.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const link = result[0];

  after(async () => {
    try {
      const clickData = parseClickData(request.headers);
      await db.insert(clicks).values({
        linkId: link.id,
        referer: clickData.referer,
        country: clickData.country,
        device: clickData.device,
        browser: clickData.browser,
        os: clickData.os,
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
  });

  return NextResponse.redirect(link.url, 302);
}
```

- [ ] **Step 2: Manual test**

1. Create a short URL via `/api/shorten`
2. Visit `http://localhost:3000/<slug>` in browser
3. Confirm redirect to original URL
4. Check Turso `clicks` table for new row

- [ ] **Step 3: Commit**

```bash
git add src/app/[slug]/route.ts
git commit -m "Add catch-all redirect handler with async analytics"
```

---

## Task 9: GET /api/stats/[slug] Endpoint

**Files:**
- Create: `src/app/api/stats/[slug]/route.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/api/stats/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const linkResult = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (linkResult.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = linkResult[0];
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const days = period === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const allClicks = await db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, link.id), gte(clicks.clickedAt, since)));

  const totalClicks = allClicks.length;

  const clicksByDateMap = new Map<string, number>();
  const refererMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();

  for (const click of allClicks) {
    const date = click.clickedAt?.slice(0, 10) || "unknown";
    clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);

    const ref = click.referer || "(direct)";
    refererMap.set(ref, (refererMap.get(ref) || 0) + 1);

    const country = click.country || "Unknown";
    countryMap.set(country, (countryMap.get(country) || 0) + 1);

    const device = click.device || "Unknown";
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

    const browser = click.browser || "Unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

    const os = click.os || "Unknown";
    osMap.set(os, (osMap.get(os) || 0) + 1);
  }

  const mapToSorted = (map: Map<string, number>, key: string) =>
    Array.from(map.entries())
      .map(([k, v]) => ({ [key]: k, clicks: v }))
      .sort((a, b) => b.clicks - a.clicks);

  return NextResponse.json({
    slug: link.slug,
    url: link.url,
    totalClicks,
    createdAt: link.createdAt,
    clicksByDate: mapToSorted(clicksByDateMap, "date").sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    topReferers: mapToSorted(refererMap, "referer").slice(0, 10),
    countries: mapToSorted(countryMap, "country"),
    devices: mapToSorted(deviceMap, "device"),
    browsers: mapToSorted(browserMap, "browser"),
    os: mapToSorted(osMap, "os"),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stats/[slug]/route.ts
git commit -m "Add GET /api/stats/[slug] endpoint"
```

---

## Task 10: Homepage UI

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "qqwe.kr - URL 단축 서비스",
  description: "긴 URL을 짧게 줄이고 클릭 통계를 확인하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build homepage**

```tsx
// src/app/page.tsx
"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{
    shortUrl: string;
    slug: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "오류가 발생했습니다");
        return;
      }

      setResult(data);
      setUrl("");
    } catch {
      setError("서버에 연결할 수 없습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold text-center mb-2">qqwe.kr</h1>
        <p className="text-gray-500 text-center mb-8">URL을 짧게 줄이세요</p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very-long-url"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "..." : "단축하기"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

        {result && (
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium text-lg truncate"
              >
                {result.shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>
            <a
              href={`/${result.slug}/stats`}
              className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
            >
              통계 보기 →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000, confirm the form renders correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "Add homepage with URL shortening form"
```

---

## Task 11: Stats Page

**Files:**
- Create: `src/app/[slug]/stats/page.tsx`, `src/app/[slug]/stats/charts.tsx`

The stats page is a server component that queries the DB directly (no self-request to own API).

- [ ] **Step 1: Create chart components (client component)**

```tsx
// src/app/[slug]/stats/charts.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export function ClicksChart({
  data,
}: {
  data: { date: string; clicks: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="clicks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartCard({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) return <p className="text-gray-400 text-sm">데이터 없음</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create stats page (server component, queries DB directly)**

```tsx
// src/app/[slug]/stats/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { ClicksChart, PieChartCard } from "./charts";

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period = "7d" } = await searchParams;

  const linkResult = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (linkResult.length === 0) notFound();

  const link = linkResult[0];
  const days = period === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const allClicks = await db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, link.id), gte(clicks.clickedAt, since)));

  // Aggregate
  const clicksByDateMap = new Map<string, number>();
  const refererMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();

  for (const click of allClicks) {
    const date = click.clickedAt?.slice(0, 10) || "unknown";
    clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);
    const ref = click.referer || "(direct)";
    refererMap.set(ref, (refererMap.get(ref) || 0) + 1);
    const country = click.country || "Unknown";
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
    const device = click.device || "Unknown";
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    const browser = click.browser || "Unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    const os = click.os || "Unknown";
    osMap.set(os, (osMap.get(os) || 0) + 1);
  }

  const toSorted = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => b.value - a.value);

  const clicksByDate = Array.from(clicksByDateMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">qqwe.kr/{slug}</h1>
      <p className="text-gray-500 text-sm mb-6 truncate">{link.url}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="총 클릭수" value={allClicks.length} />
        <StatCard label="국가" value={countryMap.size} />
        <StatCard label="리퍼러" value={refererMap.size} />
      </div>

      <div className="flex gap-2 mb-6">
        <PeriodLink slug={slug} period="7d" active={period !== "30d"} />
        <PeriodLink slug={slug} period="30d" active={period === "30d"} />
      </div>

      <Section title="일별 클릭">
        <ClicksChart data={clicksByDate} />
      </Section>

      <Section title="리퍼러 Top 10">
        <StatsList items={toSorted(refererMap).slice(0, 10)} />
      </Section>

      <Section title="국가">
        <PieChartCard data={toSorted(countryMap)} />
      </Section>

      <Section title="디바이스">
        <PieChartCard data={toSorted(deviceMap)} />
      </Section>

      <Section title="브라우저">
        <PieChartCard data={toSorted(browserMap)} />
      </Section>

      <Section title="OS">
        <PieChartCard data={toSorted(osMap)} />
      </Section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

function PeriodLink({
  slug,
  period,
  active,
}: {
  slug: string;
  period: string;
  active: boolean;
}) {
  return (
    <a
      href={`/${slug}/stats?period=${period}`}
      className={`px-3 py-1 rounded text-sm ${
        active ? "bg-blue-600 text-white" : "bg-gray-100"
      }`}
    >
      {period === "7d" ? "7일" : "30일"}
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-lg border mb-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function StatsList({ items }: { items: { name: string; value: number }[] }) {
  if (items.length === 0)
    return <p className="text-gray-400 text-sm">데이터 없음</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex justify-between text-sm">
          <span className="truncate mr-4">{item.name}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[slug]/stats/
git commit -m "Add stats page with charts (server component + Recharts)"
```

---

## Task 12: 404 Page

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create 404 page**

```tsx
// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-600 mb-6">이 링크는 존재하지 않습니다</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "Add 404 page"
```

---

## Task 13: Integration Test & Build

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Manual end-to-end test**

1. `npm run dev`
2. Visit `/` → enter URL → click "단축하기" → confirm short URL
3. Click short URL → confirm redirect
4. Visit `/<slug>/stats` → confirm stats page with recorded click
5. Visit `/nonexistent` → confirm 404 page
6. Submit 11 URLs rapidly → confirm rate limit

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "Fix issues found during integration testing"
```

---

## Task 14: Deployment

- [ ] **Step 1: Verify package.json scripts**

Ensure `"build": "next build"` and `"start": "next start"` exist.

- [ ] **Step 2: Create GitHub repo and push**

```bash
gh repo create qqwe.kr-url-short --private --source=. --push
```

- [ ] **Step 3: Deploy on Railway**

Set environment variables in Railway dashboard:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BASE_URL=https://qqwe.kr`

Connect GitHub repo. Railway auto-builds and deploys.

- [ ] **Step 4: Verify production**

Visit `https://qqwe.kr` and run the same manual tests from Task 13 Step 2.
