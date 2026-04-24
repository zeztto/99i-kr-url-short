import { HomeClient } from "./home-client";
import { getRequestSiteConfig } from "@/lib/site-config";
import { getTurnstileSiteKey, isTurnstileEnabled } from "@/lib/turnstile";

function buildJsonLd(siteConfig: Awaited<ReturnType<typeof getRequestSiteConfig>>) {
  const brandName = siteConfig.domain.startsWith("localhost")
    ? "99i.kr"
    : siteConfig.name;
  const baseUrl = siteConfig.baseUrl;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brandName,
      url: baseUrl,
      logo: new URL("/icon.svg", baseUrl).toString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brandName,
      url: baseUrl,
      description:
        "긴 URL을 짧은 링크로 만들고 가입자에게 링크 통계와 유료 운영 기능을 제공하는 URL 단축 서비스입니다.",
      inLanguage: "ko-KR",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brandName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: baseUrl,
      description:
        "누구나 단축 주소와 QR 코드를 만들 수 있고, 가입자는 플랜에 따라 기본 통계, 추천인 링크 성과 측정, 고유주소, 목적지 수정, 상세 통계, 통계 보고서 다운로드, 조직 단위 운영 기능을 사용할 수 있습니다.",
      offers: [
        {
          "@type": "Offer",
          name: "Basic",
          price: "0",
          priceCurrency: "KRW",
          description:
            "비상업적 용도와 개인적인 공유 목적, 무작위 단축 주소 발급, 단축 주소 최대 10개 관리, 주소당 10,000회 접속 제공, 총 클릭 수와 접속 국가 정보",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "4500",
          priceCurrency: "KRW",
          description:
            "프리랜서 마케터용, 연 구독 기준 4,500원/월, 월 구독 기준 5,500원/월, 단축 주소 최대 30개 관리, 추천인/채널 링크 구분 운영, 캠페인별 주소 묶음, 캠페인당 100,000회 접속 제공, 기본 통계 및 기간 데이터, 캠페인 QR 코드 생성/관리",
        },
        {
          "@type": "Offer",
          name: "Max",
          price: "13200",
          priceCurrency: "KRW",
          description:
            "성장하는 팀용, 연 구독 기준 13,200원/월, 월 구독 기준 16,500원/월, 단축 주소 최대 100개 관리, 고유주소, 목적지 수정, 주소당 1,000,000회 접속 제공, 상세 통계, 보고서 다운로드, QR 코드 목적지 수정/관리",
        },
        {
          "@type": "Offer",
          name: "Enterprise",
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "KRW",
            description: "문의 후 맞춤 견적",
          },
          description:
            "맞춤 계약, 맞춤 단축 주소 수와 접속 한도, 전용 도메인, SSO/SAML 로그인, SCIM 사용자 프로비저닝, 팀 권한과 승인 워크플로, 감사 로그, 대량 QR 캠페인, 맞춤 통계 리포트와 SLA",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "99i.kr은 무료로 사용할 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "단축 주소 생성은 누구나 사용할 수 있고, 가입하면 Basic 플랜으로 최대 10개 링크의 기본 통계를 확인할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "Basic 플랜의 접속 한도는 어떻게 되나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Basic 플랜은 링크 1개당 10,000회 접속까지 제공합니다. 한도를 넘기면 새 링크를 만들거나 유료 플랜으로 전환해야 합니다.",
          },
        },
        {
          "@type": "Question",
          name: "Max 플랜에서는 무엇이 달라지나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Max 플랜은 성장하는 팀을 위해 최대 100개 주소 관리, 고유주소, 목적지 수정, 주소당 1,000,000회 접속, 상세 통계, 보고서 다운로드를 제공합니다.",
          },
        },
        {
          "@type": "Question",
          name: "Enterprise 플랜은 어떤 경우에 필요하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "SSO/SAML 로그인, SCIM 사용자 프로비저닝, 팀 권한, 승인 워크플로, 감사 로그, SLA가 필요한 조직은 Enterprise 플랜을 별도 계약으로 사용할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "단축 주소는 마케팅에 어떻게 활용하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "추천인 링크, 광고 소재별 링크, 뉴스레터 링크, QR 코드 링크를 나눠 배포하면 채널별 클릭과 전환 후보 흐름을 비교할 수 있습니다.",
          },
        },
      ],
    },
  ];
}

export default async function HomePage() {
  const siteConfig = await getRequestSiteConfig();
  const turnstileSiteKey = isTurnstileEnabled()
    ? getTurnstileSiteKey()
    : null;
  const jsonLd = buildJsonLd(siteConfig);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        siteConfig={siteConfig}
        turnstileSiteKey={turnstileSiteKey}
      />
    </>
  );
}
