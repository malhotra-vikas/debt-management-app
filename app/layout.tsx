import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/theme-context'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Debt Management Application',
  description: 'Manage your debts and plan for financial freedom',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}