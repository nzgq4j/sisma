import type { Metadata } from 'next';
import { LIBRARY } from '@/lib/library';
import { cardMetadata, libraryCard } from '@/lib/seo';
import { JsonLd, libraryGraph } from '@/lib/structured-data';

// Every In Depth article is built ahead (static), with its own title, description and card (public/og/library-<id>.jpg).
export const dynamicParams = false;
export function generateStaticParams() { return LIBRARY.map(a => ({ slug: a.id })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const card = libraryCard((await params).slug);
  return card ? cardMetadata(card) : {};
}

// Structured data: the article (with its FAQ) and its breadcrumbs (lib/structured-data.tsx).
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  return <><JsonLd graph={libraryGraph((await params).slug)} />{children}</>;
}
