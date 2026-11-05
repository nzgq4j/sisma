import { CARDS, cardMetadata } from '@/lib/seo';

export const metadata = cardMetadata(CARDS.map);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
