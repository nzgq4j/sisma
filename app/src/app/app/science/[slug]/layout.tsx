import type { Metadata } from 'next';
import { articleCard, cardMetadata } from '@/lib/seo';
import { JsonLd, articleGraph } from '@/lib/structured-data';

// Each science article gets its own title, description and card (public/og/science-<id>.jpg).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const card = articleCard((await params).slug);
  return card ? cardMetadata(card) : {};
}

// Structured data: the article and its breadcrumbs (lib/structured-data.tsx).
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  return <><JsonLd graph={articleGraph((await params).slug)} />{children}</>;
}
