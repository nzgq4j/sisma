import type { Metadata } from 'next';

// Account pages are personal: kept out of search results.
export const metadata: Metadata = { title: 'Your account | sisma', robots: { index: false, follow: false }, alternates: { canonical: '/app/me' }, openGraph: null };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
