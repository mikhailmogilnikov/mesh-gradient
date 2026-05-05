import type { ReactNode } from 'react';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{
        title: 'Mesh Gradient',
        url: '/',
      }}
      links={[
        {
          text: 'GitHub',
          url: 'https://github.com/mikhailmogilnikov/mesh-gradient',
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
