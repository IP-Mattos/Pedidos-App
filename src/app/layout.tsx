import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css' // ← IMPORTANTE: Esta línea
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/use-auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Orders App',
  description: 'Sistema de pedidos en tiempo real'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position='top-right' />
      </body>
    </html>
  )
}
