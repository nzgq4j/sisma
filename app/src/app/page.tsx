// Public overview website (components/site/HomePage.tsx), with the app's structured data for search engines.
import { Home } from '@/components/site/HomePage';
import { JsonLd, appGraph } from '@/lib/structured-data';

export default function Page() {
  return <><JsonLd graph={appGraph()} /><Home /></>;
}
