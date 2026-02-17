import "./globals.css";
import "./react-scan";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "../components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "React Scan",
  description:
    "React Scan automatically detects and highlights components that cause performance issues in your React app.",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    type: "website",
    url: "https://react-scan.com",
    title: "React Scan",
    description:
      "React Scan automatically detects and highlights components that cause performance issues in your React app.",
    images: "https://react-scan.com/banner.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "React Scan",
    description:
      "React Scan automatically detects and highlights components that cause performance issues in your React app.",
    images: "https://react-scan.com/banner.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://react-scan.com" />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab@latest/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
            data-options='{"activationKey":"g"}'
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        <main className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-8">
          <Header />
          <div className="pt-4 sm:pt-8">{children}</div>
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
