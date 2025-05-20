
//src\app\layout.tsx
import './globals.css'
import { Poppins } from 'next/font/google'
import { Providers } from './providers'
import 'react-toastify/dist/ReactToastify.css'
 import { AuthProvider } from '@/contexts/auth-context';

 const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // Include all weights you need
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
    <html lang="en" suppressHydrationWarning={true}>
      <body className={poppins.className}>
          <AuthProvider>
            <Providers>
             {children}
            </Providers>
         </AuthProvider>
      </body>
    </html>
  )
}