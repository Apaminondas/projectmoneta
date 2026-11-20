import React from "react"
import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import './globals.css'
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: 'Moneta — Gestão Financeira Corporativa',
  description: 'Dashboard corporativo fullstack com API REST Spring Boot 3 e BFF zero-token em Next.js 16.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      {
        url: '/moneta-icon-512.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
    shortcut: '/moneta-icon-512.png',
    apple: '/moneta-icon-512.png',
  },
  openGraph: {
    title: 'Moneta — Gestão Financeira Corporativa',
    description: 'Dashboard corporativo fullstack com API REST Spring Boot 3 e BFF zero-token em Next.js 16.',
    locale: 'pt_BR',
    type: 'website',
    siteName: 'Moneta',
    ...(siteUrl
      ? {
          images: [
            {
              url: '/moneta-icon-512.png',
              width: 512,
              height: 512,
              alt: 'Moneta',
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: 'summary',
    title: 'Moneta — Gestão Financeira Corporativa',
    description: 'Dashboard corporativo fullstack com API REST Spring Boot 3 e BFF zero-token em Next.js 16.',
    ...(siteUrl ? { images: ['/moneta-icon-512.png'] } : {}),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", inter.variable, ibmPlexMono.variable)}>
      <body className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
