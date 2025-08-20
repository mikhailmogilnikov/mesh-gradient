import './globals.css';

import { Head } from 'nextra/components';
import { Viewport } from 'next';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

const navbar = (
  <Navbar
    logo={<b>Mesh Gradient</b>}
    projectLink='https://github.com/mikhailmogilnikov/web-mesh-gradient'
    // ... Your additional navbar options
  />
);

const footer = <Footer className='py-6'>MIT {new Date().getFullYear()} © Mikhail Mogilnikov.</Footer>;

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
      <body>
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
          footer={footer}
          darkMode={true}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
