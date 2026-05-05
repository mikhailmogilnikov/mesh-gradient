import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';

import { appName } from '@/lib/shared';
import { getPageImage, source } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, context: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await context.params;
  const page = source.getPage(slug.slice(0, -1));

  if (!page) notFound();

  return new ImageResponse(<DefaultImage title={page.data.title} description={page.data.description} site={appName} />, {
    width: 1200,
    height: 630,
  });
}

export function generateStaticParams() {
  return source.getPages().map((page: (typeof source)['$inferPage']) => ({
    slug: getPageImage(page).segments,
  }));
}
