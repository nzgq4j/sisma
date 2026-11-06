'use client';
// The help home's frame with its translated title ("Help & support" in the app language).
import type { ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { HelpChrome, type NavTopic } from './HelpChrome';

export function HelpHubTitle({ nav, children }: { nav: NavTopic[]; children: ReactNode }) {
  const { m } = useT();
  return <HelpChrome nav={nav} title={m.web.help}>{children}</HelpChrome>;
}
