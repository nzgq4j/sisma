import { AppShell } from '@/components/AppShell';
import { CARDS, cardMetadata } from '@/lib/seo';

// Server layout for /app/*: the feed's search and social card (each tab's layout sets its own), around the client shell.
export const metadata = cardMetadata(CARDS.feed);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
