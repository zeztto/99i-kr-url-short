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
          "error-callback"?: (errorCode?: string | number) => boolean | void;
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

type BillingCycle = "annual" | "monthly";

const featureCards = [
  {
    number: "01",
    tag: "URL 생성",
    title: "긴 주소를 짧게 줄이기",
    copy: "긴 URL을 붙여넣으면 공유하기 쉬운 짧은 주소를 만들 수 있습니다.",
    variant: "",
  },
  {
    number: "02",
    tag: "기본 통계",
    title: "얼마나 눌렸는지 보기",
    copy: "링크별 클릭 수와 최근 흐름을 확인해 사람들이 실제로 반응하는지 볼 수 있습니다.",
    variant: "",
  },
  {
    number: "03",
    tag: "채널 비교",
    title: "어디서 효과가 좋은지 비교",
    copy: "광고, 파트너, 뉴스레터, SNS, QR마다 링크를 나눠 어떤 곳에서 클릭이 많은지 비교합니다.",
    variant: "",
  },
  {
    number: "04",
    tag: "고유주소",
    title: "원하는 주소 이름 쓰기",
    copy: "랜덤 주소 대신 이벤트나 브랜드 이름이 들어간 더 기억하기 쉬운 주소를 사용할 수 있습니다.",
    variant: "",
  },
  {
    number: "05",
    tag: "목적지 수정",
    title: "나중에 연결 페이지 바꾸기",
    copy: "이미 공유한 짧은 링크는 그대로 두고, 연결되는 페이지를 나중에 바꿀 수 있습니다.",
    variant: "",
  },
  {
    number: "06",
    tag: "상세 분석",
    title: "클릭한 환경 자세히 보기",
    copy: "어디에서 들어왔는지, 어떤 기기에서 눌렀는지 확인해 다음 홍보 방향을 정합니다.",
    variant: "",
  },
  {
    number: "07",
    tag: "보고서",
    title: "결과를 보고서로 받기",
    copy: "링크 성과를 팀에 공유하거나 파트너에게 전달할 수 있는 보고서로 정리합니다.",
    variant: "",
  },
  {
    number: "08",
    tag: "QR 코드",
    title: "QR 코드로 만들기",
    copy: "짧은 링크를 포스터, 명함, 안내문에 넣기 쉬운 QR 코드로 만들 수 있습니다.",
    variant: "",
  },
  {
    number: "09",
    tag: "전용 운영",
    title: "큰 팀에 맞게 확장하기",
    copy: "전용 도메인, 많은 링크, 맞춤 보고서, 우선 지원이 필요한 조직도 사용할 수 있습니다.",
    variant: "",
  },
];

const useCases = [
  {
    label: "Referral",
    title: "추천인 링크 성과 비교",
    copy: "파트너, 크리에이터, 커뮤니티별로 다른 짧은 링크를 만들고 클릭 흐름을 비교해 실제 반응이 좋은 추천 경로를 찾습니다.",
    steps: ["URL 생성", "채널 비교", "기본 통계", "보고서"],
    outcome: "파트너별 기여도를 보고 예산과 리워드를 조정합니다.",
  },
  {
    label: "Campaign",
    title: "광고 소재와 랜딩 페이지 테스트",
    copy: "광고 소재, 메시지, 랜딩 페이지마다 다른 링크를 배포해 어떤 조합이 클릭과 전환 후보를 더 많이 만드는지 확인합니다.",
    steps: ["고유주소", "상세 분석", "목적지 수정", "보고서"],
    outcome: "반응이 낮은 소재는 빠르게 교체하고 좋은 소재에 예산을 집중합니다.",
  },
  {
    label: "Channel",
    title: "뉴스레터·SNS·블로그 유입 분리",
    copy: "같은 페이지로 보내더라도 뉴스레터, SNS, 블로그, 카카오톡 링크를 나누면 채널별 유입 품질을 따로 볼 수 있습니다.",
    steps: ["URL 생성", "채널 비교", "상세 분석", "QR 코드"],
    outcome: "반복 발행 채널의 클릭 패턴을 비교해 다음 콘텐츠 배포 순서를 정합니다.",
  },
  {
    label: "Offline",
    title: "QR·인쇄물 캠페인 유지보수",
    copy: "포스터, 명함, 안내문에 짧은 링크를 넣고 캠페인 페이지가 바뀌면 링크 자체가 아니라 도착지만 수정합니다.",
    steps: ["QR 코드", "고유주소", "목적지 수정", "기본 통계"],
    outcome: "인쇄물을 다시 만들지 않고도 오프라인 캠페인의 목적지를 최신 상태로 유지합니다.",
  },
];

