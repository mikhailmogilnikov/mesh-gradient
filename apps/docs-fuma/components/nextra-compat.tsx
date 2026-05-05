import type { ReactNode } from 'react';

import Link from 'next/link';

export function Callout({ children }: { children: ReactNode }) {
  return <div className='my-4 rounded-lg border border-fd-border bg-fd-card p-4'>{children}</div>;
}

function CardsRoot({ children }: { children: ReactNode }) {
  return <div className='my-4 grid gap-3 sm:grid-cols-3'>{children}</div>;
}

function Card({ icon, title, href }: { icon?: ReactNode; title: string; href: string; arrow?: boolean }) {
  return (
    <Link href={href} className='rounded-lg border border-fd-border bg-fd-card p-4 transition-colors hover:bg-fd-accent/30'>
      <div className='mb-2 text-lg'>{icon}</div>
      <div className='font-medium'>{title}</div>
    </Link>
  );
}

export const Cards = Object.assign(CardsRoot, { Card });
