# Bayou Eatz — Website

A static website for the Bayou Eatz food truck. No build step, no dependencies —
open `index.html` in a browser and it runs.

```
index.html                 the site — sections, menu and FAQ text
post.html                  ← Chef Joe's page for posting stops (unlisted)
privacy.html               privacy policy (the forms collect data)
404.html                   "page not found"
assets/css/styles.css      styling (Mardi Gras palette from the logo)
assets/js/site-data.js     ← edit this: contact, socials, calendar, hours
assets/js/main.js          behavior (nav, tabs, calendar, forms, schema)
assets/js/post.js          the posting page
tools/apps-script.gs       paste into Google Apps Script to enable Publish
assets/img/                logo, icons, share card, hero backdrop, food photos
robots.txt sitemap.xml     search engines
site.webmanifest           "add to home screen" on phones
```

---

## Before this goes live

The design and menu are done. These items are placeholders and need real
values — everything is either in `assets/js/site-data.js` or marked in
`index.html` with an `EDIT:` comment.

### 1. Contact + ordering — `assets/js/site-data.js`

| Field | Currently | Status |
|---|---|---|
| `ownerName` / `ownerTitle` | Joe Munson, Owner & Executive Chef | ✅ real |
| `phoneDisplay` / `phoneDial` | (225) 371-5951 | ✅ real |
| `email` | bayoueatz@outlook.com | ✅ real |
| `facebook` / `instagram` | facebook.com/Bayoueatz, @bayoueatzz | ✅ real |
| `orderUrl` | empty | ⬜ Square / Toast / ChowNow / DoorDash link |
| `formEndpoint` | empty | ⬜ only if you'd rather not use the default (see below) |
| `siteUrl` | https://bayoueatz.com | ⬜ set to the real domain before launch |
| `serviceArea` / `city` / `region` | Baton Rouge & surrounding parishes | ⚠️ **guessed from the 225 area code — confirm** |
| `hours` | empty | ✅ intentional — see below |
| `stopsSheet.sheetId` | empty | ⬜ **the important one** — see §2 |
| `publishUrl` | empty | ⬜ optional — turns on the Publish button, see §2 |

These values populate every phone number, email, social link and Order button
on the page, so you only enter them once.

**If `orderUrl` stays empty**, the Order buttons dial the phone instead and a
note explains that online ordering isn't set up. Nothing breaks.

### 2. Posting where the truck will be

**One update, three places on the site.** When Chef Joe posts, it shows up as
a dated entry in the **Latest word** feed near the top of the page, drives the
**"where we're at"** banner, and — if it names a date — lands on the calendar.
He writes it once.

There are two ways to post, and the site supports both at the same time.

**A. Publish straight from the site (the good one).** A **Publish** button on
`/post.html`: he types the update, enters his passcode, taps once, and it's
live. No spreadsheet, no copying, never leaves the website. Setup is a
five-minute, one-time job described in `tools/apps-script.gs` — paste the
script into the sheet's Apps Script editor, deploy it as a web app, and paste
the address it gives you into `publishUrl` in `site-data.js`.

The script runs as the sheet's owner, so **the website never holds a Google
password or an API key** — only the web-app address and a passcode he types.
Anyone who found the address still couldn't post without the passcode, and the
worst they could do is add a row you delete.

Because Google's reply to that request can't be read reliably from a browser,
the page doesn't just claim success — it re-reads the sheet until the post
actually appears, and tells him plainly if it can't confirm it.

**B. Copy and paste (always available).** The same form writes a row to paste
into the sheet by hand. This works with no setup at all and is the fallback if
the publish endpoint is ever unreachable.

**This is the one that matters day to day.** A truck moves; a schedule
hard-coded into a website goes stale the day it ships. So Chef Joe posts stops
himself, from his phone, and the site follows.

**However he posts**, the page also writes the **Facebook and Instagram
caption** for the same update — the same information phrased the way you'd say
it, with emoji and hashtags, ready to copy or share. Open `/post.html` on his
phone and add it to the home screen; it behaves like an app.

He never types a date format or edits a file.

**Setting up the sheet — once, about five minutes.** Full walkthrough is on
`/post.html` itself, but in short:

1. New Google Sheet with two tabs. **Stops** (the calendar):
   `Date | Type | What | Where | Time | Note | Hide`
   and **Posts** (the written feed):
   `Posted | Headline | Message | Where | When | Hide`
   If you use the Publish button, both tabs are created for you the first
   time something is posted.
2. **Share → Anyone with the link → Viewer.** The site only ever reads it;
   nobody else can change it.
