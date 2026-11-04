import type { Metadata } from 'next';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import { SITE } from '@/lib/site';
import { PrivacyChrome } from '../privacy/PrivacyChrome';
import styles from '../privacy/privacy.module.css';

// Terms of service (English only, like the privacy policy; the page chrome is translated).
// Keep it in step with how sisma works: plans, prices, trial, cancellation and the providers named here.
export const metadata: Metadata = {
  title: 'Terms of service — sisma',
  description: 'The terms for using sisma.io, the sisma app and sisma+ subscriptions.',
  alternates: { canonical: '/terms' },
};

const L = SITE.legal;
const support = <a href={`mailto:${L.supportEmail}`}>{L.supportEmail}</a>;
const usd = (n: number) => `US$${n.toFixed(2)}`;

export default function TermsPage() {
  return (
    <PrivacyChrome updated={L.termsUpdated} doc="terms">
      <section className={styles.summary} aria-label="Summary">
        <h2>The short version</h2>
        <ul>
          <li>sisma is <strong>not an official earthquake or tsunami warning service</strong>. Data can be late, preliminary or wrong. In an emergency, follow your local authorities.</li>
          <li>sisma is free to use. sisma+ is an optional subscription that renews until you cancel it, which you can do at any time.</li>
          <li>Use sisma fairly: don’t misuse it, overload it, or send false felt reports.</li>
          <li>Your personal data is covered by our <a href="/privacy">privacy policy</a>.</li>
        </ul>
      </section>

      <h2 id="agreement">1. Agreement</h2>
      <p>
        These terms apply to the website sisma.io, the web app at sisma.io/app and the sisma Android app (together, “sisma”), operated by {L.operator},
        {' '}{L.entity} (“we”, “us”). By using sisma you agree to these terms. If you don’t agree, please don’t use sisma.
      </p>

      <h2 id="warning">2. Not an official warning service</h2>
      <p>
        sisma shows earthquake information published by third parties: the U.S. Geological Survey (USGS), the European-Mediterranean Seismological Centre
        (EMSC), GeoNet (New Zealand) and the Japan Meteorological Agency (JMA). Early magnitudes and locations are preliminary and are often revised.
        Information may be delayed, incomplete or inaccurate, and alerts and posts may arrive late or not at all.
      </p>
      <p>
        <strong>Do not rely on sisma for decisions about your safety or anyone else’s.</strong> sisma does not issue earthquake or tsunami warnings. Always
        follow your national seismological agency, tsunami warning centre and local civil protection authorities.
      </p>

      <h2 id="accounts">3. Accounts</h2>
      <p>
        You can use most of sisma without an account. To create one you must be at least 13 years old (16 in the EEA and UK). Keep your sign-in details
        safe; you are responsible for what happens under your account. You can delete your account at any time in Me → Account → Delete account.
      </p>

      <h2 id="plus">4. sisma+ subscriptions</h2>
      <ul>
        <li><strong>What it includes.</strong> sisma+ adds the features described in the app at the time you subscribe, such as personal alerts, more saved places, full history and advanced filters. We may improve or change features over time.</li>
        <li><strong>Price.</strong> {usd(PRICES.monthly.usd)} per month or {usd(PRICES.yearly.usd)} per year, or the local price shown by Google Play, plus any applicable taxes. The price that applies is the one shown when you subscribe.</li>
        <li><strong>Free trial.</strong> New subscribers may get a {TRIAL_DAYS}-day free trial, once per person. Unless you cancel before the trial ends, the subscription starts and you are charged.</li>
        <li><strong>Renewal.</strong> Subscriptions renew automatically at the end of each monthly or yearly period until you cancel.</li>
        <li><strong>Cancelling.</strong> You can cancel at any time: for subscriptions bought on the website, in Me → Subscription → Manage billing (Stripe); for subscriptions bought in the Android app, in Google Play → Payments &amp; subscriptions. Cancelling stops the next renewal; you keep sisma+ until the end of the period you have paid for.</li>
        <li><strong>Refunds.</strong> Except where the law requires otherwise, payments are not refundable and we don’t refund partial periods. Purchases made through Google Play are also subject to Google Play’s refund policies. If you have a legal right to cancel or to a refund where you live, these terms don’t limit it.</li>
        <li><strong>Price changes.</strong> If we change the price, we’ll tell you in advance, and the new price applies only from your next renewal. You can cancel before then.</li>
        <li><strong>Payment providers.</strong> Payments are processed by Stripe (website) or Google Play (Android app) under their own terms.</li>
      </ul>

      <h2 id="use">5. Acceptable use</h2>
      <p>Please don’t:</p>
      <ul>
        <li>use sisma in a way that breaks the law or harms others;</li>
        <li>send false or misleading felt reports, or include other people’s personal information in them;</li>
        <li>scrape, copy or redistribute sisma at scale, use automated means to access it beyond normal personal use, or overload or disrupt it;</li>
        <li>try to get around access controls or subscription checks, or reverse engineer sisma except where the law allows it;</li>
        <li>share, resell or transfer a sisma+ subscription.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2 id="content">6. Felt reports</h2>
      <p>
        When you send a felt report, you allow us to store it and to use and publish it anonymously and in aggregate, for example on felt maps. Felt reports
        are not linked to your account. Don’t include personal information in the note.
      </p>

      <h2 id="ip">7. Our content and third-party data</h2>
      <p>
        sisma’s software, design, text, illustrations and branding belong to us or our licensors. You may use sisma for your own personal, non-commercial
        purposes, and you may share the share cards and links sisma creates. Earthquake data belongs to the agencies that publish it. Map data is
        © OpenStreetMap contributors, available under the Open Database License. Plate boundaries: PB2002 (Bird, 2003).
      </p>

      <h2 id="availability">8. Availability and changes</h2>
      <p>
        We work to keep sisma running, but we can’t promise that it will always be available, uninterrupted or free of errors, or that data sources will
        remain available. We may change, suspend or stop parts of sisma. If we stop sisma+ entirely, we’ll refund the unused part of any prepaid period for
        subscriptions bought on the website; for Google Play subscriptions we’ll cancel renewal and refunds follow Google Play’s policies.
      </p>

      <h2 id="disclaimer">9. Disclaimer</h2>
      <p>
        To the extent the law allows, sisma is provided “as is” and “as available”, without warranties of any kind, express or implied, including
        accuracy, timeliness, fitness for a particular purpose and non-infringement.
      </p>

      <h2 id="liability">10. Limitation of liability</h2>
      <p>
        To the extent the law allows, we are not liable for any indirect, incidental, special or consequential damages, or for any loss or harm arising from
        reliance on earthquake information, alerts or posts shown or not shown by sisma. Our total liability for any claim relating to sisma is limited to
        the amount you paid us for sisma+ in the 12 months before the claim, or US$50 if greater. Nothing in these terms limits liability that cannot be
        limited by law, or your statutory rights as a consumer.
      </p>

      <h2 id="ending">11. Ending these terms</h2>
      <p>
        You can stop using sisma and delete your account at any time. We may suspend or end your access if you seriously or repeatedly break these terms.
        Sections 2, 6, 7, 9, 10 and 13 continue to apply after these terms end.
      </p>

      <h2 id="changes">12. Changes to these terms</h2>
      <p>
        We’ll update the date at the top when these terms change, and tell signed-in users in the app or by email before material changes take effect. If you
        keep using sisma after a change takes effect, the new terms apply.
      </p>

      <h2 id="law">13. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Arizona, USA, and disputes go to the courts located in Arizona, except where the law of the
        country you live in gives you the right to bring a claim locally or protects you with mandatory consumer rules.
      </p>

      <h2 id="contact">14. Contact</h2>
      <address className={styles.address}>{L.operator}<br />{L.address}<br />{support}</address>
    </PrivacyChrome>
  );
}
