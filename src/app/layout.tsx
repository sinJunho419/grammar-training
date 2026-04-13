import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "입시내비 9대 로직 영문법 트레이닝",
  description: "메타인지 기반 영문법 훈련 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} antialiased min-h-screen`}>
        <main className="max-w-xl mx-auto px-5 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
