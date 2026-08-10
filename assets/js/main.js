/* Bayou Eatz — site behavior.
   Content lives in site-data.js; this file just wires it up. */
(function () {
  "use strict";

  var DATA = window.BAYOU || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Contact details ─────────────────────────────────────────── */
  function applyContact() {
    if (DATA.phoneDisplay && DATA.phoneDial) {
      $$('[data-phone]').forEach(function (el) {
        el.textContent = DATA.phoneDisplay;
        el.setAttribute("href", "tel:" + DATA.phoneDial);
      });
      $$('[data-phone-link]').forEach(function (el) {
        el.textContent = "Call " + DATA.phoneDisplay;
        el.setAttribute("href", "tel:" + DATA.phoneDial);
      });
      // footer phone link has no "Call" prefix
      var footPhone = $('.footer-list [data-phone-link]');
      if (footPhone) footPhone.textContent = DATA.phoneDisplay;
    }
    if (DATA.ownerName) {
      $$('[data-owner-name]').forEach(function (el) { el.textContent = DATA.ownerName; });
    }
    if (DATA.ownerTitle) {
      $$('[data-owner-title]').forEach(function (el) { el.textContent = DATA.ownerTitle; });
    }
    if (DATA.email) {
      $$('[data-email-link]').forEach(function (el) {
        el.textContent = DATA.email;
        el.setAttribute("href", "mailto:" + DATA.email);
      });
      // Links that keep their own wording (icons, "Email us", etc.)
      $$('[data-email-href]').forEach(function (el) {
        el.setAttribute("href", "mailto:" + DATA.email);
      });
    }
    if (DATA.facebook) {
      $$('[data-facebook]').forEach(function (el) { el.setAttribute("href", DATA.facebook); });
    }
    if (DATA.instagram) {
      $$('[data-instagram]').forEach(function (el) { el.setAttribute("href", DATA.instagram); });
    }
    if (DATA.instagramName) {
      $$('[data-instagram-name]').forEach(function (el) { el.textContent = DATA.instagramName; });
    }
  }

  /* ── Ordering links ──────────────────────────────────────────── */
  function applyOrderLinks() {
    var url = (DATA.orderUrl || "").trim();
    var note = $('[data-order-note]');

    if (url) {
      $$('[data-order-link]').forEach(function (el) {
        el.setAttribute("href", url);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      });
      if (note) note.hidden = true;
      return;
    }

    // No ordering platform yet — send people to the phone instead.
    if (DATA.phoneDial) {
      $$('[data-order-link]').forEach(function (el) {
        el.setAttribute("href", "tel:" + DATA.phoneDial);
      });
    }
  }

  /* ── Weekly schedule ─────────────────────────────────────────── */
  function renderSchedule() {
    var list = $('[data-schedule]');
    if (!list) return;

    var rows = DATA.schedule || [];
    if (!rows.length) {
      list.innerHTML = '<li class="schedule-empty">Schedule coming soon — check our Facebook for this week\'s stops.</li>';
      return;
    }

    var today = new Date().getDay();
    var frag = document.createDocumentFragment();
    var todayStop = null;

    rows.forEach(function (stop) {
      var li = document.createElement("li");
      li.className = "schedule-row" + (stop.open === false ? " is-closed" : "");

      var isToday = stop.day === today;
      if (isToday) {
        li.classList.add("is-today");
        if (stop.open !== false) todayStop = stop;
      }

      var day = document.createElement("div");
      day.className = "schedule-day";
      day.textContent = stop.label || "";
      if (isToday) {
        var badge = document.createElement("span");
        badge.className = "today-badge";
        badge.textContent = "Today";
        day.appendChild(badge);
      }

      var where = document.createElement("div");
      where.className = "schedule-where";
      var strong = document.createElement("strong");
      strong.textContent = stop.place || "";
      var addr = document.createElement("span");
      addr.textContent = stop.address || "";
      where.appendChild(strong);
      where.appendChild(addr);

      var time = document.createElement("div");
      time.className = "schedule-time";
      time.textContent = stop.time || "";

      li.appendChild(day);
      li.appendChild(where);
      li.appendChild(time);
      frag.appendChild(li);
    });

    list.innerHTML = "";
    list.appendChild(frag);

    var heroNext = $('[data-hero-next]');
    if (heroNext) {
      heroNext.textContent = todayStop
        ? todayStop.place + " · " + todayStop.time
        : "See this week's stops";
    }
  }

  // An explicit endpoint always wins. Otherwise requests are emailed to
  // the address the site already advertises, so there is never a second
  // inbox to remember.
  function resolveEndpoint() {
    var explicit = (DATA.formEndpoint || "").trim();
    if (explicit) return explicit;
    if ((DATA.formService || "") === "formsubmit" && DATA.email) {
      return "https://formsubmit.co/ajax/" + encodeURIComponent(DATA.email);
    }
    return "";
  }

  /* ── Booking calendar ────────────────────────────────────────── */
  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  // Local-midnight date from "YYYY-MM-DD". Parsing the string directly
  // with new Date() would treat it as UTC and shift the day westward.
  function parseDay(iso) {
    var p = String(iso).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function key(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  // A one-event .ics the customer can save to their own calendar.
  // Built client-side so it works with no server and no third party.
  function icsFor(ev) {
    // Commas, semicolons and backslashes are delimiters in .ics text
    // values — an address like "Main St, Baton Rouge" splits the field
    // in two unless they're escaped.
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
    }
    var d = ev.date.replace(/-/g, "");
    var next = parseDay(ev.date);
    next.setDate(next.getDate() + 1);
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Bayou Eatz//Stops//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + d + "-bayoueatz@" + (DATA.siteUrl || "bayoueatz").replace(/^https?:\/\//, ""),
      "DTSTAMP:" + d + "T000000Z",
      "DTSTART;VALUE=DATE:" + d,
      "DTEND;VALUE=DATE:" + key(next).replace(/-/g, ""),
      "SUMMARY:" + esc("Bayou Eatz — " + ev.title),
      "DESCRIPTION:" + esc([ev.time, ev.place].filter(Boolean).join(" | ")),
      ev.place ? "LOCATION:" + esc(ev.place) : "",
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean);
    // .ics requires CRLF line endings
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
  }

  function mapsUrl(place) {
    // Only add the town when the stop doesn't already name it, so a full
    // street address doesn't come out as "…, Baton Rouge, Baton Rouge".
    var q = place;
    var lower = place.toLowerCase();
    if (DATA.city && lower.indexOf(DATA.city.toLowerCase()) === -1) {
      q += ", " + DATA.city;
      if (DATA.region) q += ", " + DATA.region;
    }
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }

  function initCalendar() {
    var grid = $('[data-cal-grid]');
    if (!grid) return;

    var title = $('[data-cal-title]');
    var prev  = $('[data-cal-prev]');
    var next  = $('[data-cal-next]');
    var list  = $('[data-cal-upcoming]');

    // Group bookings by date so a day can hold more than one.
    var byDate = {};
    (DATA.bookings || []).forEach(function (b) {
      if (!b || !b.date) return;
      (byDate[b.date] = byDate[b.date] || []).push(b);
    });

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);

    function dayLabel(d, events) {
      var parts = [DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate()];
      if (!events.length) parts.push("open for booking");
      events.forEach(function (e) {
        parts.push(e.title + (e.time ? ", " + e.time : "") + (e.place ? ", " + e.place : ""));
      });
      return parts.join(" — ");
    }

    function render() {
      title.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();

      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var start = new Date(first);
      start.setDate(1 - first.getDay());          // back up to Sunday
      var frag = document.createDocumentFragment();

      for (var i = 0; i < 42; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        var inMonth = d.getMonth() === view.getMonth();
        var events = byDate[key(d)] || [];
        var past = d < today;

        var cell = document.createElement("div");
        cell.className = "cal-day";
        if (!inMonth) cell.classList.add("is-outside");
        if (past) cell.classList.add("is-past");
        if (d.getTime() === today.getTime()) cell.classList.add("is-today");
        if (events.length) {
          cell.classList.add(events.some(function (e) { return e.type === "private"; })
            ? "is-private" : "is-public");
        }

        var num = document.createElement("span");
        num.className = "cal-num";
        num.textContent = String(d.getDate());
        cell.appendChild(num);

        if (inMonth && events.length) {
          var wrap = document.createElement("span");
          wrap.className = "cal-events";
          events.forEach(function (e) {
            var chip = document.createElement("span");
            chip.className = "cal-chip cal-chip-" + (e.type === "private" ? "private" : "public");
            chip.textContent = e.title;
            wrap.appendChild(chip);
          });
          cell.appendChild(wrap);
        }

        if (inMonth) {
          cell.tabIndex = 0;
          cell.setAttribute("role", "button");
          cell.setAttribute("aria-label", dayLabel(d, events) + " — request this date");
          cell.dataset.date = key(d);
          cell.addEventListener("click", function () { requestDate(this.dataset.date); });
          cell.addEventListener("keydown", function (ev) {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              requestDate(this.dataset.date);
            }
          });
        } else {
          cell.setAttribute("aria-hidden", "true");
        }

        frag.appendChild(cell);
      }

      grid.innerHTML = "";
      grid.appendChild(frag);

      // Don't let people page back before the current month.
      prev.disabled = view.getFullYear() === today.getFullYear() &&
                      view.getMonth() === today.getMonth();
    }

    function renderUpcoming() {
      if (!list) return;
      var upcoming = (DATA.bookings || [])
        .filter(function (b) { return b && b.date && parseDay(b.date) >= today; })
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; })
        .slice(0, 5);

      list.innerHTML = "";
      if (!upcoming.length) {
        var li = document.createElement("li");
        li.className = "cal-none";
        li.textContent = "Nothing on the books yet — the calendar is wide open.";
        list.appendChild(li);
        return;
      }

      upcoming.forEach(function (e) {
        var d = parseDay(e.date);
        var li = document.createElement("li");
        li.className = "cal-up " + (e.type === "private" ? "is-private" : "is-public");

        var when = document.createElement("span");
        when.className = "cal-up-date";
        when.innerHTML = "<strong>" + d.getDate() + "</strong>" +
                         "<small>" + MONTHS[d.getMonth()].slice(0, 3) + "</small>";

        var body = document.createElement("span");
        body.className = "cal-up-body";
        var t = document.createElement("strong");
        t.textContent = e.title;
        body.appendChild(t);

        var meta = [e.time, e.place].filter(Boolean).join(" · ");
        if (meta) {
          var m = document.createElement("small");
          m.textContent = meta;
          body.appendChild(m);
        }

        // Public stops get directions and a save-to-calendar link.
        // Private bookings get neither — nobody needs directions to
        // somebody else's wedding.
        if (e.type !== "private") {
          var actions = document.createElement("span");
          actions.className = "cal-up-actions";

          if (e.place) {
            var dir = document.createElement("a");
            dir.href = mapsUrl(e.place);
            dir.target = "_blank";
            dir.rel = "noopener";
            dir.textContent = "Directions";
            actions.appendChild(dir);
          }

          var ics = document.createElement("a");
          ics.href = icsFor(e);
          ics.setAttribute("download", "bayou-eatz-" + e.date + ".ics");
          ics.textContent = "Add to calendar";
          actions.appendChild(ics);

          body.appendChild(actions);
        }

        li.appendChild(when);
        li.appendChild(body);
        list.appendChild(li);
      });
    }

    // Clicking a day carries it into the booking form, so a calendar
    // date and a typed request land in the same inbox the same way.
    function requestDate(iso) {
      var input = $('#q-date');
      var section = $('#catering');
      if (input) input.value = iso;
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      var name = $('#q-name');
      if (name) setTimeout(function () { name.focus({ preventScroll: true }); }, 500);

      var status = $('[data-form-status]');
      if (status) {
        var d = parseDay(iso);
        status.textContent = "Asking about " + MONTHS[d.getMonth()] + " " +
                             d.getDate() + ", " + d.getFullYear() + ".";
        status.className = "form-status";
      }
    }

    function shift(months) {
      view = new Date(view.getFullYear(), view.getMonth() + months, 1);
      render();
    }

    prev.addEventListener("click", function () { shift(-1); });
    next.addEventListener("click", function () { shift(1); });

    render();
    renderUpcoming();

    // Surface today's stop in the hero.
    var heroNext = $('[data-hero-next]');
    if (heroNext) {
      var mine = byDate[key(today)];
      if (mine && mine.length) {
        var e = mine[0];
        heroNext.textContent = e.type === "private"
          ? "Out on a private event"
          : e.title + (e.time ? " · " + e.time : "");
      }
    }
  }


  /* ── Hours + service area ────────────────────────────────────── */
  function applyHours() {
    var list = $('[data-hours]');
    if (list && (DATA.hours || []).length) {
      list.innerHTML = "";
      DATA.hours.forEach(function (h) {
        var li = document.createElement("li");
        li.textContent = h.days + " · " + h.label;
        list.appendChild(li);
      });
    }
    if (DATA.serviceArea) {
      $$('[data-service-area]').forEach(function (el) { el.textContent = DATA.serviceArea; });
    }
  }

  /* ── Reviews ─────────────────────────────────────────────────── */
  function renderReviews() {
    var host = $('[data-reviews]');
    var section = $('[data-reviews-section]');
    if (!host || !section) return;

    var reviews = DATA.reviews || [];
    if (!reviews.length) return;          // stays hidden — never invent quotes

    reviews.forEach(function (r) {
      var li = document.createElement("li");
      li.className = "review";
      var q = document.createElement("blockquote");
      q.textContent = r.quote;
      var cite = document.createElement("cite");
      cite.textContent = r.name + (r.event ? " · " + r.event : "");
      li.appendChild(q);
      li.appendChild(cite);
      host.appendChild(li);
    });
    section.hidden = false;
  }

  /* ── Email alerts signup ─────────────────────────────────────── */
  function initSignup() {
    var form = $('[data-signup-form]');
    if (!form) return;
    var status = $('[data-signup-status]');
    var input = $('#s-email', form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if ($('#s-company', form).value) return;         // honeypot

      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        status.textContent = "That email doesn't look right — mind checking it?";
        status.className = "form-status is-error";
        input.focus();
        return;
      }

      var endpoint = resolveEndpoint();
      status.textContent = "Adding you…";
      status.className = "form-status";

      if (!endpoint) {
        window.location.href = "mailto:" + (DATA.email || "") +
          "?subject=" + encodeURIComponent("Add me to the Bayou Eatz list") +
          "&body=" + encodeURIComponent("Please add " + value + " to your list.");
        status.textContent = "Opening your email app — just hit send.";
        status.className = "form-status is-ok";
        return;
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          _subject: "New email-list signup — " + value,
          _template: "table",
          _captcha: "false"
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("failed");
          form.reset();
          status.textContent = "You're on the list. See you at the window.";
          status.className = "form-status is-ok";
        })
        .catch(function () {
          status.textContent = "That didn't go through — email " + (DATA.email || "us") + " and we'll add you.";
          status.className = "form-status is-error";
        });
    });
  }

  /* ── Structured data ─────────────────────────────────────────── */
  // The business block is written statically in index.html so crawlers
  // that don't run scripts still see it; this refreshes it from
  // site-data.js so editing one file can't leave the other stale.
  function applySchema() {
    var base = (DATA.siteUrl || "").replace(/\/$/, "");

    var biz = $('[data-schema-business]');
    if (biz) {
      try {
        var o = JSON.parse(biz.textContent);
        if (DATA.phoneDial) o.telephone = DATA.phoneDial;
        if (DATA.email) o.email = DATA.email;
        if (DATA.serviceArea) o.areaServed = DATA.serviceArea;
        if (DATA.ownerName) o.founder = { "@type": "Person", name: DATA.ownerName, jobTitle: DATA.ownerTitle || "" };
        o.sameAs = [DATA.facebook, DATA.instagram].filter(Boolean);
        if (base) {
          o["@id"] = base + "/#business";
          o.url = base + "/";
          o.logo = base + "/assets/img/logo.webp";
          o.image = base + "/assets/img/og-card.jpg";
          o.hasMenu = base + "/#menu";
        }
        var spec = (DATA.hours || []).filter(function (h) { return !h.closed && h.opens && h.closes; })
          .map(function (h) {
            return {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: h.schemaDays || [],
              opens: h.opens,
              closes: h.closes
            };
          });
        if (spec.length) o.openingHoursSpecification = spec;
        biz.textContent = JSON.stringify(o, null, 2);
      } catch (err) { /* leave the static block exactly as authored */ }
    }

    // Read the FAQ back out of the page so the markup stays the single
    // source — edit a question in index.html and this follows.
    var faqEl = $('[data-schema-faq]');
    var items = $$('.faq-item');
    if (faqEl && items.length) {
      faqEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map(function (el) {
          return {
            "@type": "Question",
            name: (el.querySelector("summary") || {}).textContent || "",
            acceptedAnswer: {
              "@type": "Answer",
              text: (el.querySelector("p") || {}).textContent || ""
            }
          };
        })
      }, null, 2);
    }

    // Only public stops become events — private bookings stay private.
    var evEl = $('[data-schema-events]');
    if (evEl) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var events = (DATA.bookings || [])
        .filter(function (b) { return b.type === "public" && parseDay(b.date) >= today; })
        .map(function (b) {
          var e = {
            "@type": "FoodEvent",
            name: "Bayou Eatz — " + b.title,
            startDate: b.date,
            eventStatus: "https://schema.org/EventScheduled",
            organizer: { "@type": "Organization", name: "Bayou Eatz", url: base ? base + "/" : undefined }
          };
          if (b.place) e.location = { "@type": "Place", name: b.place };
          return e;
        });
      if (events.length) {
        evEl.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": events }, null, 2);
      }
    }
  }

  /* ── Mobile nav ──────────────────────────────────────────────── */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 800) close();
    });
  }

  /* ── Sticky header shadow ────────────────────────────────────── */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── Menu tabs ───────────────────────────────────────────────── */
  function initTabs() {
    var tabs = $$('.menu-tabs [role="tab"]');
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft")  next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home")       next = tabs[0];
        if (e.key === "End")        next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  }

  /* ── Catering quote form ─────────────────────────────────────── */
  function initForm() {
    var form = $('[data-quote-form]');
    if (!form) return;
    var status = $('[data-form-status]', form);

    function setError(input, message) {
      var field = input.closest(".field");
      if (!field) return;
      field.classList.toggle("has-error", Boolean(message));
      var el = $('.field-error', field);
      if (message) {
        if (!el) {
          el = document.createElement("p");
          el.className = "field-error";
          field.appendChild(el);
        }
        el.textContent = message;
        input.setAttribute("aria-invalid", "true");
      } else {
        if (el) el.remove();
        input.removeAttribute("aria-invalid");
      }
    }

    function validate() {
      var ok = true;
      var name = $('#q-name', form);
      var email = $('#q-email', form);

      if (!name.value.trim()) { setError(name, "Please tell us your name."); ok = false; }
      else setError(name, "");

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        setError(email, "Please enter a valid email address."); ok = false;
      } else setError(email, "");

      return ok;
    }

    function say(message, kind) {
      status.textContent = message;
      status.className = "form-status" + (kind ? " is-" + kind : "");
    }

    function mailtoFallback(data) {
      var to = DATA.email || "hello@bayoueatz.com";
      var body = [
        "Name: " + data.name,
        "Email: " + data.email,
        "Phone: " + (data.phone || "—"),
        "Event date: " + (data.date || "—"),
        "Guests: " + (data.guests || "—"),
        "Service: " + (data.service || "—"),
        "",
        "Details:",
        data.details || "—"
      ].join("\n");

      window.location.href = "mailto:" + to +
        "?subject=" + encodeURIComponent("Catering request — " + data.name) +
        "&body=" + encodeURIComponent(body);

      say("Opening your email app with the details filled in — just hit send.", "ok");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: bots fill hidden fields, people don't.
      if ($('#q-company', form).value) return;

      if (!validate()) { say("Please fix the highlighted fields.", "error"); return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      delete data.company;

      var endpoint = resolveEndpoint();
      if (!endpoint) { mailtoFallback(data); return; }

      // Give Chef Joe a subject line he can scan in his inbox, and make
      // "reply" go straight back to the customer.
      data._subject = "Booking request — " + data.name +
                      (data.date ? " — " + data.date : "");
      data._template = "table";
      data._captcha = "false";
      data._replyto = data.email;

      var submitBtn = $('button[type="submit"]', form);
      submitBtn.disabled = true;
      say("Sending…");

      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          say("Sent — your request is in Chef Joe's inbox. You'll hear back within one business day.", "ok");
        })
        .catch(function () {
          // Don't lose the customer's typing: hand it to their mail app.
          say("Couldn't send that automatically — opening your email app instead.", "error");
          mailtoFallback(data);
        })
        .then(function () { submitBtn.disabled = false; });
    });
  }

  /* ── Reveal on scroll ────────────────────────────────────────── */
  function initReveal() {
    var targets = $$('.section-head, .schedule, .find-note, .menu-board, .story-copy, .story-figure, .catering-copy, .catering-form-card, .gallery-grid, .order-inner');
    if (!("IntersectionObserver" in window)) return;

    targets.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }


  /* ── Hero parallax ───────────────────────────────────────────────
     Drifts the backdrop at a fraction of scroll speed. rAF-throttled,
     and skipped entirely for anyone who asked for less motion.      */
  function initParallax() {
    var el = $('[data-parallax]');
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ticking = false;
    function update() {
      var y = window.scrollY;
      // Once the hero is off screen there is nothing to move.
      if (y < window.innerHeight * 1.3) {
        el.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ── Live status pill ────────────────────────────────────────────
     Reads today off the calendar first, then falls back to the weekly
     route, so the hero always says something true.                  */
  function initStatus() {
    var pill = $('[data-status-pill]');
    var text = $('[data-status-text]');
    if (!pill || !text) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var iso = key(today);

    var todays = (DATA.bookings || []).filter(function (b) { return b.date === iso; });
    if (todays.length) {
      var ev = todays[0];
      if (ev.type === "private") {
        pill.classList.add("is-booked");
        text.textContent = "Out on a private event today";
      } else {
        pill.classList.add("is-open");
        text.textContent = "Today · " + ev.title + (ev.time ? " · " + ev.time : "");
      }
      return;
    }

    var stop = (DATA.schedule || []).filter(function (s) { return s.day === today.getDay(); })[0];
    if (stop && stop.open !== false) {
      pill.classList.add("is-open");
      text.textContent = "Today · " + stop.place + (stop.time ? " · " + stop.time : "");
      return;
    }

    // Closed is a dead end on its own — say when we're back instead.
    var next = nextOpening(today);
    text.textContent = next
      ? "Closed today · back " + next.label + (next.time ? ", " + next.time : "")
      : "Closed today — see the calendar";
  }

  // Walks forward a week looking for the next serving day, checking the
  // calendar's public stops first and the weekly route second.
  function nextOpening(from) {
    for (var i = 1; i <= 7; i++) {
      var d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);

      var booked = (DATA.bookings || []).filter(function (b) {
        return b.date === key(d) && b.type === "public";
      })[0];
      if (booked) {
        return { label: DAYS[d.getDay()], time: booked.time || "" };
      }

      var stop = (DATA.schedule || []).filter(function (s) {
        return s.day === d.getDay() && s.open !== false;
      })[0];
      if (stop) return { label: DAYS[d.getDay()], time: stop.time || "" };
    }
    return null;
  }

  /* ── Gallery lightbox ────────────────────────────────────────────
     Uses <dialog> so focus trapping and Escape come from the platform
     rather than being reimplemented badly.                          */
  function initLightbox() {
    var dialog = $('[data-lightbox-dialog]');
    var images = $$('img[data-lightbox]');
    if (!dialog || !images.length || typeof dialog.showModal !== "function") return;

    var img = $('[data-lightbox-img]', dialog);
    var cap = $('[data-lightbox-caption]', dialog);
    var index = 0;

    function show(i) {
      index = (i + images.length) % images.length;
      var src = images[index];
      img.src = src.currentSrc || src.src;
      img.alt = src.alt || "";
      var figcap = src.closest("figure") && src.closest("figure").querySelector("figcaption");
      cap.textContent = figcap ? figcap.textContent : (src.alt || "");
    }

    images.forEach(function (el, i) {
      el.addEventListener("click", function () { show(i); dialog.showModal(); });
    });

    $('[data-lightbox-next]', dialog).addEventListener("click", function () { show(index + 1); });
    $('[data-lightbox-prev]', dialog).addEventListener("click", function () { show(index - 1); });
    $('[data-lightbox-close]', dialog).addEventListener("click", function () { dialog.close(); });

    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); show(index - 1); }
    });

    // Click the backdrop (but not the photo) to dismiss.
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });

    // Swipe on touch.
    var x0 = null;
    dialog.addEventListener("touchstart", function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  }

  /* ── Scroll-spy ──────────────────────────────────────────────────
     Marks the nav link for whichever section owns the viewport.     */
  function initScrollSpy() {
    var links = $$('.site-nav ul a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var sections = links.map(function (a) {
      var el = document.querySelector(a.getAttribute("href"));
      if (el) map[el.id] = a;
      return el;
    }).filter(Boolean);

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var best = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; best = id; }
      });
      links.forEach(function (a) { a.classList.remove("is-current"); });
      if (best && map[best]) map[best].classList.add("is-current");
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ── Mobile action bar ───────────────────────────────────────────
     Held back over the hero, where the page already shows big CTAs.  */
  function initActionBar() {
    var bar = $('[data-action-bar]');
    if (!bar) return;

    var phoneBtn = $('[data-phone-href]', bar);
    if (phoneBtn && DATA.phoneDial) phoneBtn.setAttribute("href", "tel:" + DATA.phoneDial);

    var hero = $('.hero');
    var trigger = hero ? hero.offsetHeight * 0.6 : 400;
    var ticking = false;
    function update() {
      bar.classList.toggle("is-visible", window.scrollY > trigger);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ── Favorites → menu tab ────────────────────────────────────────
     A showcase card opens the board on the category it belongs to.  */
  function initMenuJumps() {
    $$('[data-menu-jump]').forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var tab = document.getElementById("tab-" + el.dataset.menuJump);
        if (tab) {
          tab.click();
          tab.scrollIntoView({ behavior: "smooth", block: "center" });
          tab.focus({ preventScroll: true });
        }
      });
    });
  }

  /* ── Misc ────────────────────────────────────────────────────── */
  function initYear() {
    var el = $('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  applyContact();
  applyHours();
  applyOrderLinks();
  renderSchedule();
  initCalendar();
  initNav();
  initHeader();
  initTabs();
  initForm();
  initSignup();
  renderReviews();
  applySchema();
  initReveal();
  initParallax();
  initStatus();
  initLightbox();
  initScrollSpy();
  initActionBar();
  initMenuJumps();
  initYear();
})();
