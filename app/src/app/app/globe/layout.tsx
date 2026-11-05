import { CARDS, cardMetadata } from '@/lib/seo';

export const metadata = cardMetadata(CARDS.globe);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
