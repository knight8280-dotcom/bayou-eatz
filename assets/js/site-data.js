/* ═══════════════════════════════════════════════════════════════════
   BAYOU EATZ — EDIT THIS FILE
   ───────────────────────────────────────────────────────────────────
   Everything that changes lives here: contact details, the weekly
   route, and the booking calendar. You never need to touch any other
   file. Save, refresh, done.
   ═══════════════════════════════════════════════════════════════════ */

window.BAYOU = {

  /* ── Contact ──────────────────────────────────────────────────────
     phoneDisplay is what people see; phoneDial is what gets dialed. */
  ownerName:    "Joe Munson",
  ownerTitle:   "Owner & Executive Chef",
  phoneDisplay: "(225) 371-5951",
  phoneDial:    "+12253715951",
  email:        "bayoueatz@outlook.com",

  /* ── Social ───────────────────────────────────────────────────────
     Every Facebook / Instagram link on the site comes from here.    */
  facebook:      "https://www.facebook.com/Bayoueatz",
  instagram:     "https://www.instagram.com/bayoueatzz/",
  instagramName: "@bayoueatzz",

  /* ── Site identity ────────────────────────────────────────────────
     siteUrl is the live address once the domain is pointed at the site.
     It's used for share cards, the sitemap and search-engine data, so
     set it before going live.

     serviceArea is the plain-English answer to "where do you go?" and
     appears in the footer and in search results.                      */
  siteUrl:     "https://knight8280-dotcom.github.io/bayou-eatz",
  serviceArea: "Baton Rouge & surrounding parishes",   /* ← CONFIRM THIS */
  city:        "Baton Rouge",                          /* ← CONFIRM THIS */
  region:      "LA",

  /* ── Service hours — OPTIONAL ─────────────────────────────────────
     A truck isn't a storefront. Posting where you'll be beats printing
     hours you then have to keep. Leave this empty (the default) and the
     site says "we move around — check the calendar" instead, and tells
     Google the same.

     Only fill it in if there really are hours that hold every week:
       { days: "Fri – Sat", label: "11am – 10pm",
         opens: "11:00", closes: "22:00",
         schemaDays: ["Friday", "Saturday"] }                          */
  hours: [],

  /* ── Online ordering ──────────────────────────────────────────────
     Paste your Square / Toast / ChowNow / DoorDash link here.
     Leave as "" and the Order buttons fall back to calling.         */
  orderUrl: "",

  /* ── Where booking requests go ────────────────────────────────────
     Every quote and booking request from the site is emailed to the
     `email` address above — no separate inbox to check.

     "formsubmit" routes it through formsubmit.co, which needs no
     account: the FIRST request sent from the live site triggers a
     one-time confirmation email to that address. Click the link in it
     once and every request after that arrives automatically.

     Set formService to "" to turn the service off; the form then opens
     the customer's own email app with everything filled in instead.

     formEndpoint overrides all of this — paste a Formspree / Basin /
     Netlify Forms URL here if you'd rather use one of those.          */
  formService:  "formsubmit",
  formEndpoint: "",

  /* ══════════════════════════════════════════════════════════════════
     POSTING WHERE THE TRUCK WILL BE  ← the important one
     ──────────────────────────────────────────────────────────────────
     Chef Joe keeps a Google Sheet on his phone. Add a row, and the
     website shows it — no code, no commit, no waiting on anybody.

     The sheet already exists — "Bayou Eatz — Schedule" in Google Drive,
     with the Stops tab and its seven headers in place:
       https://docs.google.com/spreadsheets/d/1fScbuffRZN9tZluynheTuodQDSdpXTe0J-xBlJQLRmY/edit

     One thing left before the site can read it:
       Share → General access → "Anyone with the link" → Viewer.

     To use a different sheet instead, make one with these headers in
     row 1 of a tab named Stops:
            Date | Type | What | Where | Time | Note | Hide
     share it the same way, and paste the long ID out of its address
     (docs.google.com/spreadsheets/d/THIS-LONG-BIT/edit) as sheetId.

     The /post.html page on this site writes the rows for him, so he
     never has to remember the format.

     If the sheet is empty, unreachable or slow, the site quietly falls
     back to the `bookings` list further down — it never shows a blank
     calendar.
     ══════════════════════════════════════════════════════════════════ */
  stopsSheet: {
    sheetId:   "1fScbuffRZN9tZluynheTuodQDSdpXTe0J-xBlJQLRmY",
    sheetName: "Stops",     /* the tab holding calendar stops */
    postsName: "Posts",     /* the tab holding written updates */
    timeoutMs: 6000
  },

  /* ══════════════════════════════════════════════════════════════════
     PUBLISHING FROM THE SITE ITSELF
     ──────────────────────────────────────────────────────────────────
     Optional, and the nicer way to work. With this set, Chef Joe writes
     an update on /post.html, taps Publish, and it appears on the site —
     no spreadsheet, no copying, no leaving the website.

     Setup is in tools/apps-script.gs: paste the script into the sheet's
     Apps Script editor, deploy it as a web app, and paste the /exec
     address it gives you below. The passcode lives in that script, not
     here, so it never ships to the browser.

     Leave publishUrl empty and the Publish button simply isn't shown —
     the page still writes rows to copy by hand, exactly as before.
     ══════════════════════════════════════════════════════════════════ */
  publishUrl: "",

  /* ── Weekly route — OPTIONAL ──────────────────────────────────────
     The "typical week" list for the "Where we tend to be" section.
     EMPTY ON PURPOSE until Chef Joe gives his real rounds — the section
     stays hidden while this is empty, so the site never shows a stop
     that was made up. One entry per day; day: Sunday = 0 … Saturday = 6.

       { day: 4, label: "Thursday", place: "Brewery Night",
         address: "Local Brewing Co.", time: "5pm – 9pm", open: true },
       { day: 1, label: "Monday",   place: "Closed — prep day",
         address: "Back Tuesday",     time: "Closed",     open: false }
                                                                     */
  schedule: [],

  /* ══════════════════════════════════════════════════════════════════
     BOOKING CALENDAR
     ──────────────────────────────────────────────────────────────────
     One entry per date the truck is committed. Anything you don't
     list shows as "open for booking".

       date  "YYYY-MM-DD"  (always this format, always zero-padded)
       type  "public"   — open to everybody, come eat
             "private"  — booked for a private event
       title short label shown on the calendar
       time  service window (optional)
       place where it is — customers see this for public stops.
             Leave it off private bookings if the host wants privacy.

     This list is the FALLBACK — the calendar reads the Google Sheet
     first and only uses these entries if the sheet can't be reached.
     It ships empty so nothing invented ever reaches a customer; add a
     few real dates here if you'd like the page never to be bare:

       { date: "2026-10-03", type: "public",  title: "Saturday Market",
         time: "12pm – 8pm", place: "Riverfront lot" },
       { date: "2026-10-10", type: "private", title: "Private event",
         time: "Booked" }
     ══════════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════════
     REVIEWS
     ──────────────────────────────────────────────────────────────────
     EMPTY ON PURPOSE. Nothing is invented here. The reviews section
     stays hidden until you add real ones, so the site never shows a
     testimonial a customer didn't write.

     To turn it on, paste real quotes — from Facebook reviews, Google,
     or ones customers send you:

       { quote: "Best loaded fries in the parish.",
         name:  "Danielle T.",
         event: "Facebook review" }
     ══════════════════════════════════════════════════════════════════ */
  reviews: [],

  bookings: []
};
