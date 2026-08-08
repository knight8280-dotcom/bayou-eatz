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
    if (DATA.email) {
      $$('[data-email-link]').forEach(function (el) {
        el.textContent = DATA.email;
        el.setAttribute("href", "mailto:" + DATA.email);
      });
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

      var endpoint = (DATA.formEndpoint || "").trim();
      if (!endpoint) { mailtoFallback(data); return; }

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
          say("Thank you — we got it. We'll be in touch within one business day.", "ok");
        })
        .catch(function () {
          say("That didn't go through. Please call us or email " + (DATA.email || "us") + " directly.", "error");
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

  /* ── Misc ────────────────────────────────────────────────────── */
  function initYear() {
    var el = $('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  applyContact();
  applyOrderLinks();
  renderSchedule();
  initNav();
  initHeader();
  initTabs();
  initForm();
  initReveal();
  initYear();
})();