3. Copy the long ID out of the sheet's address and paste it into
   `stopsSheet.sheetId` in `site-data.js`. The posting page prints the exact
   line to save.

After that: add a row → it's on the site. Delete a row → it's gone. Put `yes`
in the **Hide** column to pull a stop down without losing the record.

The sheet is read through Google's JSONP endpoint, so there's no API key, no
account for the website, and nothing to deploy. **If the sheet is empty, slow
or unreachable, the site quietly falls back to the `bookings` list in
`site-data.js`** — visitors never see an empty calendar.

### 3. The fallback booking list — `assets/js/site-data.js`

The `bookings` array drives the calendar and the "Coming up" list. One entry
per committed date; anything not listed shows as **open for booking**.

```js
{
  date: "2026-08-15",        // always YYYY-MM-DD, zero-padded
  type: "public",            // "public" = come eat · "private" = booked
  title: "Saturday Market",
  time: "12pm – 8pm",
  place: "Riverfront lot"    // omit on private bookings if the host wants privacy
}
```

Today's date is highlighted, past days are dimmed, and customers can't page
back before the current month. **The entries in the file right now are
examples.** Once the sheet is connected, this list is only a safety net — but
it's worth leaving a few real stops in it so the page is never bare.

### 4. Weekly route — `assets/js/site-data.js`

The `schedule` array drives the "Where we tend to be" section — a rough guide,
deliberately secondary to the posted stops. Each entry:

```js
{
  day: 4,                        // Sunday = 0 … Saturday = 6
  label: "Thursday",
  place: "Brewery Night",
  address: "Local Brewing Co.",
  time: "5pm – 9pm",
  open: true                     // false = closed / private events
}
```

Whichever entry matches today's `day` gets highlighted with a **Today** badge.
Update it whenever the route changes.

### 5. Photos on the menu — check the pairings

Four dishes carry a photo in the "House favorites" strip: Bayou Loaded Fries,
Fried Ribs, Classic Burger and Wings. Each photo genuinely shows that dish —
nothing was paired loosely to fill a slot, which is why the other items are
text-only. If Chef Joe sends better shots, the `m-*.jpg` files in
`assets/img/` are the ones to replace (square, 720×720).

### 6. Logo and photos — done

`assets/img/logo.webp` (and the smaller `logo-small.webp`) is the real logo,
background removed so it sits on the dark page. The seven gallery and story
photos are the real ones, resized and compressed for the web.

### 7. Details still to confirm in `index.html`

Search the file for `EDIT:` to find each one.

- **Catering package** names, minimums and pricing
- **"What we need on site"** — the space, setup time and travel answers are
  reasonable defaults, not measured facts. Check every figure.
- **FAQ answers** — the questions marked in the file as needing confirmation
  are booking notice, travel radius and venue requirements
- **The story section copy** — written from the menu and branding, not from
  Chef Joe's own words
- `<title>`, meta description and the canonical URL once the domain is chosen

### 8. Reviews — off until they're real

The reviews section is hidden and the `reviews` array in `site-data.js` is
empty on purpose: nothing is invented. Paste in real quotes from Facebook or
Google and the section turns itself on.

### 9. The live address

The site is live at:

**https://knight8280-dotcom.github.io/bayou-eatz/**

That address is written into four files — canonical link, share-card tags and
search data in `index.html`, plus `sitemap.xml`, `robots.txt` and `siteUrl` in
`site-data.js`.

**If you buy a domain later**, find and replace
`https://knight8280-dotcom.github.io/bayou-eatz` with the new address across
those four files, add a `CNAME` file in the repo root containing just the
domain, and point the DNS at GitHub. Nothing else needs touching — every asset
path on the page is relative.

---

## Where booking requests go

Every quote and booking request is emailed to the **same address the site
advertises** — `email` in `site-data.js`, currently `bayoueatz@outlook.com`.
There is no separate dashboard or inbox to check, and changing that one field
redirects the requests along with the rest of the site.

Requests reach that inbox two ways, and both end up in the same place:

1. The **Request a date** form in the booking section.
2. **Tapping any day on the calendar**, which drops that date into the form
   and scrolls the customer straight to it.

### One-time setup — Chef Joe must click a confirmation link

