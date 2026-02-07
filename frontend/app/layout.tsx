import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://privia.app"),
  title: "Privia | Privacy-first AI chat workspace",
  description:
    "Privia is a privacy-aware, cloud-native AI chat workspace for teams. Keep conversations organized, grounded in your data, and ready for production use.",
  keywords: ["Privia", "AI chat", "privacy", "workspace", "assistant", "enterprise"],
  authors: [{ name: "Privia", url: "https://privia.app" }],
  creator: "Privia",
  publisher: "Privia",
  openGraph: {
    title: "Privia | Privacy-first AI chat workspace",
    description:
      "A calm, reliable AI assistant built for teams that need trustworthy answers and organized conversations.",
    images: ["/LOGO.png"],
    url: "https://privia.app",
    siteName: "Privia",
    locale: "en",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privia | Privacy-first AI chat workspace",
    description:
      "A calm, reliable AI assistant built for teams that need trustworthy answers and organized conversations.",
    images: ["/LOGO.png"],
    creator: "@Privia",
  },
  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/flower-black.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/flower-white.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/LOGO.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
