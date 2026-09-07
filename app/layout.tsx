import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Jua } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const gowun = Gowun_Dodum({
  variable: "--font-gowun",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "뿡뿡이",
  description: "우리 둘의 추억을 쌓아두는 곳",
  appleWebApp: {
    capable: true,
    title: "뿡뿡이",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff8fa3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${jua.variable} ${gowun.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