const testimonials = [
  {
    quote:
      "추천인마다 링크를 따로 만들고 클릭 흐름을 비교하니 어떤 파트너가 실제 관심을 만드는지 훨씬 빨리 판단할 수 있었습니다.",
    author: "제휴 마케팅 매니저",
    team: "커머스 브랜드",
  },
  {
    quote:
      "뉴스레터, 블로그, SNS 링크를 분리해서 보니 같은 캠페인도 채널별 반응이 다르다는 점이 바로 보였습니다.",
    author: "콘텐츠 운영 리드",
    team: "B2B SaaS",
  },
  {
    quote:
      "오프라인 포스터의 QR 목적지를 나중에 바꿀 수 있어 캠페인 페이지가 바뀌어도 인쇄물을 다시 만들 필요가 줄었습니다.",
    author: "이벤트 운영 담당자",
    team: "교육/세미나",
  },
];

const companySegments = [
  "D2C 브랜드",
  "B2B SaaS",
  "뉴스레터",
  "교육/세미나",
  "오프라인 매장",
  "제휴 마케팅팀",
];

const pricingPlans = [
  {
    name: "Basic",
    price: {
      annual: "무료",
      monthly: "무료",
    },
    note: "비상업적 용도",
    description: "개인적인 용도의 공유 목적",
    items: [
      "무작위 단축 주소 발급",
      "단축 주소 최대 10개 관리",
      "주소당 10,000회 접속 제공",
      "총 클릭 수/접속 국가 정보",
    ],
    cta: "무료로 시작",
  },
  {
    name: "Pro",
    price: {
      annual: "4,500원/월",
      monthly: "5,500원/월",
    },
    note: "캠페인 운영",
    description: "프리랜서 마케터를 위한 합리적인 플랜",
    items: [
      "단축 주소 최대 30개 관리",
      "추천인/채널 링크 구분 운영",
      "캠페인별 주소 묶음 기능",
      "캠페인당 100,000회 접속 제공",
      "기본 통계 및 기간 데이터 제공",
      "캠페인 QR 코드 생성/관리",
    ],
    cta: "Pro로 확장",
    featured: true,
  },
  {
    name: "Max",
    price: {
      annual: "13,200원/월",
      monthly: "16,500원/월",
    },
    note: "브랜드 운영",
    description: "성장하는 팀의 브랜드 링크 운영 플랜",
    items: [
      "단축 주소 최대 100개 관리",
      "원하는 고유주소 사용",
      "리다이렉트 목적지 수정",
      "주소당 1,000,000회 접속 제공",
      "리퍼러/국가/디바이스 상세 통계",
      "통계 보고서 다운로드",
      "QR 코드 목적지 수정/관리",
      "장기 캠페인 아카이브",
    ],
    cta: "Max로 운영하기",
  },
  {
    name: "Enterprise",
    price: {
      annual: "문의",
      monthly: "문의",
    },
    note: "맞춤 계약",
    description: "보안과 권한 관리가 필요한 기업용 플랜",
    items: [
      "맞춤 단축 주소 수와 접속 한도",
      "전용 도메인과 브랜드 링크 정책",
      "SSO/SAML 로그인",
      "SCIM 사용자 프로비저닝",
      "팀 권한과 승인 워크플로",
      "감사 로그와 보안 검토",
      "대량 QR 캠페인 운영",
      "맞춤 통계 리포트와 SLA",
    ],
    cta: "Enterprise 문의",
  },
];

