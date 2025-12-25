import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "../providers"
import { routing } from "@/i18n/routing"
import "../globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

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
      "google-adsense-account": "ca-pub-7020101743498097",
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

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7020101743498097"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Analytics />
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
