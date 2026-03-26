"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteConfig } from "@/lib/site-config";

export function HomeClient({ siteConfig }: { siteConfig: SiteConfig }) {
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
        <h1 className="text-4xl font-bold text-center mb-2">
          {siteConfig.name}
        </h1>
        <p className="text-gray-500 text-center mb-8">{siteConfig.tagline}</p>

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
          <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-medium text-lg truncate"
              >
                {result.shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 whitespace-nowrap"
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200"
              >
                단축 링크 열기
              </a>
              <Link
                href={`/${result.slug}/stats`}
                className="text-gray-300 hover:text-white"
              >
                통계 보기 →
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              통계는 단축 링크가 실제로 열려 리디렉션된 뒤부터 집계됩니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
