'use client';
// Article. Port the canvas visuals from the design file: drawPlates, drawFaults, drawWaves, drawTsunami,
// plus the magnitude slider (energy = 10^(1.5M+4.8) J), depth histogram + Omori bars, and the preparedness kit.
import { use } from 'react';
import science from '@/content/science.json';

export default function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const a = science.find(x => x.id === slug);
  if (!a) return null;
  return (
    <article style={{ padding: '4px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 17, lineHeight: 1.5 }}>{a.intro}</p>
      {/* TODO: <ScienceCanvas visual={a.visual} modes={a.modes} /> */}
      {a.sections.map(s => (<section key={s.h}><h2 style={{ fontSize: 19 }}>{s.h}</h2><p style={{ lineHeight: 1.6 }}>{s.p}</p></section>))}
    </article>
  );
}
