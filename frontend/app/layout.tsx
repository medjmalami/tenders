import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Tender Ops - Government Tender Dashboard',
  description: 'AI-powered internal dashboard for reviewing and managing government tenders',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        <Script
          id="theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const mq = window.matchMedia('(prefers-color-scheme: dark)');
                function apply(isDark) {
                  document.documentElement.classList.toggle('dark', isDark);
                }
                apply(mq.matches);
                mq.addEventListener('change', function(e) { apply(e.matches); });
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
