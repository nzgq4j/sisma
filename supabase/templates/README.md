# Auth email templates

sisma-branded templates for Supabase Auth: light lilac background, white card with the magnitude colour strip, the
sisma logo (loaded from `https://sisma.io/icons/icon-192.png`) and a violet button. Table layout with inline styles so
they render in Gmail, Outlook and Apple Mail. Same approach as the polar lights app's templates.

**Languages:** every template and subject holds all 10 app languages (English, Spanish, Japanese, Indonesian,
Turkish, Italian, Portuguese, Chinese, French, German) and picks one with Go-template conditionals on the user's
saved language (`{{ .Data.locale }}`, user metadata the app sets at sign-up and when the language changes).
Anyone without a saved language gets English.

Edit `build.py` and run `python3 supabase/templates/build.py` to regenerate. Then, for each row, paste the `.html`
file into **Supabase → Authentication → Emails** as the message body and the matching `subjects/*.txt` line as the
**Subject**, and **Save changes**. Security notifications are only sent for the notices switched on under
Authentication → Emails → Security.

| Dashboard template | Body | Subject (paste the whole line) | English subject |
| --- | --- | --- | --- |
| Confirm sign up | `confirmation.html` | `subjects/confirmation.txt` | Confirm your sisma account |
| Reset password | `recovery.html` | `subjects/recovery.txt` | Reset your sisma password |
| Magic link | `magic_link.html` | `subjects/magic_link.txt` | Your sisma sign-in link |
| Change email address | `email_change.html` | `subjects/email_change.txt` | Confirm your new email address |
| Password changed (security) | `password_changed.html` | `subjects/password_changed.txt` | Your sisma password was changed |
| Email address changed (security) | `email_changed.html` | `subjects/email_changed.txt` | Your sisma email address was changed |

Variables used: `{{ .ConfirmationURL }}` (one-time links), `{{ .Email }}`, `{{ .NewEmail }}` (change email),
`{{ .OldEmail }}` (email changed), `{{ .Data.locale }}`. Security notices link to https://sisma.io/app/me and end
with what to do if the change wasn't the account owner.

The non-English text was translated without native-speaker review; have it checked before launch.
