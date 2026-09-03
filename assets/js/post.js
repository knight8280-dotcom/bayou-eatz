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
      note:  (fd.get("note") || "").trim(),
      photo: (fd.get("photo") || "").trim()
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

  form.addEventListener("input", function () { render(); renderTargets(); });
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


  /* ── Publishing straight to the site ─────────────────────────────
     The Apps Script endpoint runs as the sheet's owner, so the browser
     never holds a Google credential — only the web-app address and a
     passcode Chef Joe types.

     Apps Script redirects its response through googleusercontent, which
     makes a readable cross-origin reply unreliable. Rather than guess,
     the request goes out no-cors and then the sheet is re-read until the
     post shows up. Slower to confirm, but it's the truth rather than an
     optimistic "sent".                                                */
  var publishCard = $('[data-publish-card]');
  var publishNote = $('[data-publish-note]');
  var codeInput   = $('[data-publish-code]');
  var rememberBox = $('[data-publish-remember]');
  var CODE_KEY    = "bayou.publish.code";

  function publishUrl() {
    return String((DATA.publishUrl || "")).trim();
  }

  if (publishCard && publishUrl()) {
    publishCard.hidden = false;
    try {
      var saved = localStorage.getItem(CODE_KEY);
      if (saved && codeInput) {
        codeInput.value = saved;
        if (rememberBox) rememberBox.checked = true;
      }
    } catch (e) { /* private browsing — just type it each time */ }
  }

  function renderTargets() {
    var el = $('[data-publish-targets]');
    if (!el) return;
    var v = values();
    var bits = ["Website"];
    bits.push("Facebook");
    bits.push(v.photo ? "Instagram" : "Instagram (needs a photo)");
    el.textContent = "Goes to: " + bits.join(" · ");
  }

  function say(msg, kind) {
    if (!publishNote) return;
    publishNote.textContent = msg;
    publishNote.className = "out-note" + (kind ? " is-" + kind : "");
  }

  // gviz hands timestamps back as "Date(2026,7,15,18,4,0)".
  function stamp(cell) {
    if (!cell) return 0;
    var v = cell.v == null ? cell.f : cell.v;
    var g = String(v == null ? "" : v).match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?/);
    if (g) return new Date(+g[1], +g[2], +g[3], +(g[4] || 0), +(g[5] || 0), +(g[6] || 0)).getTime();
    var d = new Date(String(v));
    return isNaN(d) ? 0 : d.getTime();
  }

  // Ask the sheet what its newest post is. Returns a promise for that
  // row's headline, timestamp, share status and the row count.
  function latestPosted() {
    return new Promise(function (resolve) {
      var cfg = DATA.stopsSheet || {};
      var id = (cfg.sheetId || "").trim();
      if (!id) return resolve(null);

      var CB = "__bayouCheck" + Date.now();
      var s = document.createElement("script");
      var t = setTimeout(function () { cleanup(); resolve(null); }, 5000);

      function cleanup() {
        clearTimeout(t);
        try { delete window[CB]; } catch (e) { window[CB] = undefined; }
        if (s.parentNode) s.parentNode.removeChild(s);
      }

      window[CB] = function (res) {
        var out = null;
        try {
          var rows = (res.table && res.table.rows) || [];
          var heads = (res.table.cols || []).map(function (c) {
            return String((c && (c.label || c.id)) || "").toLowerCase().trim();
          });
          var iHead = heads.indexOf("headline");
          var iShared = heads.indexOf("shared");
          // Rows arrive in append order, so the last one is the newest.
          var iPosted = heads.indexOf("posted");
          for (var n = rows.length - 1; n >= 0; n--) {
            var c = rows[n] && rows[n].c;
            if (!c) continue;
            var head = c[iHead] && (c[iHead].f != null ? c[iHead].f : c[iHead].v);
            if (head == null) continue;
            out = {
              headline: String(head).trim(),
              count: rows.length,
              posted: iPosted >= 0 ? stamp(c[iPosted]) : 0,
              shared: iShared >= 0 && c[iShared]
                ? String(c[iShared].f != null ? c[iShared].f : c[iShared].v).trim()
                : ""
            };
            break;
          }
        } catch (e) { out = null; }
        cleanup();
        resolve(out);
      };

      s.src = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(id) +
              "/gviz/tq?tqx=out:json;responseHandler:" + CB +
              "&sheet=" + encodeURIComponent(cfg.postsName || "Posts") +
              "&_=" + Date.now();
      s.onerror = function () { cleanup(); resolve(null); };
      document.head.appendChild(s);
    });
  }

  // Turn the sheet's terse "FB ✓ · IG –" into something worth reading.
  function shareMessage(shared) {
    if (!shared || shared === "site only") {
      return "Posted. It's on the website now.";
    }
    var went = ["the website"];
    if (shared.indexOf("FB ✓") > -1) went.push("Facebook");
    if (shared.indexOf("IG ✓") > -1) went.push("Instagram");
    var msg = "Posted to " + (went.length > 1
      ? went.slice(0, -1).join(", ") + " and " + went[went.length - 1]
      : went[0]) + ".";
    if (shared.indexOf("IG –") > -1) msg += " Instagram was skipped — no photo on this one.";
    if (shared.indexOf("✗") > -1) msg += " One of the socials refused it — check the script's logs.";
    return msg;
  }
  function shareKind(shared) {
    return (shared && shared.indexOf("✗") > -1) ? "error" : "ok";
  }

  var publishBtn = $('[data-publish]');
  if (publishBtn) {
    publishBtn.addEventListener("click", function () {
      var v = values();
      if (!v.date || !v.what) {
        say("Add a date and a name first.", "error");
        return;
      }
      var code = (codeInput && codeInput.value || "").trim();
      if (!code) {
        say("Enter your passcode.", "error");
        if (codeInput) codeInput.focus();
        return;
      }

      try {
        if (rememberBox && rememberBox.checked) localStorage.setItem(CODE_KEY, code);
        else localStorage.removeItem(CODE_KEY);
      } catch (e) { /* nothing to do */ }

      publishBtn.disabled = true;
      say("Publishing…");

      // Snapshot the sheet first so the confirmation can insist on a row
      // that is genuinely newer than anything already there. Without this
      // a headline he uses every week would "confirm" a rejected post.
      var before = null;
      var snapshot = latestPosted().then(function (b) { before = b; });

      // text/plain keeps this a "simple" request, so the browser doesn't
      // preflight it — Apps Script can't answer a preflight.
      snapshot.then(function () { return fetch(publishUrl(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          passcode: code,
          date:     v.date,
          type:     v.type,
          headline: v.what,
          where:    v.where,
          when:     v.time,
          message:  v.note,
          photo:    v.photo,
          // Send the caption the page just showed him, so what he read in
          // the preview is word-for-word what goes out.
          caption:  socialFor(v)
        })
      }); })
      .then(function () {
        // Give the sheet a moment, then check it really landed.
        say("Sent — checking it went through…");
        var tries = 0;
        (function poll() {
          tries++;
          setTimeout(function () {
            latestPosted().then(function (found) {
              var isNew = found && found.headline === v.what && (
                !before ||
                found.count > before.count ||
                (found.posted && found.posted > (before.posted || 0))
              );
              if (isNew) {
                say(shareMessage(found.shared), shareKind(found.shared));
                publishBtn.disabled = false;
                return;
              }
              if (tries < 4) return poll();
              say("Sent, but we couldn't confirm it landed. Check the sheet — " +
                  "and if the row isn't there, the passcode is usually the reason.", "error");
              publishBtn.disabled = false;
            });
          }, 1500);
        })();
      })
      .catch(function () {
        say("Couldn't reach the publishing address. Use the copy-and-paste row below instead.", "error");
        publishBtn.disabled = false;
      });
    });
  }

  /* Setup helper for the publish URL */
  var pubInput = $('[data-publish-url]');
  var pubOut = $('[data-out-publish]');
  function renderPublishSetting() {
    if (!pubOut) return;
    var raw = (pubInput && pubInput.value || "").trim();
    pubOut.textContent = raw
      ? 'publishUrl: "' + raw + '",\n\n↑ save this in assets/js/site-data.js'
      : "Paste the address above and the line to save will appear here.";
  }
  if (pubInput) pubInput.addEventListener("input", renderPublishSetting);
  SOURCES.publish = function () {
    return (pubOut ? pubOut.textContent : "").split("\n\n↑")[0];
  };
  renderPublishSetting();

  render();
  renderTargets();
  renderSheet();
  updateSheetLink();
})();
