"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { SiteConfig } from "@/lib/site-config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface HomeClientProps {
  siteConfig: SiteConfig;
  turnstileSiteKey?: string | null;
}

export function HomeClient({
  siteConfig,
  turnstileSiteKey,
}: HomeClientProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{
    shortUrl: string;
    slug: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileEnabled = Boolean(turnstileSiteKey);

  useEffect(() => {
    if (!turnstileEnabled || typeof window === "undefined") return;
    if (window.turnstile) {
      setTurnstileReady(true);
    }
  }, [turnstileEnabled]);

  useEffect(() => {
    if (
      !turnstileEnabled ||
      !turnstileReady ||
      !turnstileSiteKey ||
      !turnstileContainerRef.current ||
      turnstileWidgetIdRef.current ||
      !window.turnstile
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: turnstileSiteKey,
        theme: "dark",
        size: "flexible",
        callback: (token: string) => {
          setTurnstileToken(token);
          setError("");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setError("보안 확인을 불러오지 못했습니다. 잠시 후 다시 시도해주세요");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setError("보안 확인이 만료되었습니다. 다시 확인해주세요");
        },
      }
    );

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [turnstileEnabled, turnstileReady, turnstileSiteKey]);

  function resetTurnstile() {
    setTurnstileToken("");

    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (turnstileEnabled && !turnstileToken) {
      setError("보안 확인을 완료해주세요");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, turnstileToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "오류가 발생했습니다");
        if (turnstileEnabled) {
          resetTurnstile();
        }
        return;
      }

      setResult(data);
      setUrl("");
      if (turnstileEnabled) {
        resetTurnstile();
      }
    } catch {
      setError("서버에 연결할 수 없습니다");
      if (turnstileEnabled) {
        resetTurnstile();
      }
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
      {turnstileEnabled && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setTurnstileReady(true)}
          onError={() => {
            setTurnstileReady(false);
            setError("보안 확인 스크립트를 불러오지 못했습니다");
          }}
        />
      )}

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
            disabled={loading || !url || (turnstileEnabled && !turnstileToken)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "..." : "단축하기"}
          </button>
        </form>

        {turnstileEnabled && (
          <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/80 p-3">
            <div ref={turnstileContainerRef} className="min-h-16" />
            <p className="mt-3 text-xs text-gray-500">
              자동화된 생성 요청을 막기 위해 보안 확인을 완료해야 링크를 만들 수 있습니다.
            </p>
          </div>
        )}

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
