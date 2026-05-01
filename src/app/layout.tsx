import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harbor — Stripe for APIs",
  description: "Turn your API into a paid product in minutes. Authentication, rate limiting, billing, and analytics — all in one SDK.",
  openGraph: {
    title: "Harbor — Stripe for APIs",
    description: "Turn your API into a paid product in minutes.",
    url: "https://useharbor.dev",
    siteName: "Harbor",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harbor — Stripe for APIs",
    description: "Turn your API into a paid product in minutes.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#020617] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
