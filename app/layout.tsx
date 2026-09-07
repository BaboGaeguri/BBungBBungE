import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

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
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
