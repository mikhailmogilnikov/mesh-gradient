import './global.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { RootProvider } from 'fumadocs-ui/provider/next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='flex min-h-screen flex-col'>
        <RootProvider
          search={{
            enabled: true,
            options: {
              type: 'static',
            },
          }}
        >
          {/* <Banner
            id='v2'
            variant='rainbow'
            rainbowColors={[
              'rgba(139, 92, 246, 0.55)',
              'rgba(168, 85, 247, 0.5)',
              'transparent',
              'rgba(124, 58, 237, 0.5)',
              'transparent',
              'rgba(192, 132, 252, 0.5)',
              'transparent',
            ]}
          >
            v2.0 is here! <Link href='/docs/changelog'>Read the changelog</Link>.
          </Banner> */}

          {children}
        </RootProvider>
      </body>
    </html>
  );
}