const faqs = [
  {
    question: "99i.kr은 무료로 사용할 수 있나요?",
    answer:
      "네. 단축 주소 생성은 누구나 사용할 수 있고, 가입하면 Basic 플랜으로 최대 10개 링크의 기본 통계를 확인할 수 있습니다.",
  },
  {
    question: "Basic 플랜의 접속 한도는 어떻게 되나요?",
    answer:
      "Basic 플랜은 링크 1개당 10,000회 접속까지 제공합니다. 한도를 넘기면 새 링크를 만들거나 유료 플랜으로 전환해야 합니다.",
  },
  {
    question: "Pro 플랜은 어떤 사용자에게 적합한가요?",
    answer:
      "Pro 플랜은 프리랜서 마케터가 추천인/채널 링크를 구분하고 캠페인별 주소를 묶어 운영할 수 있는 합리적인 플랜입니다.",
  },
  {
    question: "Max 플랜에서는 무엇이 달라지나요?",
    answer:
      "Max 플랜은 성장하는 팀을 위해 최대 100개 주소 관리, 고유주소, 목적지 수정, 주소당 1,000,000회 접속, 상세 통계, 보고서 다운로드를 제공합니다.",
  },
  {
    question: "Enterprise 플랜은 어떤 경우에 필요하나요?",
    answer:
      "SSO/SAML 로그인, SCIM 사용자 프로비저닝, 팀 권한, 승인 워크플로, 감사 로그, SLA가 필요한 조직은 Enterprise 플랜을 별도 계약으로 사용할 수 있습니다.",
  },
  {
    question: "단축 주소는 마케팅에 어떻게 활용하나요?",
    answer:
      "추천인 링크, 광고 소재별 링크, 뉴스레터 링크, QR 코드 링크를 나눠 배포하면 채널별 클릭과 전환 후보 흐름을 비교할 수 있습니다.",
  },
];

