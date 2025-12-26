import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Linfield AV Hub',
  description: 'Audio/Video equipment and knowledge management for Linfield Christian School',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full antialiased bg-gray-50">{children}</body>
    </html>
  )
}

