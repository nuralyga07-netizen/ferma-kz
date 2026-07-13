import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ferma.kz — Свежие фермерские продукты напрямую",
  description:
    "Покупайте домашние продукты напрямую у фермеров Актобе без посредников. Мясо, молочка, овощи, мёд и многое другое.",
  keywords: ["фермерские продукты", "Актобе", "домашняя еда", "свежие продукты", "без посредников"],
  openGraph: {
    title: "Ferma.kz — Свежие фермерские продукты напрямую",
    description: "Покупайте домашние продукты напрямую у фермеров Актобе без посредников",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
