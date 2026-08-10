/* Bayou Eatz — owner console.
   Turns one short form into the three things Chef Joe actually needs:
   a row for the schedule sheet, a post for socials, and (if he'd rather
   not keep a sheet) the line of code that does the same job.
   Nothing here talks to a server. */
(function () {
  "use strict";

  var DATA = window.BAYOU || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var form = $('[data-post-form]');
  if (!form) return;

  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

  var outRow    = $('[data-out-row]');
  var outSocial = $('[data-out-social]');
  var outCode   = $('[data-out-code]');
  var outSheet  = $('[data-out-sheet]');
  var note      = $('[data-copy-note]');
  var dayHint   = $('[data-day-hint]');
  var sheetLink = $('[data-sheet-link]');

  /* Default to today so the common case — posting where you are right
     now — needs no date fiddling at all. */
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  $('#p-date').value = today();

  function parseDay(iso) {
    var p = String(iso).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function values() {
    var fd = new FormData(form);
    var type = fd.get("type") || "public";
    return {
      date:  (fd.get("date") || "").trim(),
      type:  type,
      what:  (fd.get("what") || "").trim(),
      where: type === "private" ? "" : (fd.get("where") || "").trim(),
      time:  (fd.get("time") || "").trim(),
      note:  (fd.get("note") || "").trim()
    };
  }

  /* ── The sheet row ──────────────────────────────────────────────
     Tab-separated, because that's what spreadsheets split on paste —
     one paste fills all seven columns instead of one. */
  function rowFor(v) {
    return [v.date, v.type, v.what, v.where, v.time, v.note, ""].join("\t");
  }

  /* ── The social post ────────────────────────────────────────────
     Written the way a person would say it, not the way a form stores
     it. Private bookings never name the venue. */
  function socialFor(v) {
    if (!v.date || !v.what) return "";

    var d = parseDay(v.date);
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var isToday = d.getTime() === now.getTime();
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var isTomorrow = d.getTime() === tomorrow.getTime();

    var when = isToday ? "TODAY"
             : isTomorrow ? "TOMORROW"
             : DAYS[d.getDay()].toUpperCase() + ", " + MONTHS[d.getMonth()].toUpperCase() + " " + d.getDate();

    var lines = [];

    if (v.type === "private") {
      lines.push("🚚 " + when + " we're out on a private event — back at it soon.");
      if (v.time) lines.push("");
      lines.push("Want the truck at yours? " + (DATA.phoneDisplay || "") + " or " + (DATA.email || "") + ".");
    } else {
      lines.push("🚨 " + when + " 🚨");
      lines.push("");
      lines.push(v.what.toUpperCase());
      if (v.where) lines.push("📍 " + v.where);
      if (v.time)  lines.push("🕐 " + v.time);
      if (v.note)  lines.push("❗ " + v.note);
      lines.push("");
      lines.push("Loaded fries, wings, baskets — all fried to order. Come see us.");
      lines.push("");
      lines.push("#BayouEatz #TasteTheBayou #FoodTruck" +
                 (DATA.city ? " #" + DATA.city.replace(/[^A-Za-z]/g, "") : ""));
    }
    return lines.join("\n");
  }

  /* ── The code line, for anyone editing the file directly ────────── */
  function codeFor(v) {
    function q(s) { return JSON.stringify(String(s)); }
    var parts = [
      "date: "  + q(v.date),
      "type: "  + q(v.type),
      "title: " + q(v.what)
    ];
    if (v.time)  parts.push("time: " + q(v.time));
    if (v.where) parts.push("place: " + q(v.where));
    if (v.note)  parts.push("note: " + q(v.note));
    return "{ " + parts.join(", ") + " },";
  }

  function render() {
    var v = values();

    if (dayHint) {
      dayHint.textContent = v.date
        ? DAYS[parseDay(v.date).getDay()] + ", " +
          MONTHS[parseDay(v.date).getMonth()] + " " + parseDay(v.date).getDate()
        : "";
    }

    // "Where" is meaningless on a private booking — hide it rather than
    // leave a field that shouldn't be filled in.
    var whereField = $('[data-where-field]');
    if (whereField) whereField.hidden = v.type === "private";

    var ready = v.date && v.what;
    outRow.textContent    = ready ? rowFor(v) : "Add a date and a name and the row appears here.";
    outSocial.textContent = ready ? socialFor(v) : "Add a date and a name and the post appears here.";
    outCode.textContent   = ready ? codeFor(v) : "—";
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  /* ── Sheet ID helper ─────────────────────────────────────────────
     Accepts a bare ID or the whole address pasted out of the browser,
     because that's what people actually copy. */
  var sheetInput = $('[data-sheet-id]');
  function sheetId() {
    var raw = (sheetInput && sheetInput.value || "").trim();
    var m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : raw;
  }
  function renderSheet() {
    var id = sheetId();
    if (!id) {
      outSheet.textContent = "Paste an ID above and the line to save will appear here.";
      return;
    }
    outSheet.textContent =
      'stopsSheet: {\n' +
      '  sheetId:   "' + id + '",\n' +
      '  sheetName: "Stops",\n' +
      '  timeoutMs: 6000\n' +
      '},\n\n' +
      '↑ replace the stopsSheet block in assets/js/site-data.js with this.';
  }
  if (sheetInput) sheetInput.addEventListener("input", function () {
    renderSheet();
    updateSheetLink();
  });

  function updateSheetLink() {
    if (!sheetLink) return;
    var id = sheetId() || ((DATA.stopsSheet || {}).sheetId || "");
    if (id) {
      sheetLink.href = "https://docs.google.com/spreadsheets/d/" + id + "/edit";
      sheetLink.hidden = false;
    } else {
      sheetLink.href = "https://docs.google.com/spreadsheets/";
      sheetLink.textContent = "Open Google Sheets";
    }
  }

  /* ── Copy ────────────────────────────────────────────────────────
     execCommand is the fallback: the clipboard API needs a secure
     origin, and this page may well be opened straight off a phone. */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  var SOURCES = {
    row:    function () { return outRow.textContent; },
    social: function () { return outSocial.textContent; },
    code:   function () { return outCode.textContent; },
    sheet:  function () { return outSheet.textContent.split("\n\n↑")[0]; }
  };

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = SOURCES[btn.dataset.copy]();
      var label = btn.textContent;
      copyText(text).then(function () {
        btn.textContent = "Copied";
        if (note) note.textContent = "Copied. Paste it into the first empty row of your sheet.";
        setTimeout(function () { btn.textContent = label; }, 1800);
      }).catch(function () {
        if (note) note.textContent = "Couldn't copy automatically — select the text and copy it.";
      });
    });
  });

  /* Phones can hand the post straight to Facebook or Messages. */
  var shareBtn = $('[data-share]');
  if (shareBtn && navigator.share) {
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", function () {
      navigator.share({ text: outSocial.textContent }).catch(function () { /* dismissed */ });
    });
  }

  render();
  renderSheet();
  updateSheetLink();
})();
