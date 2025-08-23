import './globals.css';

import { Head } from 'nextra/components';
import { Viewport } from 'next';
import { Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';

import { openRunde } from '@/src/shared/assets/fonts/open-runde/open-runde';

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

const navbar = (
  <Navbar
    className='max-sm:px-4'
    logo={<b className='text-lg'>Mesh Gradient</b>}
    projectLink='https://github.com/mikhailmogilnikov/web-mesh-gradient'
  />
);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap();

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head
        backgroundColor={{
          dark: '#000000',
        }}
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body className={openRunde.className}>
        <Layout
          navbar={navbar}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          navigation={{
            prev: true,
            next: true,
          }}
          editLink='Edit this page on GitHub'
          pageMap={pageMap}
          docsRepositoryBase='https://github.com/mikhailmogilnikov/web-mesh-gradient'
          darkMode={true}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
