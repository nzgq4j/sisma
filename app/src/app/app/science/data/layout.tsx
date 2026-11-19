import { CARDS, cardMetadata } from '@/lib/seo';

export const metadata = cardMetadata(CARDS.data);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
