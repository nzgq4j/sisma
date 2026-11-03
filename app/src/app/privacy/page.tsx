import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { PrivacyChrome } from './PrivacyChrome';
import styles from './privacy.module.css';

// Privacy policy (English only, like the science articles; the page chrome is translated).
// Keep it in step with what the code does: update this page whenever data collection, storage or a provider changes.
// The "Deleting your account" section (#delete) is the account-deletion URL for Google Play.
export const metadata: Metadata = {
  title: 'Privacy policy — sisma',
  description: 'What personal data sisma handles, why, which providers process it, and how to delete your account.',
  alternates: { canonical: '/privacy' },
};

const L = SITE.legal;
const mail = <a href={`mailto:${L.privacyEmail}`}>{L.privacyEmail}</a>;

export default function PrivacyPage() {
  return (
    <PrivacyChrome updated={L.policyUpdated}>
      <section className={styles.summary} aria-label="Summary">
        <h2>The short version</h2>
        <ul>
          <li>You can use sisma without an account.</li>
          <li>We never store your exact location. With location allowed, the open app may share an approximate position — blurred by up to 500 m, with no account, device or IP identifier — to build anonymous felt maps. You can turn this off in Me.</li>
          <li>Felt reports keep only an area of about 10 km and are not linked to you.</li>
          <li>If you create an account, we store your email address and the settings you choose, until you delete the account.</li>
          <li>No ads, no advertising or analytics trackers, and we don’t sell or share personal data for advertising.</li>
        </ul>
      </section>

      <h2 id="who">1. Who we are</h2>
      <p>
        sisma — the website sisma.io, the web app at sisma.io/app and the sisma Android app — is operated by {L.operator}, {L.entity} (“we”, “us”).
        We are responsible for the personal data described here. Questions and requests: {mail}, or by post to {L.address}.
      </p>

      <h2 id="collect">2. What we collect and why</h2>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Data</th><th>When</th><th>Why</th><th>How long</th></tr></thead>
          <tbody>
            <tr><td><strong>Email address</strong></td><td>You create an account (with an emailed sign-in link, a password, or Google). Passwords are stored only as a secure hash by our sign-in provider; we can’t see them</td><td>To sign you in and contact you about your account</td><td>Until you delete your account</td></tr>
            <tr><td><strong>Google profile</strong> (name, email address, profile picture link)</td><td>You choose “Continue with Google”</td><td>To sign you in; your Google name becomes your display name, which you can change</td><td>Until you delete your account. Google never shares your password with us</td></tr>
            <tr><td><strong>Display name</strong>, language, appearance setting</td><td>You set them in Me</td><td>To show your account and keep your settings on every device</td><td>Until you change them or delete your account</td></tr>
            <tr><td><strong>Saved places</strong> (name, region, country, coordinates of the place) and your default place</td><td>You save a place while signed in</td><td>To show the earthquakes nearest to the places you care about</td><td>Until you remove them or delete your account</td></tr>
            <tr><td><strong>Alert settings</strong> (on/off, minimum magnitude, distance)</td><td>You change them (sisma+)</td><td>To send the alerts you asked for</td><td>Until you delete your account</td></tr>
            <tr><td><strong>Plan and subscription status</strong>, and the customer/subscription IDs from Stripe or Google Play</td><td>You start a trial or subscription</td><td>To provide sisma+</td><td>Until you delete your account (Stripe and Google Play keep their own payment records as tax law requires)</td></tr>
            <tr><td><strong>Felt reports</strong>: the earthquake, how strong it felt, your optional answers and note (up to 500 characters), app language, and — only if you allowed location — your position rounded to about 10 km</td><td>You tap “I felt it” and send a report</td><td>To show, in aggregate, where and how strongly an earthquake was felt</td><td>Kept as an anonymous record. Reports are <em>not</em> linked to your account, name or email, so please don’t write personal details in the note</td></tr>
            <tr><td><strong>Approximate position for felt maps</strong>: a point up to 500 m from where you are (blurred on your device before it is sent) and the time — nothing else</td><td>While the app is open and you have allowed location, about once a minute, unless you turn it off in Me</td><td>To map, from the rush of app use after an earthquake, where it was probably felt. Only areas of about 10 km with at least 3 people are ever shown</td><td>Deleted after 7 days. Not linked to your account, device or IP address; never shared or used for anything else</td></tr>
            <tr><td><strong>Push notification token</strong> (Android app)</td><td>When push alerts are available and you turn them on</td><td>To deliver your alerts to your phone</td><td>Until you turn alerts off, uninstall, or delete your account</td></tr>
            <tr><td><strong>Technical logs</strong>: IP address, browser/device type, the page or address requested, time</td><td>Whenever you use sisma</td><td>To run the service securely and fix problems</td><td>Kept by our hosting and database providers for a limited period (typically days to a few weeks)</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Your location</h3>
      <p>
        With your permission, sisma reads your device’s location to centre the map and find the nearest earthquakes. Your exact location is not stored in
        our database. For automatic felt maps, the open app may send an approximate position (see the table above); you can switch this off in Me →
        “Help map where quakes are felt”. To calculate distances, the app sends your coordinates to our server together with each earthquake-data request; the server uses them for that
        calculation only, but our hosting provider’s request logs may briefly contain them (see “Technical logs”). You can use sisma without location by
        saving a place instead, and you can withdraw permission at any time in your browser or phone settings.
      </p>
      <h3>Place search</h3>
      <p>
        When you search for a place, the text you type goes to our server, which asks the OpenStreetMap Foundation’s Nominatim service and returns the results.
        Your IP address is not passed on. Search results are cached for up to a week.
      </p>
      <h3>Payments</h3>
      <p>
        On the website, payments are handled by Stripe; in the Android app, by Google Play. They process your payment details under their own privacy
        policies. We never receive your full card details — only whether your subscription is active and the identifiers needed to keep it in sync.
      </p>
      <h3>Legal bases (EEA and UK)</h3>
      <p>
        We process account, saved-place, alert and subscription data to provide the service you asked for (contract); felt reports, location use, felt-map positions and push
        notifications on the basis of your consent, which you can withdraw at any time; and technical logs for our legitimate interest in running a secure,
        reliable service.
      </p>

      <h2 id="device">3. Stored on your device</h2>
      <p>
        sisma keeps a few items in your browser’s or phone’s local storage so it works without an account: your language, appearance, units and felt-map settings, whether
        you’ve seen the introduction (and the launch screen this session), places you saved as a guest, the location you chose, the felt reports you sent from
        this device (so the app can show them), your preparedness checklist, and — when signed in — your sign-in session. These stay on your device; we use
        no advertising or analytics cookies. Clearing the site’s data in your browser, or uninstalling the app, removes them.
      </p>

      <h2 id="providers">4. Service providers</h2>
      <p>We use these companies to run sisma. They process data only on our instructions or, where stated, as independent controllers under their own policies.</p>
      <ul>
        <li><strong>Vercel Inc.</strong> (USA) — hosts the website, the app and our server functions.</li>
        <li><strong>Supabase Inc.</strong> (database and sign-in; servers in the eastern United States).</li>
        <li><strong>Resend</strong> — sends sign-in and account emails.</li>
        <li><strong>Stripe</strong> — website payments (independent controller for payment data).</li>
        <li><strong>Google</strong> — sign-in with Google (if you choose it), Google Play billing and Firebase Cloud Messaging in the Android app; Google Fonts delivers the icon font, so your browser contacts Google’s servers, which receive your IP address.</li>
        <li><strong>OpenStreetMap Foundation</strong> — place search (receives the search text from our server, not your IP address).</li>
      </ul>
      <p>
        Earthquake data comes from public feeds of USGS, EMSC, GeoNet and the Japan Meteorological Agency. Our server fetches them; no personal data is sent to them.
      </p>

      <h2 id="transfers">5. International transfers</h2>
      <p>
        Our providers are based in, or store data in, the United States. Where the law requires, transfers rely on appropriate safeguards such as the
        European Commission’s Standard Contractual Clauses or the EU–US Data Privacy Framework.
      </p>

      <h2 id="sharing">6. Sharing</h2>
      <p>
        We don’t sell personal data and don’t share it for advertising. We share it only with the providers above, when the law requires it, or with a
        successor if sisma is sold or merged (and then under this policy).
      </p>

      <h2 id="rights">7. Your rights</h2>
      <p>
        Depending on where you live, you can ask to access, correct, export or delete your personal data, to restrict or object to its use, and to withdraw
        consent. Most of this you can do yourself in Me (edit your name, places and settings, or delete the account). For anything else, email {mail}; we
        answer within 30 days. You may also complain to your local data protection authority. Residents of California: we do not sell or share personal
        information as defined by the CCPA.
      </p>

      <h2 id="delete">8. Deleting your account</h2>
      <ol>
        <li>Open <a href="/app/me">sisma.io/app/me</a> (or Me in the app) and sign in.</li>
        <li>If you have an active sisma+ subscription, cancel it first: on Android in Google Play → Payments &amp; subscriptions; for a website subscription, email {mail}.</li>
        <li>Choose <strong>Account → Delete account → Delete permanently</strong>.</li>
      </ol>
      <p>
        This immediately deletes your account, email address, display name, saved places, alert settings and notification tokens. Felt reports were never
        linked to your account and remain as anonymous records. Stripe and Google Play keep their own payment records as tax law requires. Can’t sign in?
        Email {mail} from your account’s address and we’ll delete it within 30 days. Uninstalling the app does not delete your account.
      </p>

      <h2 id="children">9. Children</h2>
      <p>sisma is not directed at children under 13 (under 16 in the EEA and UK), and we don’t knowingly collect their personal data. If you believe a child has created an account, contact us and we’ll delete it.</p>

      <h2 id="security">10. Security</h2>
      <p>All traffic is encrypted (HTTPS). Database access is restricted so each account can read and change only its own rows, secret keys are kept on the server, and we collect as little as we can.</p>

      <h2 id="warnings">11. Not an official warning service</h2>
      <p>sisma shows data from public sources and is not an official earthquake or tsunami warning service. In an emergency, always follow your local civil protection authority.</p>

      <h2 id="changes">12. Changes</h2>
      <p>We’ll update the date at the top when this policy changes, and tell signed-in users in the app or by email before material changes take effect.</p>

      <h2 id="contact">13. Contact</h2>
      <address className={styles.address}>{L.operator}<br />{L.address}<br />{mail}</address>
    </PrivacyChrome>
  );
}
