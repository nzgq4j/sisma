import type { Metadata } from 'next';
import { articleCard, cardMetadata } from '@/lib/seo';

// Each science article gets its own title, description and card (public/og/science-<id>.jpg).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const card = articleCard((await params).slug);
  return card ? cardMetadata(card) : {};
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
