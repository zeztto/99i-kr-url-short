import type { Metadata } from "next";
import "./globals.css";
import { getRequestSiteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getRequestSiteConfig();

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    title: siteConfig.title,
    description: siteConfig.description,
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
