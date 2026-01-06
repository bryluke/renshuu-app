import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { DrawerProvider } from '@/contexts/DrawerContext'
import { RefreshProvider } from '@/contexts/RefreshContext'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Renshuu - Fitness Tracking',
  description: 'Track nutrition, workouts, and body metrics with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <RefreshProvider>
              <DrawerProvider>
                {children}
              </DrawerProvider>
            </RefreshProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}