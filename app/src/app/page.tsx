'use client';
// Public overview website. Spec: design/Sisma Website.dc.html
// (header, hero with live app, features, science, pricing with monthly/yearly toggle, languages, footer).
import Link from 'next/link';
import { useState } from 'react';
import { useT, LOCALES, type Locale } from '@/i18n/I18nProvider';
import { AppPreview } from '@/components/site/AppPreview';
import { LogoMark } from '@/components/Logo';
import { LanguagePicker } from '@/components/LanguagePicker';
import styles from '@/components/site/site.module.css';
import science from '@/content/science.json';
import { MAG_SCALE } from '@/lib/theme';
import { PRICES, type Billing } from '@/lib/entitlements';
import { SITE } from '@/lib/site';

const LOCALE_FLAGS = LOCALES as { code: Locale; name: string; flag?: string }[];
const TONE: Record<string, string> = { violet: styles.toneViolet, mint: styles.toneMint, warm: styles.toneWarm };
// Low → high, the order the hero scale reads in.
const MAG_STEPS = [...MAG_SCALE].reverse().map(([, fill]) => fill);

const usd = (n: number) => '$' + (Number.isInteger(n) ? String(n) : n.toFixed(2));

export default function Home() {
  const { m, t, locale, setLocale } = useT();
  const w = m.web;
  const [billing, setBilling] = useState<Billing>('yearly');
  const yearly = billing === 'yearly';

  const monthly = PRICES.monthly.usd, annual = PRICES.yearly.usd;
  const savePct = Math.round((1 - annual / (monthly * 12)) * 100);
  const price = yearly ? usd(annual) : usd(monthly);
  const per = yearly ? t('per_year') : t('per_month');
  const priceSub = yearly ? `$${(annual / 12).toFixed(2)} ${t('per_month')}` : `$${(monthly * 12).toFixed(2)} ${t('per_year')}`;

  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.brand}>
            <LogoMark size={34} fixed />
            <span className={styles.wordmark}>sisma<span>.io</span></span>
          </a>
          <nav className={styles.nav}>
            <a href="#features">{w.nav_features}</a>
            <a href="#science">{w.nav_science}</a>
            <a href="#pricing">{w.nav_pricing}</a>
          </nav>
          <div className={styles.headerActions}>
            <LanguagePicker sheetClassName={styles.lightVars}>{(open, cur) => (
              <button type="button" className={styles.langSelect} onClick={open} aria-haspopup="dialog" aria-label={`${t('language')}: ${cur.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny bundled SVGs */}
                {cur.flag && <img src={`/flags/${cur.flag}.svg`} alt="" width={20} height={20} className={styles.flagSm} />}
                {cur.name}<span className={styles.ms} aria-hidden="true">expand_more</span>
              </button>
            )}</LanguagePicker>
            <Link href={SITE.appPath} className={styles.pillSmall}>{w.open_app}</Link>
          </div>
        </div>
      </header>

      <main>
        <section id="top" className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.tag}><span className={styles.tagDot} />{t('app_tag')}</div>
            <h1 className={styles.h1}>{w.hero_h}</h1>
            <p className={styles.lead}>{w.hero_p}</p>
            <div className={styles.ctaRow}>
              <Link href={SITE.appPath} className={styles.ctaPrimary}><span className={styles.ms} aria-hidden="true">open_in_new</span>{w.open_app}</Link>
              <a href={SITE.playUrl} className={styles.ctaSecondary}><span className={styles.ms} aria-hidden="true">android</span>{w.play}</a>
            </div>
            <div className={styles.magScale} aria-hidden="true">
              <span className={styles.magLabel} style={{ marginRight: 6 }}>M</span>
              {MAG_STEPS.map(c => <span key={c} className={styles.magBar} style={{ background: c }} />)}
              <span className={styles.magLabel} style={{ marginLeft: 6 }}>7+</span>
            </div>
          </div>
          <AppPreview />
        </section>

        <section id="features" className={styles.features}>
          {([
            ['sort', styles.toneViolet, w.f1_h, w.f1_p],
            ['public', styles.toneMint, w.f2_h, w.f2_p],
            ['vibration', styles.toneWarm, w.f3_h, w.f3_p],
            ['science', styles.toneViolet, w.f4_h, w.f4_p],
          ] as const).map(([icon, tone, h, p]) => (
            <div key={icon} className={styles.featureCard}>
              <span className={`${styles.featureIcon} ${tone}`}><span className={styles.ms} aria-hidden="true">{icon}</span></span>
              <h3 className={styles.h3}>{h}</h3>
              <p className={styles.body}>{p}</p>
            </div>
          ))}
        </section>

        <section id="science" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>{t('sci_title')}</h2>
            <p className={styles.sub}>{t('sci_sub')}</p>
          </div>
          <div className={styles.topicGrid}>
            {science.map((a, i) => (
              <Link key={a.id} href={`${SITE.appPath}/science/${a.id}`} className={styles.topic}>
                <div className={styles.topicTop}>
                  <span className={`${styles.topicIcon} ${TONE[a.tone] ?? styles.toneViolet}`}><span className={styles.ms} aria-hidden="true">{a.icon}</span></span>
                  <span className={styles.topicNum}>{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className={styles.topicTitle}>{m.sci_t[i]}</div>
                <div className={styles.topicBlurb}>{a.intro}</div>
              </Link>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.section}>
          <div className={styles.priceHead}>
            <div className={styles.sectionHead}>
              <h2 className={styles.h2}>{w.price_h}</h2>
              <p className={styles.sub}>{w.price_p}</p>
            </div>
            <div className={styles.billToggle} role="group" aria-label={w.nav_pricing}>
              {(['monthly', 'yearly'] as const).map(id => (
                <button key={id} type="button" className={styles.billBtn} aria-pressed={billing === id} onClick={() => setBilling(id)}>{t(id)}</button>
              ))}
            </div>
          </div>
          <div className={styles.planGrid}>
            <div className={`${styles.plan} ${styles.planFree}`}>
              <div className={styles.planHead}>
                <span className={styles.planName}>{t('plan_free')}</span>
                <span className={styles.price}>$0</span>
              </div>
              <div className={styles.entList}>
                {m.ent_free.map(e => <div key={e} className={styles.ent}><span className={styles.ms} aria-hidden="true">check</span>{e}</div>)}
              </div>
              <Link href={SITE.appPath} className={styles.planCtaFree}>{w.open_app}</Link>
            </div>
            <div className={`${styles.plan} ${styles.planPlus}`}>
              <div className={styles.planHead}>
                <div className={styles.planNameRow}>
                  <span className={styles.planNamePlus}>sisma+</span>
                  {yearly && <span className={styles.saveBadge}>{t('save', { n: savePct })}</span>}
                </div>
                <div className={styles.priceRow}><span className={styles.price}>{price}</span><span className={styles.per}>{per}</span></div>
                <span className={styles.priceSub}>{priceSub}</span>
              </div>
              <div className={styles.plusLead}>{t('everything_free')}</div>
              <div className={styles.entList}>
                {m.ent_plus.map(e => <div key={e} className={`${styles.ent} ${styles.entPlus}`}><span className={styles.ms} aria-hidden="true">check_circle</span>{e}</div>)}
              </div>
              <Link href={`${SITE.appPath}/me`} className={styles.planCtaPlus}>{t('trial')}</Link>
            </div>
          </div>
        </section>

        <section className={styles.langs}>
          <h2 className={styles.langH}>{w.lang_h}</h2>
          <div className={styles.chips}>
            {LOCALE_FLAGS.map(l => (
              <button key={l.code} type="button" lang={l.code} className={styles.chip} aria-pressed={l.code === locale} onClick={() => setLocale(l.code)}>
                {l.flag && (
                  // eslint-disable-next-line @next/next/no-img-element -- tiny bundled SVGs, no optimisation needed
                  <img src={`/flags/${l.flag}.svg`} alt="" width={26} height={26} className={styles.flag} />
                )}
                {l.name}
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerMark}>sisma<span>.io</span></span>
          <p className={styles.footerText}>{w.footer}</p>
          <Link href="/privacy" className={styles.footerLink}>{w.privacy}</Link>
          <Link href="/terms" className={styles.footerLink}>{w.terms}</Link>
        </div>
      </footer>
    </div>
  );
}
