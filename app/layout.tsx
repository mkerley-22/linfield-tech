import type { Metadata } from 'next'
import './globals.css'
import KnowledgeBaseLayout from '@/components/KnowledgeBaseLayout'

export const metadata: Metadata = {
  title: 'Linfield AV Hub',
  description: 'Audio/Video equipment and knowledge management for Linfield Christian School',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AV Inventory',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full antialiased bg-gray-50">
        <KnowledgeBaseLayout>{children}</KnowledgeBaseLayout>
      </body>
    </html>
  )
}

