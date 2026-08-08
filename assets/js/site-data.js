/* ═══════════════════════════════════════════════════════════════════
   BAYOU EATZ — EDIT THIS FILE
   ───────────────────────────────────────────────────────────────────
   Everything that changes week to week lives here. You do not need to
   touch any other file to update the truck's schedule, phone number,
   or ordering link. Save, refresh, done.
   ═══════════════════════════════════════════════════════════════════ */

window.BAYOU = {

  /* ── Contact ──────────────────────────────────────────────────────
     phoneDisplay is what people see; phoneDial is what gets dialed
     (digits only, with country code).                               */
  phoneDisplay: "(555) 000-0000",
  phoneDial:    "+15550000000",
  email:        "hello@bayoueatz.com",

  /* ── Online ordering ──────────────────────────────────────────────
     Paste your Square / Toast / ChowNow / DoorDash link here.
     Leave as "" and the Order buttons quietly fall back to calling.  */
  orderUrl: "",

  /* ── Catering form ────────────────────────────────────────────────
     Paste a form endpoint (Formspree, Basin, Netlify Forms, etc.).
     Leave as "" and the form opens a pre-filled email instead — it
     still works, it just uses the customer's mail app.               */
  formEndpoint: "",

  /* ── Weekly schedule ──────────────────────────────────────────────
     day:   Sunday = 0 … Saturday = 6  (used to highlight "today")
     open:  false = closed / private events that day
     Add or remove entries freely.                                    */
  schedule: [
    {
      day: 2, label: "Tuesday",
      place: "Downtown Lunch Stop",
      address: "Main St & 3rd Ave",
      time: "11am – 3pm",
      open: true
    },
    {
      day: 3, label: "Wednesday",
      place: "Business Park",
      address: "Corporate Center lot",
      time: "11am – 3pm",
      open: true
    },
    {
      day: 4, label: "Thursday",
      place: "Brewery Night",
      address: "Local Brewing Co.",
      time: "5pm – 9pm",
      open: true
    },
    {
      day: 5, label: "Friday",
      place: "Weekend Kickoff",
      address: "Riverfront lot",
      time: "11am – 10pm",
      open: true
    },
    {
      day: 6, label: "Saturday",
      place: "Market & Events",
      address: "Check Facebook for the day's spot",
      time: "12pm – 10pm",
      open: true
    },
    {
      day: 0, label: "Sunday",
      place: "Private events only",
      address: "Book us for your gathering",
      time: "Closed",
      open: false
    },
    {
      day: 1, label: "Monday",
      place: "Closed — prep day",
      address: "Back Tuesday",
      time: "Closed",
      open: false
    }
  ]
};