The form posts through [formsubmit.co](https://formsubmit.co), which needs no
account. The catch is a single activation step:

1. Put the site online (a local file won't do — the service needs a real page).
2. Send one test request through the form.
3. **formsubmit.co emails `bayoueatz@outlook.com` a confirmation link.** Open
   that email and click the link.
4. That's it. Every request from then on lands in the inbox automatically.

Until step 3 is done, requests are accepted by the service but not forwarded —
so send that first test yourself and confirm it arrives.

Each email arrives as a formatted table with the customer's name, email, phone,
event date, guest count, service type and notes. The subject line reads
`Booking request — <name> — <date>`, and hitting **reply** goes straight back
to the customer.

### If it ever fails

If the service is unreachable, the form doesn't lose the customer's typing — it
opens their own email app with every field pre-filled and addressed to the same
inbox. They just hit send.

### Using a different service

Paste any endpoint that accepts a JSON POST into `formEndpoint` and it takes
over — [Formspree](https://formspree.io), [Basin](https://usebasin.com),
Netlify Forms, or your own. Set `formService: ""` to skip the service entirely
and always use the email-app route.

A hidden honeypot field catches most spam bots.

---

## Publishing

Any static host works. The two easiest:

**GitHub Pages** — Settings → Pages → Source: *Deploy from a branch* → pick the
branch and `/ (root)`. Live at `https://<user>.github.io/bayou-eatz/`.

**Netlify / Vercel** — drag the folder onto the dashboard, or connect the repo.
No build command, publish directory is the repo root.

To point a custom domain at GitHub Pages, add a file named `CNAME` in the root
containing just the domain (e.g. `bayoueatz.com`), then set the DNS records
your registrar's guide specifies.

---

## What's on the page for search engines

- **Structured data** — a `FoodEstablishment` record (name, phone, email,
  cuisine, hours, service area, socials, owner), an `FAQPage` built from the
  FAQ section, and a `FoodEvent` for each upcoming **public** stop so Google
  can list them. Private bookings are deliberately left out.
  The business block is written into `index.html` so crawlers that don't run
  scripts still read it; `main.js` refreshes it from `site-data.js` so the two
  can't drift apart.
- **Share card** — `assets/img/og-card.jpg` (1200×630) is what appears when
  someone posts the link on Facebook or in a text message.
- `robots.txt` and `sitemap.xml`, both pointing at the domain you set.
- The FAQ is plain HTML in `index.html`, so it's readable with scripts off.

Two things worth doing outside this repo, and they matter more than anything
on the page for getting found locally:

1. **Claim the Google Business Profile.** For a food truck that's the single
   biggest source of "food truck near me" traffic.
2. **Keep the Facebook page current** — the site points people there for
   day-of updates, so it needs to actually have them.

---

## Why there are no opening hours

`hours` is empty on purpose. A truck that's all over the parish doesn't have a
storefront's opening times, and printing some anyway just creates a promise to
break. With it empty the site says *"we move around — no fixed hours"* and
points at the posted stops, and it tells Google the same rather than claiming
hours that don't hold.

If a genuinely fixed slot ever appears — a standing Friday brewery night, say —
fill `hours` in and the footer and search data both pick it up automatically.

---

## Notes

- Fonts load from Google Fonts (Alfa Slab One, Cinzel, Karla). If the site is
  ever run fully offline, the page falls back to Georgia and system sans —
  layout is unaffected.
- Every Facebook, Instagram and email link on the page — header icons, inline
  mentions, the owner card, the footer — comes from `site-data.js`. Change a
  URL there and it updates everywhere.
- Everything works without JavaScript except the schedule list, the calendar
  (it shows a "call us" message instead), the menu category tabs (all
  sections stay visible), and the catering form.
- The email-list signup and the booking form both post to the same address.
- Tested at 320, 390, 768, 1024, 1280 and 1600px — no horizontal scrolling at
  any of them.
- Respects `prefers-reduced-motion` — the hero parallax, the marquee, the
  status pulse and every reveal all stand still for anyone who asks for that.
- The gallery lightbox is a native `<dialog>`, so focus trapping and Escape
  come from the browser rather than being reimplemented.
- On phones a sticky bar keeps Call / Find Us / Book Us in thumb reach. It
  stays hidden over the hero, where those buttons are already on screen.
- The **Latest word** feed and its nav link stay hidden until there's a real
  post, so a quiet week never leaves an empty section on the page.
- Private bookings never publish their venue — not to the feed, not to the
  calendar, not to the search data.
- The gallery is a horizontal rail with a label on every photo, arrows, dots
  and a counter. Scrolling is the browser's own, so swipe, trackpad and
  arrow keys all work; tapping a photo still opens the lightbox.
- `/post.html` is `noindex, nofollow` and isn't linked from anywhere on the
  site. It's not a secret — anyone who guesses the address can open it — but
  it only ever writes text into boxes on screen. It has no power to change the
  site on its own, so there's nothing there to abuse.
