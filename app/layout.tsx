import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl = "https://pomobox.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pomobox - Minimal Pomodoro Timer for Focused Work",
    template: "%s | Pomobox",
  },
  description:
    "A clean, distraction-free Pomodoro timer to boost your productivity. Track focus sessions, take smart breaks, and stay in flow.",
  keywords: [
    "pomodoro",
    "timer",
    "productivity",
    "focus",
    "study",
    "work",
    "time management",
    "pomodoro technique",
  ],
  authors: [{ name: "Pomobox" }],
  creator: "Pomobox",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Pomobox",
    title: "Pomobox - Minimal Pomodoro Timer for Focused Work",
    description:
      "A clean, distraction-free Pomodoro timer to boost your productivity. Track focus sessions, take smart breaks, and stay in flow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pomobox - Minimal Pomodoro Timer for Focused Work",
    description:
      "A clean, distraction-free Pomodoro timer to boost your productivity. Track focus sessions, take smart breaks, and stay in flow.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    other: {
      "naver-site-verification": "e09d920f92485cdb757332999b0dcb5089701a75",
    },
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pomobox",
  description:
    "A clean, distraction-free Pomodoro timer to boost your productivity. Track focus sessions, take smart breaks, and stay in flow.",
  url: siteUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Pomodoro Timer",
    "Focus Sessions",
    "Break Management",
    "Session Statistics",
    "Customizable Durations",
    "Sound Notifications",
    "Dark Mode",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Analytics />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}