const footerGroups = [
  {
    title: "서비스",
    links: [
      { label: "기능", href: "#features" },
      { label: "사용 사례", href: "#use-cases" },
      { label: "가격", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "플랜",
    links: [
      { label: "Basic", href: "#pricing" },
      { label: "Pro", href: "#pricing" },
      { label: "Max", href: "#pricing" },
      { label: "Enterprise", href: "#pricing" },
    ],
  },
  {
    title: "마케팅 활용",
    links: [
      { label: "추천인 링크", href: "#use-cases" },
      { label: "전환율 측정", href: "#use-cases" },
      { label: "통계 보고서", href: "#pricing" },
    ],
  },
];

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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileEnabled = Boolean(turnstileSiteKey);
  const isLocalPreview =
    siteConfig.domain.startsWith("localhost") ||
    siteConfig.domain.startsWith("127.0.0.1");
  const displayName = isLocalPreview ? "99i.kr" : siteConfig.name;

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
        theme: "light",
        size: "normal",
        callback: (token: string) => {
          setTurnstileToken(token);
          setError("");
        },
        "error-callback": (errorCode?: string | number) => {
          console.warn("Turnstile widget error", { errorCode });
          setTurnstileToken("");
          setError("보안 확인을 불러오지 못했습니다. 잠시 후 다시 시도해주세요");
          return true;
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
    <main className="marketing-page">
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

      <section className="hero-section" id="top">
        <div className="section-shell hero-grid">
          <nav className="top-nav" aria-label="Primary">
            <a className="brand-mark" href="#top" aria-label={displayName}>
              <span className="brand-symbol">99i</span>
            </a>
            <div className="nav-links">
              <a className="nav-link" href="#features">
                기능
              </a>
              <a className="nav-link" href="#use-cases">
                사례
              </a>
              <a className="nav-link" href="#pricing">
                가격
              </a>
              <a className="nav-link" href="#faq">
                FAQ
              </a>
            </div>
          </nav>

          <div className="hero-content" id="shorten">
            <div className="hero-shortener" aria-label="URL shortening tool">
              <h1 className="hero-title">{displayName}</h1>
              <p className="hero-subtitle">
                {siteConfig.tagline}. 추천인 링크, 채널별 캠페인, 전환율
                측정까지 짧은 주소로 마케팅 성과를 더 선명하게 보세요.
              </p>
              <form onSubmit={handleSubmit} className="tool-form">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/very-long-url"
                  className="url-input"
                  aria-label="단축할 URL"
                />
                <button
                  type="submit"
                  disabled={
                    loading || !url || (turnstileEnabled && !turnstileToken)
                  }
                  className="button-primary"
                >
                  {loading ? "생성 중" : "줄이기"}
                </button>
              </form>

              {turnstileEnabled && (
                <div className="turnstile-box">
                  <div ref={turnstileContainerRef} className="turnstile-slot" />
                  <p className="turnstile-note">
                    자동화된 생성 요청을 막기 위해 보안 확인을 완료해야 링크를
                    만들 수 있습니다.
                  </p>
                </div>
              )}

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              {result && (
                <div className="result-panel" aria-live="polite">
                  <div className="result-row">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="result-link"
                    >
                      {result.shortUrl}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="copy-button"
                    >
                      {copied ? "복사됨" : "복사"}
                    </button>
                  </div>
                  <div className="result-actions">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                    >
                      단축 링크 열기
                    </a>
                    <Link href={`/${result.slug}/stats`} className="text-link">
                      통계 보기
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section" id="features">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-kicker">FEATURES</p>
            <h2 className="section-title">링크 운영에 필요한 기능</h2>
            <p className="section-description">
              긴 주소를 줄이고, QR 코드로 만들고, 클릭 수를 확인하고, 필요하면
              연결 페이지까지 바꿀 수 있습니다.
            </p>
          </div>
          <div className="bento-grid">
            {featureCards.map((feature) => (
              <article
                className={`feature-card ${feature.variant}`.trim()}
                key={feature.number}
              >
                <div className="feature-card-top">
                  <span className="feature-number">{feature.number}</span>
                  <span className="feature-tag">{feature.tag}</span>
                </div>
                <div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-copy">{feature.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section usecase-section" id="use-cases">
        <div className="section-shell">
          <div className="usecase-layout">
            <div className="usecase-intro">
              <p className="section-kicker">USE CASES</p>
              <h2 className="section-title">기능이 실제 캠페인이 되는 방식</h2>
              <p className="section-description">
                FEATURES에서 소개한 기능은 각각 따로 쓰이는 것이 아니라 캠페인
                흐름 안에서 이어집니다. 링크를 만들고, 나눠 배포하고, 반응을
                확인한 뒤 다음 행동을 정합니다.
              </p>
              <ul className="usecase-context" aria-label="주요 활용 방식">
                <li>추천인별 링크를 나눠 성과를 비교합니다.</li>
                <li>광고 소재와 랜딩 페이지 반응을 따로 봅니다.</li>
                <li>QR 코드와 인쇄물 캠페인도 같은 기준으로 관리합니다.</li>
              </ul>
            </div>

            <div className="usecase-playbook">
              {useCases.map((useCase, index) => (
                <article className="usecase-row" key={useCase.title}>
                  <div className="usecase-index">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{useCase.label}</b>
                  </div>
                  <div className="usecase-body">
                    <h3>{useCase.title}</h3>
                    <p>{useCase.copy}</p>
                    <div className="usecase-steps">
                      {useCase.steps.map((step) => (
                        <span key={`${useCase.title}-${step}`}>{step}</span>
                      ))}
                    </div>
                  </div>
                  <p className="usecase-outcome">{useCase.outcome}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-kicker">PRICING</p>
            <h2 className="section-title">사용량에 맞춘 네 가지 플랜</h2>
            <p className="section-description">
              시작은 Basic으로 충분하게, 반복 운영은 Pro로, 브랜드 링크와
              상세 분석은 Max로, 조직 단위 운영은 Enterprise로 확장합니다.
            </p>
          </div>

          <div className="pricing-controls" aria-label="구독 방식 선택">
            <div className="billing-toggle">
              {(["annual", "monthly"] as const).map((cycle) => (
                <button
                  type="button"
                  key={cycle}
                  className={`billing-option ${
                    billingCycle === cycle ? "active" : ""
                  }`}
                  aria-pressed={billingCycle === cycle}
                  onClick={() => setBillingCycle(cycle)}
                >
                  {cycle === "annual" ? "연 구독" : "월 구독"}
                </button>
              ))}
            </div>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => {
              const priceLabel = plan.price[billingCycle];
              const [priceAmount, priceUnit] = priceLabel.includes("/")
                ? priceLabel.split("/")
                : [priceLabel, ""];

              return (
                <article
                  className={`pricing-card ${plan.featured ? "featured" : ""}`}
                  key={plan.name}
                >
                  <div className="plan-top">
                    <div className="plan-header">
                      <h3>{plan.name}</h3>
                      <span>{plan.note}</span>
                    </div>
                    <div className="plan-price" aria-label={priceLabel}>
                      <span>{priceAmount}</span>
                      {priceUnit && <small>/{priceUnit}</small>}
                    </div>
                    <p className="plan-description">{plan.description}</p>
                  </div>
                  <ul className="plan-list">
                    {plan.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a className="plan-cta" href="#shorten">
                    {plan.cta}
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="social-proof-section">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-kicker">SOCIAL PROOF</p>
            <h2 className="section-title">마케팅 팀이 링크를 보는 방식</h2>
            <p className="section-description">
              단축 주소는 공유용 도구를 넘어 캠페인 판단의 기준이 됩니다.
              추천인, 채널, QR 링크를 나누어 운영하는 팀에게 특히 유용합니다.
            </p>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.author}>
                <p>“{testimonial.quote}”</p>
                <div>
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.team}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="company-segments" aria-label="사용 기업 유형">
            <span>사용 기업 유형</span>
            <div>
              {companySegments.map((segment) => (
                <b key={segment}>{segment}</b>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section" id="faq">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-kicker">FAQ</p>
            <h2 className="section-title">플랜과 통계 정책</h2>
            <p className="section-description">
              검색과 AI 답변에서 바로 이해할 수 있도록 가격, 한도, 통계
              제공 기준을 질문형으로 정리했습니다.
            </p>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <article className="faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="section-shell">
          <div className="cta-panel">
            <div>
              <h2>짧은 링크가 필요한 순간 바로 시작하세요</h2>
              <p>
                무료로 링크를 만들고, 통계와 브랜드 운영이 필요해지면
                플랜을 업그레이드하세요.
              </p>
            </div>
            <a className="button-primary" href="#shorten">
              무료로 링크 만들기
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-grid">
          <div className="footer-brand">
            <a className="brand-mark" href="#top" aria-label={displayName}>
              <span className="brand-symbol">99i</span>
            </a>
            <p>
              긴 URL을 짧은 링크로 바꾸고, 추천인 링크와 채널별 캠페인 성과를
              더 쉽게 비교하는 마케팅용 URL 단축 서비스입니다.
            </p>
          </div>

          <nav className="footer-nav" aria-label="Footer">
            {footerGroups.map((group) => (
              <div className="footer-group" key={group.title}>
                <h2>{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="section-shell footer-bottom">
          <p>© 2026 {displayName}. URL shortener for marketing links.</p>
          <a href="https://3w.ai.kr" target="_blank" rel="noopener noreferrer">
            by 3w.ai.kr
          </a>
        </div>
      </footer>
    </main>
  );
}
