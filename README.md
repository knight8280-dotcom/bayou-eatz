# Bayou Eatz — Website

A static website for the Bayou Eatz food truck. No build step, no dependencies —
open `index.html` in a browser and it runs.

```
index.html                 the site — sections, menu and FAQ text
privacy.html               privacy policy (the forms collect data)
404.html                   "page not found"
assets/css/styles.css      styling (Mardi Gras palette from the logo)
assets/js/site-data.js     ← edit this: contact, socials, calendar, hours
assets/js/main.js          behavior (nav, tabs, calendar, forms, schema)
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
| `hours` | Tue–Thu 11–7, Fri–Sat 11–10 | ⚠️ **placeholder — confirm** |

These values populate every phone number, email, social link and Order button
on the page, so you only enter them once.

**If `orderUrl` stays empty**, the Order buttons dial the phone instead and a
note explains that online ordering isn't set up. Nothing breaks.

### 2. Booking calendar — `assets/js/site-data.js`

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
examples — replace them with real dates.**

### 3. Weekly route — `assets/js/site-data.js`

The `schedule` array drives the "A typical week" section. Each entry:

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

### 4. Photos on the menu — check the pairings

Four dishes carry a photo in the "House favorites" strip: Bayou Loaded Fries,
Fried Ribs, Classic Burger and Wings. Each photo genuinely shows that dish —
nothing was paired loosely to fill a slot, which is why the other items are
text-only. If Chef Joe sends better shots, the `m-*.jpg` files in
`assets/img/` are the ones to replace (square, 720×720).

### 5. Logo and photos — done

`assets/img/logo.webp` (and the smaller `logo-small.webp`) is the real logo,
background removed so it sits on the dark page. The seven gallery and story
photos are the real ones, resized and compressed for the web.

### 6. Details still to confirm in `index.html`

Search the file for `EDIT:` to find each one.

- **Catering package** names, minimums and pricing
- **"What we need on site"** — the space, setup time and travel answers are
  reasonable defaults, not measured facts. Check every figure.
- **FAQ answers** — the questions marked in the file as needing confirmation
  are booking notice, travel radius and venue requirements
- **The story section copy** — written from the menu and branding, not from
  Chef Joe's own words
- `<title>`, meta description and the canonical URL once the domain is chosen

### 7. Reviews — off until they're real

The reviews section is hidden and the `reviews` array in `site-data.js` is
empty on purpose: nothing is invented. Paste in real quotes from Facebook or
Google and the section turns itself on.

### 8. Turn the domain on in three files

When the real address is known, update it in `site-data.js` (`siteUrl`),
`robots.txt`, and `sitemap.xml`. The `<link rel="canonical">` and share-card
tags in `index.html` need it too.

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
