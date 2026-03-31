import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'Nakath.lk | Verified Sri Lankan Matrimony',
  description:
    'A trust-first Sri Lankan matrimony platform with biodata PDFs, instant Porondam, verification, and privacy controls for individuals and families.',
  manifest: '/manifest.json',
  themeColor: '#0B0B0C',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} dark`} data-scroll-behavior="smooth">
      <body className="bg-background font-sans antialiased text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
