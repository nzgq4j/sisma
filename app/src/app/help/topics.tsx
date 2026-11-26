// Help centre topics, English: one page each at /help/<slug> (app/help/[topic]/page.tsx), listed on the hub
// (app/help/page.tsx). Translations with the same structure in ./i18n/<locale>.tsx (same topics in the same order, same
// anchors, links and screenshots; checked by help-i18n.test.ts), shown in the reader's language by HelpChrome.
// Screenshots: public/help/<name>-light.webp and -dark.webp (English) and public/help/<locale>/… , taken from the app by
// scripts/help-shots.mjs. Keep the wording in step with the app (i18n/messages/*.json): see the help rule in CLAUDE.md.
import type { ReactNode } from 'react';
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../privacy/privacy.module.css';
import s from './help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from './help-parts';

export { MAIL } from './help-parts';

export interface Topic { slug: string; icon: string; title: string; sub: string; body: ReactNode }
/** The help home's own text: the intro, the popular tasks (same order and links as English), headings and contact line. */
export interface Hub {
  lead: string; popularH: string; allH: string; contactQ: string; contactP: string;
  popular: [href: string, icon: string, label: string][];
}

export const HUB: Hub = {
  lead: 'Everything you need to use sisma on the website and in the Android app, with fixes for the most common problems.',
  popularH: 'Popular', allH: 'All topics', contactQ: 'Can’t find an answer?', contactP: 'Write to us and we’ll help.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Reset a forgotten password'],
    ['/help/felt', 'vibration', 'Report that you felt an earthquake'],
    ['/help/troubleshooting', 'notifications_off', 'Not getting alerts'],
    ['/help/troubleshooting', 'credit_card', 'Paid but still on the free plan'],
    ['/help/map#region-view', 'zoom_in_map', 'See the area around an earthquake'],
    ['/help/share', 'ios_share', 'Share an earthquake with text'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Getting started', sub: 'What sisma is and how it works',
    body: (
      <>
      <p>
        sisma shows earthquakes around the world as they are reported by four seismic agencies: <strong>USGS</strong> (United
        States), <strong>EMSC</strong> (Europe and the Mediterranean), <strong>GeoNet</strong> (New Zealand) and <strong>JMA</strong> (Japan).
        When several agencies report the same earthquake, sisma shows it once. The list refreshes on its own every two
        minutes, and you can pull down on the feed to refresh it straight away.
      </p>
      <p>You can use sisma in two ways, with the same account and the same sisma+ subscription:</p>
      <ul>
        <li><strong>On the web</strong> at <a href="https://sisma.io/app">sisma.io/app</a>, on any phone, tablet or computer.</li>
        <li><strong>In the Android app</strong> from Google Play, which adds the system share sheet, Google’s account picker and Google Play billing.</li>
      </ul>
      <p>The app has five tabs at the bottom (on a computer, in the menu on the left): <Ui>Feed</Ui>, <Ui>Map</Ui>, <Ui>Globe</Ui>, <Ui>Science</Ui> and <Ui>Me</Ui>.</p>
      <p>You don’t need an account to look at earthquakes. An account keeps your saved locations and settings, and is needed for sisma+ and alerts.</p>
      <Callout kind="warn"><p><strong>sisma is not an official warning service.</strong> Earthquake information can be delayed, revised or incomplete, and sisma does not give earthquake early warnings. In an emergency, always follow your local authorities.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'The feed', sub: 'Latest, nearest and strongest',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>The <Ui>Feed</Ui> tab lists recent earthquakes. Use the switch at the top to sort them:</p>
          <ul>
            <li><strong>Latest</strong>: newest first.</li>
            <li><strong>Nearest</strong>: closest to your location or your chosen saved location first.</li>
            <li><strong>Strongest</strong>: highest magnitude first.</li>
          </ul>
          <p>Each row shows the magnitude in a coloured badge, the place with the flag of the country it is in or near, how far and in which direction it was from a nearby town, how long ago it happened, how far it is from you and how deep it was. Keep scrolling and more earthquakes are added as you reach the end of the list.</p>
          <p>On a computer, the feed is on the <Ui>Overview</Ui> page, first in the menu on the left, with a map beside the list. Choose an earthquake in the list or on the map and the map zooms to it, with the names of nearby cities. It stays there when you close the earthquake; <Ui>Reset view</Ui> shows the whole world again. Choose a country or region in <Ui>Place</Ui> at the top right, or tap one under <Ui>Top regions</Ui>, and the map zooms to its earthquakes; <Ui>All places</Ui> shows the whole world again.</p>
          <h3>Magnitude colours</h3>
          <p>The same colours are used in the feed, on the map and on the globe:</p>
          <MagLegend />
          <Callout><p>Open <Ui>Filters</Ui> at the bottom of the feed to choose the time range and narrow the list. See <Link href="/help/map">Map and filters</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="The feed sorted by latest, with magnitude badges, places, times, distances and depths" caption="The feed, newest first" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Earthquake details', sub: 'Every number explained',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tap any earthquake to open its details:</p>
          <ul>
            <li><strong>Magnitude</strong> and its type (for example <em>mww</em>, the moment magnitude used for larger quakes).</li>
            <li><strong>Depth</strong>: how far below the surface it started. Shallow earthquakes are usually felt more strongly.</li>
            <li><strong>Date and time</strong> in your device’s time zone.</li>
            <li><strong>Distance</strong> from you, and the <strong>country</strong> (or “near” a country for offshore events).</li>
            <li><strong>Coordinates</strong> of the epicentre.</li>
            <li><strong>Review status</strong>: <em>Automatic</em> values come straight from instruments and often change in the first hour; <em>Reviewed</em> means a seismologist has checked them.</li>
            <li><strong>Source</strong>: which agency’s figures are shown.</li>
          </ul>
          <p>Below the details:</p>
          <ul>
            <li><Ui>Show region</Ui> opens a close-up map around the earthquake with nearby events and, where available, the felt map.</li>
            <li><Ui>Share</Ui> opens the share card (see <Link href="/help/share">Sharing</Link>).</li>
            <li>If people reported feeling it, you’ll see how many.</li>
          </ul>
          <Callout kind="note"><p><strong>Tsunami:</strong> when a tsunami warning centre (PTWC, NTWC or Japan’s JMA) issues an official message for an earthquake, its level is shown as issued, for example <strong>Tsunami warning</strong> or <strong>Tsunami advisory</strong>, with the centre, the time, the coasts it names and <Ui>Read the official message</Ui>. Warnings, threats, watches and advisories are coloured and add a wave badge to the earthquake’s pin and a coloured wave icon to its row; information statements and forecasts stay grey. A message marked <em>Cancelled</em> or <em>No longer in effect</em> has been withdrawn or has expired. Without an official message, a large earthquake under the sea shows <em>Large earthquake under the sea: check official tsunami information</em>. sisma relays these messages and is not a warning service: always follow local authorities.</p></Callout>
        </div>
        <Shot src="detail" alt="Earthquake details: magnitude, depth, date, time, distance, country, coordinates, review status, source, Show region and Share" caption="An earthquake’s details" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Map and filters', sub: 'Zoom, region view, filters',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>The <Ui>Map</Ui> tab shows recent earthquakes as pins coloured by magnitude, centred on your part of the world.</p>
          <ul>
            <li><strong>Move and zoom</strong> with your fingers or mouse, or with the <Ui>+</Ui> and <Ui>−</Ui> buttons. The third button resets the view.</li>
            <li><strong>My location</strong> (the fourth button) zooms to where you are now. The first time, sisma asks for access to your location. A ring round the dot marks your position when another place is chosen in <Ui>Me</Ui>; that choice stays as it is.</li>
            <li>Zoom in to a region and <strong>city names</strong> appear, in your language, to help you get your bearings. Larger cities come first, names keep clear of the earthquakes, and they give way to the street maps’ own names.</li>
            <li>Zoom in far enough and <strong>street maps</strong> from OpenStreetMap fade in, so you can see exactly where an event was.</li>
            <li><strong>Tap a pin</strong> to see a summary card, then <Ui>Details</Ui> for everything about it.</li>
          </ul>
        </div>
        <Shot src="map" alt="World map with earthquake pins coloured by magnitude" caption="The map" />
      </div>
      <h3 id="region-view">Region view</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Show region</Ui> on an earthquake opens a close-up about 800 km across around it, with a pulsing marker on the event and labels on nearby earthquakes. Tap <Ui>Back to world map</Ui> to return.</p>
          <p>The region view is also what opens when someone follows a link you shared.</p>
        </div>
        <Shot src="region" alt="Region view: a close-up around an earthquake with a pulsing marker and a summary card" caption="Region view" />
      </div>
      <h3>Filters, layers and legend</h3>
      <div className={s.pair}>
        <div>
          <p>Pull up the <Ui>Filters</Ui> panel at the bottom of the Feed, Map or Globe. Tap it once to open it halfway, again to open it fully, or drag it.</p>
          <ul>
            <li><strong>Time range</strong>: 24 hours, 7 days or 30 days. A full year needs sisma+.</li>
            <li><strong>Magnitude</strong> and <strong>Region</strong> (a country or ocean region) are sisma+ filters, marked with a lock on the free plan.</li>
            <li><strong>Place</strong>: show only earthquakes near one of your saved locations.</li>
            <li><Ui>Clear filters</Ui> puts everything back.</li>
          </ul>
          <p>Under <strong>Layers</strong> you can show tectonic <strong>plate boundaries</strong>. The panel also shows the magnitude legend.</p>
          <Callout><p>Choosing a region also zooms the map to it and turns the globe to face it.</p></Callout>
        </div>
        <Shot src="filters" alt="Filters panel open: time range, magnitude, region and place" caption="The filters panel" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: '3D globe', sub: 'Spin it, see depth',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>The <Ui>Globe</Ui> tab shows the same earthquakes on a 3D Earth. Drag to turn it and pinch or scroll to zoom. Tap a pin for its summary. <Ui>My location</Ui>, under the <Ui>−</Ui> button, turns the globe to where you are now and zooms in (the spin stops so you stay in view).</p>
          <p>Zoom in and <strong>city names</strong> appear in your language, as on the map, on the side of the globe facing you, clear of the earthquakes and the buttons.</p>
          <p>In the <Ui>Filters</Ui> panel’s layers:</p>
          <ul>
            <li><strong>Depth</strong> colours each earthquake by depth and draws a line down to where it started, so you can see deep earthquakes under subduction zones.</li>
            <li><strong>Plates</strong> shows plate boundaries.</li>
            <li><strong>Spin</strong> turns the globe slowly on its own.</li>
          </ul>
        </div>
        <Shot src="globe" alt="3D globe with earthquake pins around the Pacific" caption="The globe" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'I felt it', sub: 'Reports and felt maps',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>If you felt an earthquake, tell sisma. Reports help show where shaking was felt and how strongly.</p>
          <ol className={s.steps}>
            <li>Open the earthquake. For up to <strong>6 hours</strong> after it happened, you’ll see <Ui>I felt it</Ui>.</li>
            <li>Move the slider to how strong it felt, from <em>Not felt</em> to <em>Extreme</em>. The badge shows the matching intensity level (MMI).</li>
            <li>Optionally add a note, or tap <Ui>Add more detail</Ui> for where you were, how long it lasted, what moved and any damage.</li>
            <li>If <Ui>Show on the map</Ui> appears, leave it on to place your report on the map, or switch it off so it is only counted. It uses your device location or, if you haven’t shared it, the place chosen in <Ui>Me</Ui>, and appears only when that place is within 3,000 km of the earthquake.</li>
            <li>Tap <Ui>Send report</Ui>.</li>
          </ol>
          <p>Your report is stored <strong>without your name or account</strong>. On the map, its position is rounded to about 10 km.</p>
          <p>Reports appear in the region view (<Ui>Show region</Ui>) as small squares of about 10 km. Together with the USGS and EMSC reports below, each square is coloured by the average intensity of the reports in it.</p>
          <p>For earthquakes recorded by the USGS, the region view also shows the answers people gave to the USGS <strong>Did You Feel It?</strong> survey, as coloured squares of about 10 km, one colour per intensity level.</p>
          <p>For earthquakes recorded by the EMSC, it also includes felt reports sent through the EMSC websites and the LastQuake app, in the same squares. EMSC data is shared under the CC BY 4.0 licence.</p>
          <p>To show or hide all felt maps at once, tap the <Ui>Layers</Ui> button next to <Ui>Back to world map</Ui> and use the <Ui>Felt maps</Ui> switch. Your choice is kept on this device. In the earthquake’s <Ui>Details</Ui>, the felt legend gives the total number of reports and the highest intensity, with the intensity colour scale. Grey squares are areas from the automatic felt map where no report gives an intensity.</p>
          <h3>Felt maps</h3>
          <p>When many people open sisma right after an earthquake, that rush shows where it was probably felt. sisma turns it into an anonymous <strong>felt map</strong> in the region view. Positions are blurred on your device by up to 500 m, carry no account or device identifier, and are only shown for areas of about 10 km with at least 3 people. You can turn this off in <Ui>Me</Ui> → <Ui>Help map where quakes are felt</Ui>.</p>
        </div>
        <Shot src="felt" alt="What did you feel? sheet with an intensity slider, an optional note, the Show on the map switch and Send report" caption="Reporting what you felt" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Sharing an earthquake', sub: 'Image, text and alt text',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tap <Ui>Share</Ui> on an earthquake to make a share card: a picture with the map and the main details.</p>
          <p>The card’s map also shows <strong>city names</strong> around the earthquake, in your language, as in the region view, wherever they fit without covering the earthquakes. Far out at sea there may be none.</p>
          <p>Where people reported feeling the earthquake, the card’s map also shows it as in the region view: small squares coloured by intensity (grey where the intensity is unknown), with the intensity scale at the bottom right. The suggested image description then mentions them. If you’ve switched off <Ui>Felt maps</Ui> under <Ui>Layers</Ui> in the region view, the card leaves them out too.</p>
          <p>When a tsunami warning centre has issued an official message for the earthquake, the card shows its level and centre at the top left of the map, for example <strong>Tsunami warning · PTWC</strong>, coloured while a warning, threat, watch or advisory is in effect. The post text and the image description include it too.</p>
          <ul>
            <li><strong>Post text</strong> is filled in for you (magnitude, place, time, depth and a hashtag, with the link last), and you can edit it.</li>
            <li><strong>Image description (alt text)</strong> describes the picture for people using screen readers. It is filled in for you, and you can edit it.</li>
            <li><Ui>Share image</Ui> opens your phone’s share sheet (in the Android app and in browsers that support it). Where a browser can’t share pictures, or the picture couldn’t be made, <Ui>Share link</Ui> shares the post text with its link instead. <Ui>Save image</Ui> downloads the picture, and <Ui>Copy text</Ui> and <Ui>Copy alt text</Ui> copy either field.</li>
          </ul>
          <Callout><p>X, Facebook and Bluesky often drop the text that comes with a shared picture, and none of them take alt text this way. <strong>Share image also copies the text</strong>, so you can paste it into the post. Use <Ui>Copy alt text</Ui> and paste it into the app’s image description field. On iPhone, if the share menu doesn’t open straight away, tap <Ui>Share image</Ui> again: the text is already copied.</p></Callout>
        </div>
        <Shot src="share" alt="Share sheet with the share card preview, editable post text and image description" caption="The share sheet" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Your account', sub: 'Sign in, passwords, deleting',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Go to <Ui>Me</Ui> and tap <Ui>Sign in</Ui>. You can use Google or your email and a password.</p>
          <h3>Create an account with email</h3>
          <ol className={s.steps}>
            <li>Tap <Ui>Create an account</Ui> at the bottom of the sign-in sheet.</li>
            <li>Enter your email and a password: at least 8 characters, with letters and numbers. Passwords found in known data breaches are refused.</li>
            <li>Open the confirmation email we send you and tap the link. You are then signed in. Not there within a minute? Check your spam or junk folder.</li>
          </ol>
          <h3>Sign in with Google</h3>
          <p>Tap <Ui>Continue with Google</Ui>. In the Android app, choose your Google account from the list that appears. If your Google email already has a sisma account, Google is added to that same account.</p>
          <p>When you create an account, <Ui>Continue with Google</Ui> is at the top too: it creates the account straight away, with no password or confirmation email.</p>
        </div>
        <Shot src="signin" alt="Sign in sheet: Continue with Google, email and password, Forgot password and Create an account" caption="Signing in" />
      </div>

      <h3 id="password-reset">Forgot your password? Reset it</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>In <Ui>Me</Ui>, tap <Ui>Sign in</Ui> and type your email address.</li>
            <li>Tap <Ui>Forgot password?</Ui>. You’ll see <em>Check your email</em>.</li>
            <li>Open the email and tap the link. sisma opens and asks you to <em>Set a new password</em>.</li>
            <li>Enter the new password twice and tap <Ui>Save</Ui>. You’re signed in.</li>
          </ol>
          <Callout kind="note"><p>For your privacy, sisma always says it sent the link, even if no account uses that address. If nothing arrives within a few minutes, check your spam folder and make sure you typed the address you signed up with.</p></Callout>
        </div>
        <Shot src="forgot" alt="Check your email: we sent a link to reset the password" caption="After tapping Forgot password?" />
      </div>

      <h3>Change your password, or add one to a Google account</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>In <Ui>Me</Ui> → <Ui>Account</Ui>, tap <Ui>Set or change password</Ui>.</li>
            <li>Enter the new password twice and tap <Ui>Save</Ui>.</li>
          </ol>
          <p>If you signed up with Google, this adds a password so you can also sign in with your email. If sisma asks you to sign in again first, that’s a security check: sign out, sign back in and try again.</p>
        </div>
        <Shot src="password" alt="Set a new password sheet with new and confirm fields" caption="Setting a new password" />
      </div>

      <h3>Other account tasks</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Display name</strong>: <Ui>Me</Ui> → <Ui>Display name</Ui>. Leave it empty to show your email.</li>
            <li><strong>Sign out</strong>: <Ui>Me</Ui> → <Ui>Sign out</Ui>. Your saved locations stay in your account.</li>
            <li><strong>Change your email address</strong>: this isn’t possible in the app yet. Write to <a href={`mailto:${MAIL}`}>{MAIL}</a> from your current address.</li>
          </ul>
        </div>
        <Shot src="me" alt="Account section in Me: help and support, display name, email, password and sign out, with delete account in its own card outlined in red" caption="Account, at the bottom of Me" />
      </div>

      <h3 id="delete-account">Delete your account</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>If you have sisma+, cancel it first (see <Link href="/help/plus#cancel">Cancel sisma+</Link>). sisma won’t delete an account with a subscription that is still renewing.</li>
            <li>In <Ui>Me</Ui>, tap <Ui>Delete account</Ui>, then <Ui>Delete permanently</Ui>.</li>
          </ol>
          <p>This permanently removes your account, saved locations and alert settings. Felt reports you sent are kept without your name. Deleting the account doesn’t delete the Android app; uninstall it separately if you want to. Our <Link href="/privacy#delete">privacy policy</Link> explains what happens to your data.</p>
        </div>
        <Shot src="delete" alt="Delete your account? sheet with Delete permanently and Cancel" caption="Deleting an account" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Saved locations', sub: 'Places you care about',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Saved locations decide which earthquakes are “nearest” and which places your alerts watch.</p>
          <ul>
            <li><strong>My location</strong> uses your device’s position (your browser or phone asks for permission first).</li>
            <li><Ui>Add location</Ui> lets you search for a city or town and save it.</li>
            <li>Tap a location to make it the one used for distances. Tap <Ui>×</Ui> to remove it.</li>
            <li>When <strong>My location</strong> is chosen, sisma uses your position whenever your device can give it. If it can’t (location turned off or not allowed), or you chose a saved place, sisma uses that saved place: your default place, or the first one you saved.</li>
            <li>When you’re signed in, <strong>My location</strong> is also used for your alerts and tsunami alerts: sisma keeps your device’s last position, rounded to about 1 km, and uses it for 30 days after it was last updated.</li>
          </ul>
          <p>The free plan has <strong>1 saved location</strong>, and sisma+ has <strong>up to 10</strong>. Without an account, locations are kept on this device and move into your account when you sign in.</p>
        </div>
        <Shot src="addloc" alt="Add location sheet with a search box for a city or town" caption="Adding a location" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Trial, billing, cancelling',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma is free to use. sisma+ adds:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Feature</th><th>Free</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Live feed, map, globe, science</td><td>✓</td><td>✓</td></tr>
                <tr><td>Official tsunami alerts</td><td>✓</td><td>✓</td></tr>
                <tr><td>Earthquake history</td><td>30 days</td><td>Full history</td></tr>
                <tr><td>Saved locations</td><td>1</td><td>Up to 10</td></tr>
                <tr><td>Push alerts with your own rules</td><td>–</td><td>Up to 5 alerts</td></tr>
                <tr><td>Magnitude and region filters</td><td>–</td><td>✓</td></tr>
                <tr><td>Live earthquake data charts</td><td>–</td><td>✓</td></tr>
                <tr><td>Pacific Fire Ribbon</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Price: <strong>{usd(PRICES.yearly.usd)} a year</strong>, one plan. Google Play shows the price in your local currency. New subscribers get a <strong>{TRIAL_DAYS}-day free trial</strong>, once per account.</p>
        </div>
        <Shot src="paywall" alt={`sisma+ sheet with the features, the yearly price and Start ${TRIAL_DAYS}-day free trial`} caption="Choosing a plan" />
      </div>

      <h3>Subscribe</h3>
      <ul>
        <li><strong>On the website</strong>: <Ui>Me</Ui> → <Ui>Start {TRIAL_DAYS}-day free trial</Ui> (or <Ui>Subscribe</Ui>), then pay on Stripe’s secure checkout page. If you create an account first, checkout opens when you tap the link in the confirmation email. When you come back, sisma shows <em>Activating sisma+…</em> for a few seconds, then <em>Welcome to sisma+</em>.</li>
        <li><strong>In the Android app</strong>: the same button opens Google Play’s payment sheet, where you can pay with Google Pay, a card or other Google Play payment methods.</li>
      </ul>
      <p>You need to be signed in. Your subscription then works everywhere you sign in to that account, on the web and in the app.</p>

      <h3>Manage or switch plans</h3>
      <div className={s.pair}>
        <div>
          <p>Go to <Ui>Me</Ui> → <Ui>Manage subscription</Ui> to see your status, plan and next date.</p>
          <ul>
            <li><strong>Bought on the website</strong>: <Ui>Manage billing</Ui> opens Stripe’s page, where you can update your card, see invoices or cancel.</li>
            <li><strong>Bought in the Android app</strong>: <Ui>Manage in Google Play</Ui> opens your subscription in Google Play.</li>
          </ul>
          <p>If sisma has given your account sisma+ for free, your plan shows <Ui>Complimentary</Ui>. You don’t need a subscription, and you can cancel one you started without losing sisma+.</p>
        </div>
        <Shot src="subscription" alt="Subscription page: status, plan, renewal date and Manage in Google Play" caption="Your subscription" />
      </div>

      <h3 id="cancel">Cancel sisma+</h3>
      <ol className={s.steps}>
        <li>Open <Ui>Me</Ui> → <Ui>Manage subscription</Ui>.</li>
        <li>Tap <Ui>Manage billing</Ui> (website) or <Ui>Manage in Google Play</Ui> (app), and cancel there. In Google Play you can also go to <em>Payments &amp; subscriptions → Subscriptions</em>.</li>
      </ol>
      <p>You keep sisma+ until the end of the period you’ve paid for. The <Ui>Me</Ui> card then shows <em>Cancels on</em> and the date, and after that date you’re back on the free plan. Cancelling a free trial before it ends means you aren’t charged.</p>
      <Callout kind="note"><p>Uninstalling the app or deleting your sisma account does <strong>not</strong> cancel a Google Play subscription. Cancel it in Google Play.</p></Callout>

      <h3>Restore a purchase</h3>
      <p>On a new phone or after reinstalling the app, sign in to the same sisma account. If sisma+ doesn’t appear, open the sisma+ sheet and tap <Ui>Restore purchase</Ui>. This is in the Android app only, and finds the Google Play subscription on this device.</p>

      <h3>Refunds</h3>
      <p>Google Play purchases follow Google Play’s refund policies, so request a refund through Google Play. For website purchases, write to <a href={`mailto:${MAIL}`}>{MAIL}</a>. Our <Link href="/terms">terms of service</Link> explain the details.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Alerts', sub: 'Push notifications that match you',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>With sisma+, sisma sends a push notification when an earthquake matches one of your alerts.</p>
          <ol className={s.steps}>
            <li>Sign in and make sure you have sisma+.</li>
            <li>In <Ui>Me</Ui>, turn on <Ui>Push alerts</Ui>, or open <Ui>Alert rules</Ui> and turn on <em>Earthquake alerts</em>.</li>
            <li>Under <em>Deliver via</em>, tap <Ui>Turn on notifications on this device</Ui> and allow notifications when asked.</li>
            <li>Tap <Ui>Add an alert</Ui> and set it up (below). You can have up to 5.</li>
            <li>Tap <Ui>Send a test alert</Ui> to check this device receives them.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Alerts page with the on/off switch, your alerts (0 of 5), Add an alert and Deliver via" caption="The alerts page" />
      </div>
      <h3>Setting up an alert</h3>
      <ul>
        <li><strong>Name</strong>: for example <em>Near home</em>.</li>
        <li><strong>Minimum magnitude</strong>: you get alerts for this magnitude and anything stronger.</li>
        <li><strong>Watching</strong>: your saved places within a distance you choose (100, 250, 500 or 1,000 km), or anywhere in the world.</li>
        <li><strong>Other locations</strong>: up to 20 countries or regions, anywhere inside them.</li>
        <li><strong>Quiet hours</strong>: no alerts overnight, with the option to still let strong earthquakes (magnitude 6 or more) through.</li>
        <li>A chart shows how many earthquakes in the last 30 days would have triggered the alert, so you can tune it.</li>
      </ul>
      <p><strong>Watching</strong> also includes <strong>My location</strong> when your device shares its position: see <Link href="/help/locations">Saved locations</Link>.</p>
      <p>Alerts you received in the last 30 days are listed under <em>Alert history</em>.</p>
      <h3>Tsunami alerts</h3>
      <p>Tsunami alerts are free for everyone who is signed in. In <Ui>Me</Ui>, turn on <Ui>Tsunami alerts</Ui> and tap <Ui>Turn on notifications on this device</Ui>. You get a notification when an official tsunami warning, threat, watch or advisory is issued for an earthquake within 1,000 km of one of your saved places. Quiet hours don’t apply, and each level is sent once per earthquake. My location counts too, as for other alerts.</p>
      <Callout kind="note"><p><strong>iPhone and iPad:</strong> web notifications only work after you add sisma to the Home Screen (Share → Add to Home Screen) and open it from there. The first time you open sisma in the browser on an iPhone or iPad, a pop-up shows these steps; tap <Ui>Not now</Ui> to see it again in two weeks or <Ui>Got it</Ui> to hide it.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Settings', sub: 'Language, theme, units',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Find these in <Ui>Me</Ui>, below your locations:</p>
          <ul>
            <li><strong>Language</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français or Deutsch. You can also tap the language button at the top of any tab.</li>
            <li><strong>Appearance</strong>: follow your device (System), Light or Dark.</li>
            <li><strong>Units</strong>: kilometres or miles.</li>
            <li><strong>Map markers</strong>: pins with the magnitude written inside, or circles sized by magnitude. This is also where you’ll find the colour legend.</li>
            <li><strong>Help map where quakes are felt</strong>: turns the anonymous felt-map sharing on or off (see <Link href="/help/felt">I felt it</Link>).</li>
            <li><strong>Show introduction</strong> replays the welcome steps.</li>
          </ul>
          <p>When you’re signed in, your language and appearance are saved to your account.</p>
        </div>
        <Shot src="me_more" alt="Settings: language, appearance, units, map markers, felt map switch, introduction and data sources" caption="Settings in Me" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Science', sub: 'How earthquakes work',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>The <Ui>Science</Ui> tab has eight short illustrated guides, each with an animated diagram or a live chart: plate tectonics, fault types, seismic waves, magnitude and intensity, depth and aftershocks, tsunamis, how to prepare, and the Ring of Fire, with a live map of how many recent earthquakes struck around the Pacific.</p>
          <p>Tap the buttons under a diagram to switch views, and the pause button to stop the animation. The guides follow your language, like the rest of the app. Tap <Ui>Share</Ui> at the top of a guide to send it to someone, with its picture, a short summary and the link.</p>
          <p>Below the guides, <Ui>In Depth</Ui> has longer articles for when you want to go further: why earthquakes can’t be predicted, plate tectonics and faults, Earth’s interior and seismic waves, aftershocks, magnitude, deep earthquakes, volcanoes, Italy’s earthquakes and the 2004 tsunami that reached Phuket. Each opens with a picture of its subject under the title, lists its sources and answers common questions at the end. They’re in your language too; the list of sources stays in English.</p>
          <p>Under <Ui>Data</Ui>, <Ui>Earthquake data</Ui> (sisma+) charts the last 30 days of M4.5+ earthquakes worldwide from the USGS: how many happened, their magnitudes and depths, the regions where they struck, the energy released, and the number of M7+ earthquakes each year since 1900. Each chart has a short explanation; tap a bar to read its value. Without sisma+ you see the explanations and a button to start the free trial. Colours carry meaning: magnitudes use the map pin colours, depths the colours of the globe’s Depth mode, regions mostly on the Ring of Fire are highlighted, and bars above the average are coral.</p>
          <p><Ui>Pacific Fire Ribbon</Ui> (sisma+) unrolls the Ring of Fire into one long strip, from the southern tip of the Andes to New Zealand, and plots the last 24 hours, 7 days or 30 days of USGS earthquakes by their distance along the volcanic arcs (across) and their depth (down). Scroll sideways or zoom to move along it, pick a region to jump there, and tap a dot for the earthquake’s details. Dot colours show depth and dot size shows magnitude. It checks for new earthquakes once an hour and says when the data was published. Triangles above the line are volcanoes from the Smithsonian catalogue, coloured by this week’s Smithsonian / USGS volcanic activity report (red: continuing eruption, orange: new eruptive activity, amber: new unrest); tap one for its details and the report. A white triangle only means the volcano isn’t in this week’s report, which doesn’t list every active volcano. <Ui>Show</Ui> turns earthquakes, volcanoes or terrain on and off. Terrain comes from NOAA’s ETOPO 2022 relief model: brown is the highest ground near the route and blue the deepest sea floor within 400 km, where the ocean trenches show. <Ui>Exaggerated ×10</Ui> stretches heights so mountains and trenches are visible; <Ui>True scale</Ui> uses the same scale as earthquake depths. Earthquake depths are never exaggerated. <Ui>3D</Ui> shows a stretch of the ribbon as a block you can turn: terrain on top, earthquakes at their depth below, all at the same scale. Choose <Ui>Angled</Ui>, <Ui>Cross-section</Ui> (looking along the route) or <Ui>From above</Ui>, use the arrows to move along the route, and tap a dot or triangle for details. Terrain in 3D is averaged over 10 km squares, so it looks smoother than in the profile. <Ui>Share</Ui> makes a picture of the whole ribbon for the chosen period, with a post text and an image description you can edit before sharing.</p>
        </div>
        <Shot src="science" alt="Seismic waves article with an animated diagram of P waves" caption="A science guide" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Troubleshooting', sub: 'Fixes for common problems',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Location and data</p>
        <Faq q="“Nearest” is empty, or my location can’t be found">
          <p>sisma needs permission to use your location, or a saved location.</p>
          <ul>
            <li><strong>Browser</strong>: tap the icon next to the web address, set <em>Location</em> to <em>Allow</em>, then reload.</li>
            <li><strong>Android app</strong>: Settings → Apps → sisma → Permissions → Location → <em>Allow only while using the app</em>.</li>
            <li>Or add a place in <Ui>Me</Ui> → <Ui>Add location</Ui>.</li>
          </ul>
        </Faq>
        <Faq q="An earthquake is missing, or its magnitude changed">
          <p>Agencies first publish automatic figures, then revise them, usually within the first hour. The magnitude, depth and place can all change, and some small events are deleted. Different agencies can also report slightly different values; sisma shows the regional agency’s figures where it has them (JMA in Japan, GeoNet in New Zealand), otherwise USGS, then EMSC. Very small earthquakes (below about magnitude 2.5 outside Japan and New Zealand) aren’t included.</p>
        </Faq>
        <Faq q="The times look wrong">
          <p>Times are shown in your device’s time zone. Check your device’s date, time and time zone settings.</p>
        </Faq>
        <Faq q="The map is blank when I zoom right in">
          <p>Street-level maps come from OpenStreetMap and need an internet connection. If they don’t load, zoom out a little; the earthquake pins still work.</p>
        </Faq>
        <Faq q="The app says I’m offline">
          <p>sisma needs a connection to load earthquakes. Check Wi-Fi or mobile data, then reopen the app.</p>
        </Faq>

        <p className={s.faqGroup}>Signing in</p>
        <Faq q="“Email or password is incorrect”">
          <p>Check for typos, then use <Link href="/help/account#password-reset">Forgot password?</Link>. If you created your account with Google, use <Ui>Continue with Google</Ui>, or add a password in <Ui>Me</Ui> → <Ui>Set or change password</Ui> while signed in with Google.</p>
        </Faq>
        <Faq q="“Please confirm your email first”">
          <p>Open the confirmation email from sisma and tap the link, then sign in. Can’t find it? Check your spam folder. If it still isn’t there, write to <a href={`mailto:${MAIL}`}>{MAIL}</a> from that address.</p>
        </Faq>
        <Faq q="The reset or confirmation email didn’t arrive">
          <p>Wait a few minutes and check your spam or promotions folder. Make sure you typed the address you signed up with. For your privacy, sisma says it sent a reset link even when no account uses that address.</p>
        </Faq>
        <Faq q="Google sign-in doesn’t work">
          <p>In the Android app, make sure you’re signed in to a Google account on the phone (Settings → Passwords &amp; accounts) and that Google Play services are up to date. On the web, allow pop-ups and third-party sign-in for sisma.io. You can always sign in with email instead.</p>
        </Faq>
        <Faq q="“For your security, sign out and sign in again”">
          <p>Changing a password needs a recent sign-in. Tap <Ui>Sign out</Ui>, sign back in, then change it.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ and billing</p>
        <Faq q="I paid, but I still see the free plan">
          <ul>
            <li>Wait a minute, then close and reopen sisma. Activation is usually immediate, but can take a few minutes.</li>
            <li>Make sure you’re signed in to the account you subscribed with.</li>
            <li>Android app: open the sisma+ sheet and tap <Ui>Restore purchase</Ui>.</li>
            <li>Still not working? Write to <a href={`mailto:${MAIL}`}>{MAIL}</a> with your account email and, for Google Play, the order number (GPA.…) from your receipt.</li>
          </ul>
        </Faq>
        <Faq q="“This Google Play subscription belongs to another sisma account”">
          <p>The subscription on this phone was bought while signed in to a different sisma account. Sign out and sign in to that account.</p>
        </Faq>
        <Faq q="No free trial was offered">
          <p>The trial is for accounts that have never subscribed. In the Android app, Google Play also allows one trial per Google account, even across different sisma accounts.</p>
        </Faq>
        <Faq q="“Subscriptions in the app aren’t available yet” or “Google Play billing isn’t available on this device”">
          <p>Update sisma and the Google Play Store app, and make sure you’re signed in to Google Play. Some devices without Google Play can’t buy in the app. Subscribe on <a href="https://sisma.io/app/me">sisma.io</a> instead, and sign in to the same account in the app.</p>
        </Faq>
        <Faq q="I can’t delete my account">
          <p>Cancel sisma+ first. Once it’s set to end, you can delete the account. See <Link href="/help/account#delete-account">Delete your account</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Alerts and notifications</p>
        <Faq q="I’m not getting alerts">
          <ol>
            <li>Check you have sisma+ and are signed in.</li>
            <li>In <Ui>Me</Ui> → <Ui>Alert rules</Ui>, check that alerts are on and that at least one alert is on and has places or areas.</li>
            <li>Under <em>Deliver via</em>, check this device is turned on, then tap <Ui>Send a test alert</Ui>.</li>
            <li>Android: Settings → Apps → sisma → Notifications must be allowed. Battery-saving settings can delay notifications; set sisma’s battery use to <em>Unrestricted</em>.</li>
            <li>Browser: notifications must be allowed for sisma.io. On iPhone and iPad, open sisma from the Home Screen.</li>
            <li>Quiet hours hold back alerts at night unless you let strong earthquakes through.</li>
          </ol>
        </Faq>
        <Faq q="I get too many alerts">
          <p>Raise the minimum magnitude, reduce the distance, remove broad regions, or set quiet hours. The 30-day chart in each alert shows how often it would have fired.</p>
        </Faq>

        <p className={s.faqGroup}>Sharing and reports</p>
        <Faq q="There’s no “Share image” button">
          <p>Your browser can’t share files. Use <Ui>Save image</Ui> and <Ui>Copy text</Ui>, then post them yourself. In the Android app, update sisma to get the system share sheet.</p>
        </Faq>
        <Faq q="The text didn’t appear in my post">
          <p>Many apps drop text shared with an image. sisma copied it when you tapped <Ui>Share image</Ui>, so paste it into the post.</p>
        </Faq>
        <Faq q="There’s no “I felt it” button">
          <p>Reports are open for 6 hours after an earthquake. After that the button disappears.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Contact support', sub: 'Still stuck? Write to us',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Still need help?</strong> Write to us and include your account email, your device and browser or app version, and what you tried. A screenshot helps.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Please don’t send passwords or full card numbers. We will never ask for them.</p>
      </>
    ),
  },
];

export const topicBySlug = (slug: string) => TOPICS.find(t => t.slug === slug) ?? null;
