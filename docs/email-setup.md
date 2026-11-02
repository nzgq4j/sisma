# A sisma.io email address (e.g. hello@sisma.io)

**Vercel doesn't host mailboxes.** It manages sisma.io's DNS (the domain's address book). You pick an email
provider, and then add a few DNS records in Vercel that tell the internet "mail for sisma.io goes to that provider".

What's already there (Vercel → Domains → sisma.io → DNS Records):

| Name | Type | What it's for |
| --- | --- | --- |
| `resend._domainkey` | TXT | Resend's signature key, so app emails (sign-in links) from no-reply@sisma.io are trusted |
| `send`, `rsend` | CNAME | Resend's bounce handling, on its own sub-address — doesn't interfere with a mailbox |
| ALIAS / CAA records | — | Added by Vercel automatically for the website and its certificate. **Don't touch them** |

**Sending** app emails is handled (Resend). **Receiving** mail at sisma.io isn't set up yet — that's what this guide adds.

> In Vercel's "Add record" form, the **Name** box is the part *before* sisma.io. For the domain itself (written `@`
> by most providers) leave **Name empty**. Ignore the example A record (76.76.21.21) the form shows — don't add it.

---

## Choose one

| | Option A: Google Workspace | Option B: Free forwarding to your Gmail |
| --- | --- | --- |
| What you get | A real inbox at sisma.io (Gmail interface, calendar, Drive) | Mail to hello@sisma.io lands in your existing Gmail; you can reply as hello@sisma.io |
| Cost | Paid per user per month (see workspace.google.com for the current price) | Free (ImprovMX free plan + Resend, which you already have) |
| Good for | Running the business long term; using the same account for Play Console | Getting started today |

Other paid inboxes (Zoho Mail, Fastmail, Proton) work the same way: they give you MX/TXT records to paste.

---

## Option A — Google Workspace

1. Go to **workspace.google.com** → *Get started*. Business name "sisma" (or Crucible Insight), choose "Just you",
   enter **sisma.io** when asked if you have a domain, and create your user (e.g. **hello@sisma.io**).
2. **Verify the domain.** Google shows a TXT record that starts with `google-site-verification=`.
   In Vercel → sisma.io → DNS Records → add: Name *(empty)*, Type **TXT**, Value *(paste it)* → **Add**.
   Back in Google, click **Verify** (can take a few minutes).
3. **Turn on mail delivery.** Add in Vercel:

   | Name | Type | Value | Priority |
   | --- | --- | --- | --- |
   | *(empty)* | MX | `smtp.google.com` | 1 |

4. **Sender checks (so your mail doesn't go to spam).** Add in Vercel:

   | Name | Type | Value |
   | --- | --- | --- |
   | *(empty)* | TXT | `v=spf1 include:_spf.google.com ~all` |
   | `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:hello@sisma.io` |

5. **DKIM (Google's signature).** In admin.google.com → Apps → Google Workspace → Gmail → **Authenticate email** →
   *Generate new record* (2048-bit). Google shows a name (`google._domainkey`) and a long TXT value — add exactly that
   in Vercel, wait ~1 hour, then click **Start authentication** in Google.
6. **Extra addresses for free:** in the admin console add *aliases* to your user — e.g. `support@`, `privacy@`,
   `billing@` — they all arrive in the same inbox.
7. After two weeks of normal mail, tighten DMARC: edit the `_dmarc` record to
   `v=DMARC1; p=quarantine; rua=mailto:hello@sisma.io`.

## Option B — Free: forward to Gmail, reply as hello@sisma.io

**Receive:**

1. Sign up at **improvmx.com** with your Gmail address and enter **sisma.io**.
2. Add in Vercel:

   | Name | Type | Value | Priority |
   | --- | --- | --- | --- |
   | *(empty)* | MX | `mx1.improvmx.com` | 10 |
   | *(empty)* | MX | `mx2.improvmx.com` | 20 |
   | *(empty)* | TXT | `v=spf1 include:spf.improvmx.com ~all` | |
   | `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:hello@sisma.io` | |

3. In ImprovMX, create aliases: `hello` → your Gmail (and `*` catch-all if you want every address to arrive).
   Wait until ImprovMX shows the domain as **Active**, then send a test to hello@sisma.io.

**Send as hello@sisma.io from Gmail** (uses Resend, which is already verified for sisma.io):

1. In Resend → **API Keys** → *Create* → name "gmail send-as", permission **Sending access**, domain **sisma.io**.
   Copy the key (it's shown once). Use a *different* key from the one in Supabase, so you can revoke either alone.
2. In Gmail (desktop) → ⚙ → *See all settings* → **Accounts and Import** → *Send mail as* → **Add another email address**.
   Name: sisma · Email: **hello@sisma.io** · untick "Treat as an alias" → Next.
3. SMTP server **smtp.resend.com**, port **465**, username **resend**, password = the key from step 1,
   **Secured connection using SSL** → Add account.
4. Gmail emails a confirmation code to hello@sisma.io — it arrives in the same Gmail through ImprovMX. Enter it.
5. When replying, pick **hello@sisma.io** in the From field (or make it the default in the same settings page).

---

## Check it works

- Send an email from another address (e.g. a phone) to hello@sisma.io and reply to it.
- Paste `sisma.io` into **mxtoolbox.com/SuperTool** → "MX lookup", "SPF record lookup" and "DMARC lookup" should all be green.
- Only **one** SPF record (a TXT starting with `v=spf1`) may exist on the domain itself. If you ever switch provider,
  edit that record rather than adding a second one.

## Where the address gets used

- Play Console developer contact and the app's store listing (support email)
- Google sign-in consent screen (support email) — see docs/android-setup.md
- Privacy policy contact and account-deletion requests
- DMARC reports (`rua=`)
