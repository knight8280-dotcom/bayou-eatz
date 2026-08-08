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

  /* ── Online ordering ──────────────────────────────────────────────
     Paste your Square / Toast / ChowNow / DoorDash link here.
     Leave as "" and the Order buttons fall back to calling.         */
  orderUrl: "",

  /* ── Catering form ────────────────────────────────────────────────
     Paste a form endpoint (Formspree, Basin, Netlify Forms, etc.).
     Leave as "" and the form opens a pre-filled email instead.      */
  formEndpoint: "",

  /* ── Weekly route ─────────────────────────────────────────────────
     The "typical week" list. day: Sunday = 0 … Saturday = 6.        */
  schedule: [
    { day: 2, label: "Tuesday",   place: "Downtown Lunch Stop", address: "Main St & 3rd Ave",              time: "11am – 3pm",  open: true },
    { day: 3, label: "Wednesday", place: "Business Park",       address: "Corporate Center lot",           time: "11am – 3pm",  open: true },
    { day: 4, label: "Thursday",  place: "Brewery Night",       address: "Local Brewing Co.",              time: "5pm – 9pm",   open: true },
    { day: 5, label: "Friday",    place: "Weekend Kickoff",     address: "Riverfront lot",                 time: "11am – 10pm", open: true },
    { day: 6, label: "Saturday",  place: "Market & Events",     address: "Check Facebook for the spot",    time: "12pm – 10pm", open: true },
    { day: 0, label: "Sunday",    place: "Private events only",  address: "Book us for your gathering",     time: "Closed",      open: false },
    { day: 1, label: "Monday",    place: "Closed — prep day",    address: "Back Tuesday",                   time: "Closed",      open: false }
  ],

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

     The entries below are EXAMPLES. Replace them with real dates.
     ══════════════════════════════════════════════════════════════════ */
  bookings: [
    { date: "2026-08-11", type: "public",  title: "Downtown Lunch",   time: "11am – 3pm",  place: "Main St & 3rd Ave" },
    { date: "2026-08-13", type: "public",  title: "Brewery Night",    time: "5pm – 9pm",   place: "Local Brewing Co." },
    { date: "2026-08-14", type: "private", title: "Private event",    time: "Booked" },
    { date: "2026-08-15", type: "public",  title: "Saturday Market",  time: "12pm – 8pm",  place: "Riverfront lot" },
    { date: "2026-08-16", type: "private", title: "Church function",  time: "Booked" },
    { date: "2026-08-21", type: "private", title: "Company lunch",    time: "Booked" },
    { date: "2026-08-22", type: "public",  title: "Block party",      time: "12pm – 9pm",  place: "Check Facebook for the spot" },
    { date: "2026-08-29", type: "private", title: "Wedding",          time: "Booked" },
    { date: "2026-09-05", type: "public",  title: "Saturday Market",  time: "12pm – 8pm",  place: "Riverfront lot" },
    { date: "2026-09-12", type: "private", title: "Graduation party", time: "Booked" }
  ]
};
