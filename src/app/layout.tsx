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
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
