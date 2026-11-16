import { CARDS, cardMetadata } from '@/lib/seo';
import { JsonLd, libraryHubGraph } from '@/lib/structured-data';

export const metadata = cardMetadata(CARDS.library);

// Structured data: the In Depth collection and its breadcrumbs (lib/structured-data.tsx).
export default function Layout({ children }: { children: React.ReactNode }) {
  return <><JsonLd graph={libraryHubGraph()} />{children}</>;
}
