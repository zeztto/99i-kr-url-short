import type { Metadata } from "next";
import "./globals.css";
import { getRequestSiteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getRequestSiteConfig();
  const ogImageUrl = new URL("/opengraph-image", siteConfig.baseUrl).toString();

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    applicationName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    alternates: {
      canonical: siteConfig.baseUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: siteConfig.baseUrl,
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} Open Graph image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
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
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
