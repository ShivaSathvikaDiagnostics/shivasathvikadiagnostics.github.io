# Securing your Google Sheet and phone numbers

## 1. Google Sheet (do this first)
1. Open the Sheet > **Share**. Set General access to **Restricted**. Remove "Anyone with the link".
2. Add only the 1-2 staff who truly need it, as **Editor** (not Owner). Everyone else: none.
3. Turn on **2-Step Verification** on the Google account that owns the Sheet (myaccount.google.com/security). This is the biggest protection.
4. Sheet > Share > Settings (gear): untick **"Editors can change permissions and share"** and **"Viewers and commenters can see the option to download, print, and copy"**.
5. Never publish the Sheet to the web (File > Share > Publish to web must be OFF).
6. Right-click the Bookings tab > **Protect sheet** so only you can edit.

## 2. Backend
1. Sheet > Extensions > Apps Script. Replace everything with `Code.gs` from this folder. Save.
2. Project Settings > Script properties: add `DAILY_LIMIT` = `50`.
3. Deploy > New deployment > **Web app**. Execute as: **Me**. Who has access: **Anyone**. (Required for a public form. It is safe because the script only returns slot counts, never names or phones.)
4. Copy the URL ending in `/exec` into `BOOKING_API_URL` in `script.js`.
5. After any code change: Deploy > Manage deployments > Edit > New version. (Needed now: this update makes booking faster and stops double bookings.)

## 3. Bot protection (free, recommended)
1. dash.cloudflare.com > Turnstile > Add site (your domain). Copy the **Site key** into `TURNSTILE_SITE_KEY` in `script.js`.
2. Put the **Secret key** only in Apps Script > Script properties as `TURNSTILE_SECRET`. Never in the website.

## 4. What is already protected in the code
- Phone, name, age, day re-validated on the server; website checks alone can be bypassed.
- Sheet formula injection blocked (`=`, `+`, `-`, `@` at the start of any text).
- Real hidden honeypot field, 3 bookings per phone per hour, 40 per minute overall.
- Lock prevents two people taking the last slot; hard cap of 50 per day.
- Errors never reveal internals; public endpoint cannot read any patient data.
- Site: stricter CSP (no framing, https only), no referrer sent. After a booking the test list, form, WhatsApp text and browser copy are all cleared. A forgotten test list is deleted after 6 hours. Patient details are never stored in the browser.
- A slow-network retry can never create a second booking (each booking carries a one-time request id).

## 4b. New protections (v6)
- **Pause switch:** Apps Script > Project Settings > Script properties > `BOOKINGS_OPEN` = `off` stops every new booking instantly. Delete it or set `on` to reopen.
- **Flood alert:** add `ALERT_EMAIL` = your email. You get one email per hour if the form is being flooded.
- **Automatic privacy clean-up:** in the Apps Script editor choose `installTriggers` and press Run once. Every night rows older than 90 days (`RETENTION_DAYS`) are deleted.
- **Human check:** a booking sent in under 4 seconds after the My Tests window opened is rejected (scripts are faster than people).
- **One family, not one bot:** at most 4 bookings per phone number per day.
- **Clickjacking:** a copy of the site placed inside another page hides itself.
- After pasting the new `Code.gs`: Deploy > Manage deployments > Edit > **New version**.

## 4d. Indian numbers only and injection protection (v17)
- **Indian mobile numbers only**: 10 digits starting with 6, 7, 8 or 9. `+91`, `91` or `0` in front is accepted and removed. Foreign numbers, letters and fake numbers such as 9999999999 are rejected on the website AND again on the server.
- **Phone box** accepts only digits, spaces, `+`, `-` and brackets (typing or pasting anything else is removed).
- **Server accepts plain text and numbers only**: any object, list or nested data in a booking is rejected.
- **Doctor, landmark, area and tests** keep only letters, digits and simple punctuation. `< > " ` = @ { } | ~ ^ $ \\` and emoji are removed, so HTML, script, formula and URL injection cannot work. A leading `+ - = @` is neutralised so Google Sheets never runs it as a formula.
- **No XSS**: the page writes visitor text with `textContent` only, the Content-Security-Policy allows scripts only from this site and Cloudflare Turnstile, and framing is blocked.
- After pasting the new `Code.gs`: Deploy > Manage deployments > Edit > **New version** > Deploy.

## 4c. Best upgrade: put Cloudflare (free) in front of the site
GitHub Pages cannot send security headers. Once you own the domain, add it to Cloudflare (free plan) and turn on: Always HTTPS, HSTS, "Bot Fight Mode", and a Transform Rule adding `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Also turn on Turnstile (section 3).

## 4d. Your GitHub account
Turn on 2-factor sign-in, enable branch protection on `main`, and never commit passwords or keys (the site has none by design).

## 5. Habits that matter
- Do not email or WhatsApp the whole Sheet. Share single bookings only.
- Delete or archive rows older than 90 days (patient data should not be kept forever).
- Check Sheet > File > Version history / Share list monthly.
- Show a short privacy line near the Book button: "Your number is used only to confirm your booking."
- If a staff member leaves, remove them from the Sheet the same day.
