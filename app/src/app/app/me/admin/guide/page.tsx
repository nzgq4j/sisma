'use client';
// Me → Administration → Admin guide: how the administration features work, for the sisma team only. English (the
// team's working language), shown to administrators only, and kept out of search like every page under /app/me
// (noindex in app/app/me/layout.tsx and the X-Robots-Tag header). Keep it in step with app/me/admin, components/admin,
// lib/bluesky.ts, lib/promo.ts and docs/bluesky-setup.md.
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
        <p>Everything in <Ui>Me → Administration</Ui> posts to sisma’s Bluesky account. Only accounts marked as administrators see the page, and the server checks again on every action. Nothing is posted until you switch a feed on or press <Ui>Post now</Ui>.</p>
        <p>Sections: <a href="#connect">Bluesky account</a> · <a href="#quakes">Automatic earthquake posts</a> · <a href="#indepth">In Depth on Bluesky</a> · <a href="#playstore">Play Store posts</a> · <a href="#lists">Lists</a></p>

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
        <p>At most 2 posts go out per minute, largest first. Each post has the earthquake’s map card with an image description, the magnitude and place, time (UTC) and depth, a tsunami line when the agency reports one, a link to the region view, hashtags, and “not an official warning service”. If the card isn’t ready, the post waits up to 15 minutes, then goes out as text only.</p>
        <p><Ui>Last 24 hours (M4.5+)</Ui> lists recent earthquakes: <Ui>Posted</Ui> marks those already on Bluesky, <Ui>Next to post</Ui> the ones the feed will take. Tap one to see the exact card, text and image description, and <Ui>Post now</Ui> to post it by hand.</p>
        <p><Ui>Posts</Ui> is the log, with each post’s time, whether it was automatic or by hand, its status and a link. A failed post shows Bluesky’s error and is not retried automatically; while the earthquake is still in the 24-hour list above, open it and use <Ui>Post now</Ui> to try again.</p>

        <h2 id="indepth">In Depth on Bluesky</h2>
        <ol>
          <li>Under <Ui>In Depth on Bluesky</Ui>, tap <Ui>Article</Ui> and choose an article. The editor opens below.</li>
          <li>Check the card, the text (title, opening, link and hashtags) and the image description. Edit either one if you want; the counts show the limits (300 characters for the text, 2,000 for the description), and <Ui>Post now</Ui> stays off while either is over.</li>
          <li><Ui>Reset</Ui> brings back the suggested text and description. <Ui>Post now</Ui> publishes it with the card.</li>
        </ol>
        <p>On each In Depth article, administrators also see a Bluesky button next to <Ui>Share</Ui> that opens the same editor. Posts are in English. Links and #hashtags in your text become clickable. These posts aren’t logged, so posting an article twice makes two posts.</p>

        <h2 id="playstore">Play Store posts</h2>
        <p>Ten posts about the Android app, each written in all 10 languages, with that language’s Play Store picture, an image description and a link to the Play listing in that language: 100 combinations in all.</p>
        <ul>
          <li><Ui>Post daily</Ui>: one post a day at a random time, a random post and language not yet posted this round. Switching it on schedules the first post later the same day.</li>
          <li><Ui>Next post</Ui>: when the next automatic post is due.</li>
          <li><Ui>This round</Ui>: how many of the 100 have been posted. After all 100, a new round starts.</li>
          <li><Ui>Post now</Ui>: leave <Ui>Post</Ui> and <Ui>Language</Ui> on <Ui>Random</Ui> for the next unused combination, or choose both to see the picture, text and image description first. A combination already posted this round is marked; posting it again repeats it.</li>
        </ul>
        <Callout kind="note"><p>A post made with <Ui>Post now</Ui> counts as that day’s post: if the automatic one was still due today, it moves to tomorrow. A post that fails stays unused and can come up again.</p></Callout>

        <h2 id="lists">Lists</h2>
        <p><Ui>Last 24 hours (M4.5+)</Ui>, <Ui>Posts</Ui> and <Ui>Recent Play Store posts</Ui> start closed, with the number of items on the right. Tap a header to open or close the list.</p>

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
