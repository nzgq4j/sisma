'use client';
// Me → Alerts (sisma+; layout after the polar lights alert rules): the master switch with a summary, up to 5 alert
// rules as cards (each with its own on/off; tap to edit in ./rule), push delivery for this device, and the alerts
// sent in the last 30 days. Free accounts see what sisma+ adds and the upgrade sheet; guests are asked to sign in.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { usePushDevice } from '@/components/PushDevice';
import { useDistance } from '@/components/Units';
import { MagBadge } from '@/components/MagBadge';
import { timeAgo } from '@/components/QuakeRow';
import { regionHref } from '@/components/QuakeDetail';
import { AlertDevice, countryName } from '@/components/alerts/shared';
import { useAlertHistory, useAlertRules, type Rule } from '@/components/alerts/useAlerts';
import { quietLine, watchingLine } from '@/components/alerts/describe';
import { limits } from '@/lib/entitlements';
import { snapRadius } from '@/lib/alert-radius';
import type { WorldRegion } from '@/lib/world-regions';
import me from '../me.module.css';
import sub from '../subscription/subscription.module.css';
import styles from './alerts.module.css';

const MAX = limits('plus').maxAlertRules;

export default function AlertsPage() {
  const { t, m } = useT();
  const k = m.rules;
  const router = useRouter();
  const { plan, setSheet } = useApp();
  const { user } = useAccount();
  const push = usePushDevice();
  const a = useAlertRules();
  const back = <Link href="/app/me" className={sub.back}><span className="ms" aria-hidden="true">arrow_back</span>{m.sub.back}</Link>;

  if (!user || plan !== 'plus') {
    return (
      <div className={me.page}>
        {back}
        <h1 className={sub.h1}>{k.title}</h1>
        <div className={me.planFree}>
          <div className={me.planH}>{k.locked_h}</div>
          <div className={me.planP}>{user ? k.locked_p : k.signin_p}</div>
          <button type="button" className={me.planBtn} onClick={() => setSheet('paywall')}>{t('trial')}</button>
        </div>
      </div>
    );
  }

  const addRule = async () => {
    const id = await a.add(k.unnamed.replace('{n}', String(a.rules.length + 1)), a.rules.length);
    if (id) router.push(`/app/me/alerts/rule?id=${id}`);
  };
  const toggleMaster = () => {
    // Turning alerts on also asks this device for notification permission (it has to come from a tap).
    if (!a.enabled && push.state === 'off') void push.enable();
    void a.setEnabled(!a.enabled);
  };

  return (
    <div className={me.page}>
      {back}
      <h1 className={sub.h1}>{k.title}</h1>

      <button type="button" className={styles.master} role="switch" aria-checked={a.enabled} onClick={toggleMaster} disabled={a.loading}>
        <span className={styles.masterText}>
          <strong>{a.enabled ? k.on_h : k.off_h}</strong>
          <span>{a.enabled ? k.on_p : k.off_p}</span>
        </span>
        <span className={styles.sw} aria-hidden="true"><span /></span>
      </button>

      <div className={styles.sectionHead}>
        <span>{k.yours}</span>
        <span className={styles.count}>{k.count.replace('{n}', String(a.rules.length)).replace('{max}', String(MAX))}</span>
      </div>
      {a.rules.map((r, i) => <RuleCard key={r.id} rule={r} index={i} dim={!a.enabled} onToggle={() => void a.update(r.id, { enabled: !r.enabled })} />)}
      {!a.loading && (a.rules.length < MAX
        ? <button type="button" className={styles.add} onClick={() => void addRule()}><span className="ms" aria-hidden="true">add</span>{k.add}</button>
        : <p className={me.hint}>{k.limit.replace('{max}', String(MAX))}</p>)}
      {a.error && <p className={me.errLine} role="alert">{m.acct.error}</p>}

      <div className={styles.sectionHead}><span>{k.deliver}</span></div>
      <div className={me.card}>
        <div className={me.row}><span className="ms" aria-hidden="true">notifications</span><span className={me.grow}>{t('push')}</span></div>
        <AlertDevice />
      </div>

      <History />
    </div>
  );
}

function RuleCard({ rule, index, dim, onToggle }: { rule: Rule; index: number; dim: boolean; onToggle: () => void }) {
  const { m, locale, nf } = useT();
  const k = m.rules;
  const u = useDistance();
  const areas = [...rule.regions.map(r => m.wr[r as WorldRegion] ?? r), ...rule.countries.map(c => countryName(locale, c))];
  return (
    <div className={styles.rule} data-off={!rule.enabled || dim ? '' : undefined}>
      <div className={styles.ruleHead}>
        <Link href={`/app/me/alerts/rule?id=${rule.id}`} className={styles.ruleName}>
          {rule.name || k.unnamed.replace('{n}', String(index + 1))}<span className="ms" aria-hidden="true">chevron_right</span>
        </Link>
        <button type="button" className={styles.ruleSwitch} role="switch" aria-checked={rule.enabled} aria-label={rule.name || k.unnamed.replace('{n}', String(index + 1))} onClick={onToggle}>
          <span className={styles.sw} aria-hidden="true"><span /></span>
        </button>
      </div>
      <Link href={`/app/me/alerts/rule?id=${rule.id}`} className={styles.ruleBody}>
        <span className={styles.label}>{k.watching}</span>
        <span className={styles.value}>{watchingLine({ ...rule, radiusKm: snapRadius(rule.radiusKm, u.units) }, k, u.dist, areas)}</span>
        <span className={styles.label}>{k.minimum}</span>
        <span className={styles.value}>M{nf.format(rule.minMagnitude)}+</span>
        <span className={styles.label}>{k.quiet}</span>
        <span className={styles.value}>{quietLine(rule, k)}</span>
      </Link>
    </div>
  );
}

function History() {
  const { t, m, locale } = useT();
  const k = m.rules;
  const items = useAlertHistory();
  const when = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <>
      <div className={styles.sectionHead} id="history"><span>{k.history}</span></div>
      {items && items.length === 0 && <p className={me.hint}>{k.history_empty}</p>}
      {items && items.length > 0 && (
        <>
          <p className={me.hint}>{k.history_kept}</p>
          <div className={styles.history}>
            {items.map(d => (
              <Link key={d.quakeId} href={regionHref(d.quakeId)} className={styles.historyRow}>
                <MagBadge mag={d.mag} size={44} />
                <span className={styles.historyText}>
                  <strong>{d.place || `${d.lat.toFixed(2)}, ${d.lon.toFixed(2)}`}</strong>
                  <span>{when.format(d.sentAt)} · {timeAgo(t as never, d.sentAt)}</span>
                  {d.ruleName && <span className={styles.historyRule}><span className="ms" aria-hidden="true">notifications</span>{d.ruleName}</span>}
                </span>
                <span className="ms" aria-hidden="true">chevron_right</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
