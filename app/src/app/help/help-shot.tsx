'use client';
// Help screenshots in the language of the text around them (see ./help-parts.tsx).
/* eslint-disable @next/next/no-img-element -- static screenshots with fixed size */
import { createContext, useContext } from 'react';
import s from './help.module.css';

/** The language of the help text being shown; screenshots follow it. */
export const HelpLang = createContext<string>('en');

/** A phone screenshot in the light and the dark theme; the CSS shows the one that matches the page's theme. */
export function Shot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const lang = useContext(HelpLang);
  const dir = lang === 'en' ? '/help/' : `/help/${lang}/`;
  return (
    <figure className={s.shot}>
      <img className={s.onLight} src={`${dir}${src}-light.webp`} alt={alt} width={585} height={1266} loading="lazy" decoding="async" />
      <img className={s.onDark} src={`${dir}${src}-dark.webp`} alt={alt} width={585} height={1266} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

