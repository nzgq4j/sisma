'use client';
// Me → Administration → Admin guide: how the administration features work, for the sisma team only. English (the
// team's working language), shown to administrators only, and kept out of search like every page under /app/me
// (noindex in app/app/me/layout.tsx and the X-Robots-Tag header). Keep it in step with app/me/admin, components/admin,
// lib/bluesky.ts, lib/bluesky-discover.ts, lib/promo.ts, lib/library-posts.ts and docs/bluesky-setup.md.
import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';
import { useIsAdmin } from '@/components/admin/LibraryBluesky';
import { Callout, Ui } from '@/app/help/help-parts';
import help from '@/app/help/help.module.css';
import me from '../../me.module.css';
import sub from '../../subscription/subscription.module.css';

export default function AdminGuidePage() {
  const { m } = useT();
  const admin = useIsAdmin();
  const back = <Link href="/app/me/admin" className={sub.back}><span className="ms" aria-hidden="true">arrow_back</span>{m.admin.title}</Link>;
  if (!admin) return <div className={me.page}>{back}<h1 className={sub.h1}>{m.admin.guide_link}</h1><p className={me.hint}>{m.admin.forbidden}</p></div>;
  return (
    <div className={me.page}>
      {back}
      <h1 className={sub.h1} lang="en">Admin guide</h1>
      <div className={help.doc} lang="en">
        <p>Everything in <Ui>Me → Administration</Ui> posts or acts as sisma’s Bluesky account. Only accounts marked as administrators see the page, and the server checks again on every action. Nothing is posted until you switch a feed on or press <Ui>Post now</Ui>.</p>
        <p>Sections: <a href="#connect">Bluesky account</a> · <a href="#quakes">Automatic earthquake posts</a> · <a href="#indepth">In Depth on Bluesky</a> · <a href="#playstore">Play Store posts</a> · <a href="#indepthposts">In Depth posts</a> · <a href="#discover">Discover</a> · <a href="#lists">Lists</a></p>

        <h2 id="connect">Bluesky account</h2>
        <ol>
          <li>In Bluesky, create an app password: <Ui>Settings</Ui> → <Ui>Privacy and security</Ui> → <Ui>App passwords</Ui>.</li>
          <li>On the admin page, under <Ui>Sign in to Bluesky</Ui>, enter the handle (or email) and the app password, then <Ui>Sign in</Ui>. Use <Ui>Account on another server</Ui> only if the account isn’t on bsky.social.</li>
          <li>The page then shows <Ui>Posting as @handle</Ui> and when it was signed in.</li>
        </ol>
        <ul>
          <li>The password is used once and never stored. sisma keeps only an encrypted session, which the server renews by itself.</li>
          <li><Ui>Check connection</Ui> asks Bluesky which account the session belongs to. <Ui>Sign out</Ui> ends the session on Bluesky too.</li>
          <li>If the session stops working (for example, the app password was deleted), a red message asks you to sign in again. Until then, posts use the backup account set in Vercel, if there is one.</li>
        </ul>
        <Callout kind="warn"><p>Use an app password, not the main password. Accounts with two-step sign-in refuse the main password here.</p></Callout>

        <h2 id="quakes">Automatic earthquake posts</h2>
        <p><Ui>Post automatically</Ui> turns the feed on or off. <Ui>Minimum magnitude</Ui> sets the threshold, from M4.5+ to M7.5+.</p>
        <p>When it’s on, a job that runs every minute posts each earthquake that:</p>
        <ul>
          <li>is at or above the minimum magnitude;</li>
          <li>happened in the last 30 minutes (switching on never posts a backlog);</li>
          <li>hasn’t been posted yet, including the same quake reported by another agency within 90 seconds and 100 km.</li>
        </ul>
        <p>Earthquakes with an official tsunami report (PTWC, NTWC or JMA) are always posted, whatever the minimum magnitude, and before the others. Each new tsunami report for an event (a new level, or a cancellation) also gets a post of its own: the level and centre, the earthquake, a link to the official message, the region view when the earthquake is in the feeds, #tsunami, and the card with the tsunami label. A centre often issues its message before the earthquake reaches the feeds, so the post waits for the earthquake for up to 15 minutes from the message; if it still hasn’t appeared, the card is drawn from the message’s own position, magnitude and time (depth shown as a dash, the centre as the source) and the post has no region link. Repeated bulletins at the same level don’t post again, and reports more than 3 hours old when first seen are not posted. These posts show in the log with the level before the place.</p>
        <p>At most 2 posts go out per minute, largest first. Each post has the earthquake’s map card with an image description (where people felt it, the map also shows the felt layers and the description names them), the magnitude and place, time (UTC) and depth, the official tsunami level and centre when a tsunami warning centre has issued a message for the earthquake (for example “Tsunami warning · PTWC”, also shown at the top left of the card’s map, with #tsunami while a warning, threat, watch or advisory is in effect; for a large earthquake under the sea without one, a line pointing to official tsunami information), a link to the region view, hashtags, and “not an official warning service”. If the card isn’t ready, the post waits up to 15 minutes, then goes out as text only.</p>
        <p><Ui>Last 24 hours (M4.5+)</Ui> lists recent earthquakes: <Ui>Posted</Ui> marks those already on Bluesky, <Ui>Next to post</Ui> the ones the feed will take. Tap one to see the exact card, text and image description, and <Ui>Post now</Ui> to post it by hand.</p>
        <p><Ui>Posts</Ui> is the log, with each post’s time, whether it was automatic or by hand, its status and a link. A failed post shows Bluesky’s error and is not retried automatically; while the earthquake is still in the 24-hour list above, open it and use <Ui>Post now</Ui> to try again.</p>

        <h2 id="indepth">In Depth on Bluesky</h2>
        <ol>
          <li>Under <Ui>In Depth on Bluesky</Ui>, tap <Ui>Article</Ui> and choose an article. The editor opens below.</li>
          <li>Check the card, the text (title, opening, link and hashtags) and the image description. Edit either one if you want; the counts show the limits (300 characters for the text, 2,000 for the description), and <Ui>Post now</Ui> stays off while either is over.</li>
          <li><Ui>Reset</Ui> brings back the suggested text and description. <Ui>Post now</Ui> publishes it with the card.</li>
        </ol>
        <p>On each In Depth article, administrators also see a Bluesky button next to <Ui>Share</Ui> that opens the same editor. Posts are in English, and the suggested text ends with the article’s hashtags plus #geosky and #sciencesky. Links and #hashtags in your text become clickable. These posts aren’t logged, so posting an article twice makes two posts.</p>

        <h2 id="playstore">Play Store posts</h2>
        <p>Ten posts about the Android app, each written in all 10 languages, with that language’s Play Store picture, an image description and a link to the Play listing in that language: 100 combinations in all.</p>
        <ul>
          <li><Ui>Post daily</Ui>: one post a day at a random time, a random post and language not yet posted this round, never in the same language or the same post as the one before. Switching it on schedules the first post later the same day.</li>
          <li><Ui>Next post</Ui>: when the next automatic post is due.</li>
          <li><Ui>This round</Ui>: how many of the 100 have been posted. After all 100, a new round starts.</li>
          <li><Ui>Post now</Ui>: leave <Ui>Post</Ui> and <Ui>Language</Ui> on <Ui>Random</Ui> for the next unused combination, or choose both to see the picture, text and image description first. A combination already posted this round is marked; posting it again repeats it.</li>
        </ul>
        <Callout kind="note"><p>A post made with <Ui>Post now</Ui> counts as that day’s post: if the automatic one was still due today, it moves to tomorrow. A post that fails stays unused and can come up again.</p></Callout>

        <h2 id="indepthposts">In Depth posts</h2>
        <p>Every In Depth article in all 10 languages, each with its title, standfirst and hashtags in that language plus #geosky and #sciencesky (the Bluesky science feeds), the share card in that language with an image description, and a link that opens the article in that language. Ten articles make 100 combinations; a new article joins the current round.</p>
        <ul>
          <li><Ui>Post twice a day</Ui>: one post in each half of the day (00:00–12:00 and 12:00–24:00 UTC) at a random time, a random article and language not yet posted this round, never in the same language or about the same article as the one before. Switching it on schedules the first post later in the current half of the day.</li>
          <li><Ui>Next post</Ui>: when the next automatic post is due.</li>
          <li><Ui>This round</Ui>: how many combinations have been posted. When all of them have been posted, a new round starts.</li>
          <li><Ui>Post now</Ui>: leave <Ui>Article</Ui> and <Ui>Language</Ui> on <Ui>Random</Ui> for an unused combination, or choose both to see the card, text and image description first. A combination already posted this round is marked; posting it again repeats it.</li>
        </ul>
        <Callout kind="note"><p>A post made with <Ui>Post now</Ui> counts as the post for that half of the day: if the automatic one was still due in the same half, it moves to the next half. A post that fails stays unused and can come up again.</p></Callout>

        <h2 id="discover">Discover</h2>
        <p>Finds geoscience posts by other people on Bluesky, using sisma’s signed-in account, so you can read them and support them by hand. Nothing happens until you tap a button, and every button can be tapped again to undo it.</p>
        <ul>
          <li><Ui>Search terms</Ui>: the hashtags (for example #geosky, #earthquake) and words (for example seismic) to look for, up to 20. Add or remove them, then <Ui>Save terms</Ui>. Each term is searched on its own; a short word such as fault also finds posts that aren’t about geology, so remove any that bring in too much else.</li>
          <li><Ui>Search now</Ui>: up to 25 of the newest posts for each term, combined into one list of up to 100, newest first. sisma’s own posts and posts labelled as adult or graphic content are left out. Each post shows who wrote it, when, its text and first image or link, its likes, reposts and replies, and which terms found it.</li>
          <li><Ui>Search again</Ui> replaces the list with a fresh search (the time of the search is shown above the list); <Ui>Clear results</Ui> empties it. Saving new terms also clears the list, since it no longer matches them.</li>
          <li><Ui>Like</Ui>, <Ui>Repost</Ui> and <Ui>Follow</Ui> act as sisma’s account straight away and show <Ui>Liked</Ui>, <Ui>Reposted</Ui> or <Ui>Following</Ui>; tap again to undo. The arrow opens the post on Bluesky.</li>
        </ul>
        <Callout kind="note"><p>A repost shows the post to everyone who follows sisma, and a follow is public. Read the whole post, and open it on Bluesky to see its replies and context, before reposting. Liking or following large numbers of accounts quickly can look like spam to Bluesky.</p></Callout>

        <h2 id="lists">Lists</h2>
        <p><Ui>Last 24 hours (M4.5+)</Ui>, <Ui>Posts</Ui>, <Ui>Recent Play Store posts</Ui> and <Ui>Recent In Depth posts</Ui> start closed, with the number of items on the right. Tap a header to open or close the list.</p>

        <h2>Good practice</h2>
        <ul>
          <li>After signing in, use <Ui>Check connection</Ui> before switching a feed on.</li>
          <li>Preview before posting by hand: what you see is exactly what is published.</li>
          <li>Keep the “not an official warning service” line in earthquake posts; it’s part of every card.</li>
        </ul>
      </div>
    </div>
  );
}
