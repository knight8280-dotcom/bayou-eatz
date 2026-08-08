# Bayou Eatz — Website

A static website for the Bayou Eatz food truck. No build step, no dependencies —
open `index.html` in a browser and it runs.

```
index.html                 all page content
assets/css/styles.css      styling (Mardi Gras palette from the logo)
assets/js/site-data.js     ← edit this: schedule, phone, ordering link
assets/js/main.js          behavior (nav, tabs, schedule, form)
assets/img/                logo, favicon, photo placeholders
```

---

## Before this goes live

The design and menu are done. These items are placeholders and need real
values — everything is either in `assets/js/site-data.js` or marked in
`index.html` with an `EDIT:` comment.

### 1. Contact + ordering — `assets/js/site-data.js`

| Field | Currently | Needs |
|---|---|---|
| `phoneDisplay` / `phoneDial` | `(555) 000-0000` | the real number |
| `email` | `hello@bayoueatz.com` | the real inbox |
| `orderUrl` | empty | Square / Toast / ChowNow / DoorDash link |
| `formEndpoint` | empty | form service URL (see below) |

These values populate every phone number, email and Order button on the page,
so you only enter them once.

**If `orderUrl` stays empty**, the Order buttons dial the phone instead and a
note explains that online ordering isn't set up. Nothing breaks.

### 2. Weekly schedule — `assets/js/site-data.js`

The `schedule` array drives the "Find the truck" section. Each entry:

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

Whichever entry matches today's `day` gets highlighted with a **Today** badge
and shows up in the hero. Update it whenever the route changes.

### 3. The logo

`assets/img/logo.svg` is a stand-in drawn to match the real logo's colors and
layout. Replace it with the official artwork:

- Save the real logo as `assets/img/logo.svg` (or `.png`) with a transparent
  background, around 800px wide.
- If you use a PNG, update the two `src="assets/img/logo.svg"` references in
  `index.html` (header and footer).

### 4. Photos

`assets/img/gallery-1.svg` … `gallery-6.svg` and `story.svg` are branded
placeholders. Replace them with real photos (JPG is fine — just update the
`src` and the `alt` text in `index.html`). Keep them under ~400 KB each so the
page stays fast on phones.

### 5. Details to confirm in `index.html`

- Footer hours (currently generic Tue–Sat times)
- Service area line in the footer
- Catering package names and minimums
- The story section copy — it's written from the menu and branding, not from
  the owner's actual words
- `<title>`, meta description and the canonical URL once the domain is chosen

---

## Catering form

The form validates in the browser and then does one of two things:

- **`formEndpoint` set** → POSTs the submission as JSON to that URL.
  Works with [Formspree](https://formspree.io), [Basin](https://usebasin.com),
  Netlify Forms, or any endpoint that accepts a JSON POST.
- **`formEndpoint` empty** → opens the customer's email app with every field
  pre-filled and addressed to `email`. Still functional, just one extra tap.

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
- Everything works without JavaScript except the schedule list, the menu
  category tabs (all sections stay visible instead), and the catering form.
- Tested down to 320px wide; no horizontal scrolling at any width.
- Respects `prefers-reduced-motion` — animations are disabled for users who
  ask for that.
