// src/app/layout.tsx
import './globals.css'
import { Poppins } from 'next/font/google'
import 'react-toastify/dist/ReactToastify.css'
import { Providers } from './providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
  title: 'BizNetwork',
  description: 'Business Networking Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
