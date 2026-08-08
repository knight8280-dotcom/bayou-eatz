# Bayou Eatz — Website

A static website for the Bayou Eatz food truck. No build step, no dependencies —
open `index.html` in a browser and it runs.

```
index.html                 all page content
assets/css/styles.css      styling (Mardi Gras palette from the logo)
assets/js/site-data.js     ← edit this: contact, socials, calendar, route
assets/js/main.js          behavior (nav, tabs, calendar, form)
assets/img/                logo, favicon, food photos
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
| `formEndpoint` | empty | ⬜ form service URL (see below) |

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

### 4. Logo and photos — done

`assets/img/logo.webp` (and the smaller `logo-small.webp`) is the real logo,
background removed so it sits on the dark page. The seven gallery and story
photos are the real ones, resized and compressed for the web.

### 5. Details still to confirm in `index.html`

- **Footer hours** — currently generic Tue–Sat times
- **Catering package** names, minimums and pricing
- **The story section copy** — written from the menu and branding, not from
  Chef Joe's own words
- **Service area** — the site doesn't name a city yet
- `<title>`, meta description and the canonical URL once the domain is chosen

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
- Tested down to 320px wide; no horizontal scrolling at any width.
- Respects `prefers-reduced-motion` — animations are disabled for users who
  ask for that.
