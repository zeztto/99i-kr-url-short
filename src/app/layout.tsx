import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getRequestSiteConfig } from "@/lib/site-config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getRequestSiteConfig();
  const brandName = siteConfig.domain.startsWith("localhost")
    ? "99i.kr"
    : siteConfig.name;
  const title = `${brandName} - URL 단축, 링크 통계, 브랜드 링크 플랜`;
  const description =
    "긴 URL을 짧게 만들고 QR 코드 생성, 추천인 링크, 채널별 캠페인, 전환율 측정, 통계 보고서 다운로드, Enterprise 맞춤 운영까지 지원하는 마케팅용 URL 단축 서비스입니다.";
  const ogImageUrl = new URL("/opengraph-image", siteConfig.baseUrl).toString();

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    applicationName: brandName,
    title,
    description,
    keywords: [
      "URL 단축",
      "짧은 링크",
      "링크 통계",
      "브랜드 링크",
      "고유주소",
      "리다이렉트",
      "마케팅 링크",
      "추천인 링크",
      "전환율 측정",
      "QR 코드 생성",
      "QR 링크",
      "통계 보고서",
      "엔터프라이즈 URL 단축",
      "Enterprise 링크 관리",
      "99i.kr",
    ],
    creator: brandName,
    publisher: brandName,
    category: "BusinessApplication",
    alternates: {
      canonical: siteConfig.baseUrl,
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: siteConfig.baseUrl,
      siteName: brandName,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${brandName} pricing and URL shortener Open Graph image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
