/**
 * BAYOU EATZ — publishing + automation
 * ─────────────────────────────────────────────────────────────────────
 * Paste this into script.google.com, attached to the schedule sheet.
 *
 * WHAT IT DOES
 * When Chef Joe taps Publish on the website, this script:
 *   1. writes the update to the Posts tab  → the feed on the site
 *   2. writes a stop to the Stops tab      → the banner and the calendar
 *   3. posts it to the Facebook page       → if Facebook is connected
 *   4. posts it to Instagram               → if Instagram is connected
 *                                            AND the update has a photo
 *   5. writes back what worked and what didn't, so nothing fails silently
 *
 * It also runs the mailing list: signups from the site, a confirmation
 * email so nobody can sign someone else up, an unsubscribe link in every
 * message, and a weekly "here's where we'll be" email.
 *
 * WHERE THINGS LIVE, AND WHY
 * - Facebook/Instagram tokens sit in Script Properties on Google's
 *   servers. They are as good as a password for the page and must never
 *   go in the website repo, which is public.
 * - Subscribers' email addresses go in a SEPARATE, private spreadsheet
 *   that this script creates for you. The schedule sheet has to be
 *   shared "anyone with the link" so the website can read it — putting
 *   customers' addresses in that same file would publish them.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SETUP PART 1 — publishing (5 minutes, required)
 *
 *  1. Open the schedule sheet → Extensions → Apps Script.
 *  2. Delete whatever is in the editor and paste this whole file in.
 *  3. Change PASSCODE below. Make it LONG — a sentence you'll remember,
 *     twelve characters at the very least. The script refuses to publish
 *     while it's still the default or too short. This is the only thing
 *     standing between the internet and posting as your business page.
 *  4. Save.
 *  5. Deploy → New deployment → gear icon → Web app.
 *       Execute as:      Me
 *       Who has access:  Anyone
 *     Deploy, then Authorize access and allow it.
 *  6. Copy the Web app URL (ends in /exec) and paste it into the
 *     "Publish" setup box on /post.html.
 *
 * SETUP PART 2 — socials (optional, and genuinely fiddly: budget an hour)
 *
 * Read tools/SOCIAL-SETUP.md in the website folder. It walks through
 * Meta's developer console step by step. When you have the values, run
 * the saveCredentials() function ONCE from this editor with them filled
 * in, then delete them from the function body and save again.
 *
 * Facebook posts text. Instagram REQUIRES a photo — Meta does not allow
 * text-only posts through the API — so Instagram is skipped on any
 * update without one. That's Meta's rule, not a limitation here.
 *
 * SETUP PART 3 — the weekly email (optional)
 *
 * Triggers (clock icon) → Add trigger → weeklyEmail → Time-driven →
 * Week timer → pick a day and hour. Done.
 */

var PASSCODE = 'CHANGE-ME';

/** Bump this if Meta retires the version — they last about two years. */
var GRAPH_VERSION = 'v21.0';

var STOPS_TAB = 'Stops';
var POSTS_TAB = 'Posts';
var SUBS_TAB  = 'Subscribers';

var STOPS_HEADERS = ['Date', 'Type', 'What', 'Where', 'Time', 'Note', 'Hide'];
var POSTS_HEADERS = ['Posted', 'Headline', 'Message', 'Where', 'When', 'Photo', 'Shared', 'Hide'];
var SUBS_HEADERS  = ['Added', 'Email', 'Confirmed', 'Unsubscribed'];

/** Publishing lockout: this many bad passcodes in a window locks it. */
var BAD_PASSCODES_ALLOWED = 5;
var LOCKOUT_MINUTES = 15;

/** The open signup path needs a ceiling, since there's no passcode on it. */
var SIGNUPS_PER_MINUTE = 20;
var MAX_SUBSCRIBERS = 5000;

/* ═══════════════════════════════════════════════════════════════════
   ONE-TIME CREDENTIAL SAVE
   Fill these in, run saveCredentials once from the Run menu, then blank
   them out and save the file again so they aren't sitting in the editor.
   ═══════════════════════════════════════════════════════════════════ */
function saveCredentials() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    FB_PAGE_ID:    '',   // numeric ID of the Bayou Eatz Facebook page
    FB_PAGE_TOKEN: '',   // long-lived PAGE access token (not a user token)
    IG_USER_ID:    ''    // Instagram business account ID, if using Instagram
  });
  Logger.log('Saved. Now blank the values above and save the file again.');
}

/** Run this from the editor to check the tokens before relying on them. */
function testConnections() {
  var c = creds();
  if (!c.FB_PAGE_ID || !c.FB_PAGE_TOKEN) {
    Logger.log('Facebook: not configured.');
  } else {
    var res = fetchJson(graph(c.FB_PAGE_ID + '?fields=name,fan_count'), { token: c.FB_PAGE_TOKEN });
    Logger.log(res.error
      ? 'Facebook: FAILED — ' + res.error
      : 'Facebook: OK — connected to "' + res.name + '"');
  }

  if (!c.IG_USER_ID) {
    Logger.log('Instagram: not configured.');
  } else {
    var ig = fetchJson(graph(c.IG_USER_ID + '?fields=username'), { token: c.FB_PAGE_TOKEN });
    Logger.log(ig.error
      ? 'Instagram: FAILED — ' + ig.error
      : 'Instagram: OK — connected to @' + ig.username);
  }

  Logger.log(passcodeProblem() ? 'Passcode: ' + passcodeProblem() : 'Passcode: OK');
  Logger.log('Subscribers sheet: ' + subscribersSheet().getParent().getUrl());
}

/* ═══════════════════════════════════════════════════════════════════
   THE ENDPOINT — POST (publishing)
   ═══════════════════════════════════════════════════════════════════ */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Mailing-list signups are open to anyone and handled without the
    // passcode. (The site actually uses the GET form of this so it can
    // read the answer; this keeps the POST form working too.)
    if (body.subscribe) {
      return reply(subscribeRequest(String(body.subscribe)));
    }

    var problem = passcodeProblem();
    if (problem) return reply({ ok: false, error: problem });

    if (isLockedOut()) {
      return reply({ ok: false, error: 'publishing is locked for a few minutes after too many wrong passcodes' });
    }
    if (String(body.passcode || '') !== PASSCODE) {
      recordBadPasscode();
      return reply({ ok: false, error: 'bad passcode' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var caption = String(body.caption || '') || composeCaption(body);
    var shared = shareEverywhere(caption, String(body.photo || ''));

    appendByHeader(tab(ss, POSTS_TAB, POSTS_HEADERS), {
      Posted:   new Date(),
      Headline: String(body.headline || ''),
      Message:  String(body.message || ''),
      Where:    String(body.where || ''),
      When:     String(body.when || ''),
      Photo:    String(body.photo || ''),
      Shared:   shared.summary,
      Hide:     ''
    });

    // Only a dated update belongs on the calendar. "Closed today" is a
    // post, not a stop.
    if (body.date) {
      appendByHeader(tab(ss, STOPS_TAB, STOPS_HEADERS), {
        Date:  String(body.date),
        Type:  String(body.type || 'public'),
        What:  String(body.headline || ''),
        Where: String(body.where || ''),
        Time:  String(body.when || ''),
        Note:  String(body.message || ''),
        Hide:  ''
      });
    }

    return reply({ ok: true, shared: shared.summary, detail: shared.detail });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   THE ENDPOINT — GET (signup, confirm, unsubscribe, health check)
   The site calls the signup as JSONP so it can read the answer; a plain
   browser POST across origins can't.
   ═══════════════════════════════════════════════════════════════════ */
function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.subscribe) {
    var res = subscribeRequest(String(p.subscribe));
    return p.callback ? jsonp(p.callback, res) : reply(res);
  }
  if (p.confirm && p.t) {
    return page(setSubscriberFlag(String(p.confirm), String(p.t), 'Confirmed')
      ? "You're on the list. We'll email you the week's stops. See you at the window."
      : "That link didn't check out. If you're trying to join the list, sign up again on the website.");
  }
  if (p.unsub && p.t) {
    return page(setSubscriberFlag(String(p.unsub), String(p.t), 'Unsubscribed')
      ? "You're off the list. No hard feelings — the calendar on the website always has the stops."
      : "That link didn't check out. Email us and we'll take you off by hand.");
  }
  return reply({ ok: true, service: 'Bayou Eatz publishing endpoint' });
}

/* ═══════════════════════════════════════════════════════════════════
   PASSCODE GUARDS
   ═══════════════════════════════════════════════════════════════════ */
function passcodeProblem() {
  if (PASSCODE === 'CHANGE-ME') return 'passcode not set — edit PASSCODE in the script';
  if (String(PASSCODE).length < 12) return 'passcode too short — make it at least 12 characters';
  return '';
}

function lockKey() {
  return 'badpass-' + Math.floor(Date.now() / (LOCKOUT_MINUTES * 60000));
}
function isLockedOut() {
  return Number(CacheService.getScriptCache().get(lockKey()) || 0) >= BAD_PASSCODES_ALLOWED;
}
function recordBadPasscode() {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(lockKey()) || 0) + 1;
  cache.put(lockKey(), String(n), LOCKOUT_MINUTES * 60 + 60);
  Logger.log('Bad passcode attempt ' + n + ' at ' + new Date());
}

/* ═══════════════════════════════════════════════════════════════════
   SOCIALS
   ═══════════════════════════════════════════════════════════════════ */
function shareEverywhere(caption, photoUrl) {
  var c = creds();
  var detail = {};
  var parts = [];

  // ── Facebook: photo post when there's a usable image; fall back to a
  //    text post if Facebook can't fetch it (a Google Photos *page* link,
  //    say), so the announcement itself is never lost.
  if (c.FB_PAGE_ID && c.FB_PAGE_TOKEN) {
    var fb = null, mode = 'text';
    if (photoUrl) {
      fb = fetchJson(graph(c.FB_PAGE_ID + '/photos'),
        { token: c.FB_PAGE_TOKEN, payload: { url: photoUrl, caption: caption } });
      mode = 'photo';
      if (fb.error) {
        Logger.log('Facebook photo post failed (' + fb.error + '); posting as text instead.');
        fb = null;
      }
    }
    if (!fb) {
      fb = fetchJson(graph(c.FB_PAGE_ID + '/feed'),
        { token: c.FB_PAGE_TOKEN, payload: { message: caption + (photoUrl ? '\n' + photoUrl : '') } });
      mode = 'text';
    }
    detail.facebook = fb.error ? ('failed: ' + fb.error) : ('posted (' + mode + ')');
    parts.push('FB ' + (fb.error ? '✗' : '✓'));
  } else {
    detail.facebook = 'not connected';
  }

  // ── Instagram: photo required. Meta allows no text-only posts.
  if (c.IG_USER_ID && c.FB_PAGE_TOKEN) {
    if (!photoUrl) {
      detail.instagram = 'skipped — Instagram needs a photo';
      parts.push('IG –');
    } else {
      var made = fetchJson(graph(c.IG_USER_ID + '/media'),
        { token: c.FB_PAGE_TOKEN, payload: { image_url: photoUrl, caption: caption } });

      if (made.error || !made.id) {
        detail.instagram = 'failed: ' + (made.error || 'no container returned');
        parts.push('IG ✗');
      } else {
        var pub = fetchJson(graph(c.IG_USER_ID + '/media_publish'),
          { token: c.FB_PAGE_TOKEN, payload: { creation_id: made.id } });
        detail.instagram = pub.error ? ('failed: ' + pub.error) : 'posted';
        parts.push('IG ' + (pub.error ? '✗' : '✓'));
      }
    }
  } else {
    detail.instagram = 'not connected';
  }

  return {
    summary: parts.length ? parts.join(' · ') : 'site only',
    detail: detail
  };
}

/**
 * The caption, written the way Chef Joe would say it. The website sends
 * its own version so the preview matches exactly; this is the fallback
 * for posts made any other way.
 */
function composeCaption(b) {
  var head = String(b.headline || '').trim();
  var where = String(b.where || '').trim();
  var when = String(b.when || '').trim();
  var msg = String(b.message || '').trim();

  if (String(b.type || '') === 'private') {
    return '🚚 We\'re out on a private event today — back at it soon.\n\n' +
           'Want the truck at yours? Call or message us.';
  }

  var lines = ['🚨 ' + (head ? head.toUpperCase() : 'BAYOU EATZ') + ' 🚨', ''];
  if (where) lines.push('📍 ' + where);
  if (when)  lines.push('🕐 ' + when);
  if (msg)   lines.push('', msg);
  lines.push('', 'Loaded fries, wings, baskets — all fried to order.');
  lines.push('', '#BayouEatz #TasteTheBayou #FoodTruck #BatonRouge');
  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════
   MAILING LIST
   Lives in its own private spreadsheet. Double opt-in: a signup sends a
   confirmation email and nothing is mailed until the link is clicked.
   Every email carries an unsubscribe link that works.
   ═══════════════════════════════════════════════════════════════════ */
function subscribersSheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SUBS_SHEET_ID');
  var ss = null;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    // Created in the owner's Drive, shared with nobody — the point.
    ss = SpreadsheetApp.create('Bayou Eatz — Subscribers (private)');
    props.setProperty('SUBS_SHEET_ID', ss.getId());
    var first = ss.getSheets()[0];
    first.setName(SUBS_TAB);
    first.appendRow(SUBS_HEADERS);
    first.setFrozenRows(1);
  }
  return tab(ss, SUBS_TAB, SUBS_HEADERS);
}

function allowSignup() {
  var cache = CacheService.getScriptCache();
  var key = 'signups-' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n <= SIGNUPS_PER_MINUTE;
}

function subscribeRequest(email) {
  email = String(email).trim().toLowerCase();
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'that email does not look right' };
  }
  if (!allowSignup()) {
    return { ok: false, error: 'too many signups right now' };
  }

  var sheet = subscribersSheet();
  var col = columns(sheet);
  var rows = sheet.getDataRange().getValues();
  if (rows.length - 1 >= MAX_SUBSCRIBERS) {
    return { ok: false, error: 'list is full' };
  }

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][col.email]).trim().toLowerCase() !== email) continue;
    if (yes(rows[i][col.confirmed]) && !yes(rows[i][col.unsubscribed])) {
      return { ok: true, already: true };
    }
    // Signed up before but never confirmed, or left and came back:
    // resend the confirmation rather than adding a duplicate row.
    sendConfirmation(email);
    return { ok: true, pending: true };
  }

  appendByHeader(sheet, { Added: new Date(), Email: email, Confirmed: '', Unsubscribed: '' });
  sendConfirmation(email);
  return { ok: true, pending: true };
}

function sendConfirmation(email) {
  var url = selfUrl() + '?confirm=' + encodeURIComponent(email) + '&t=' + token(email);
  MailApp.sendEmail({
    to: email,
    subject: 'Confirm: Bayou Eatz weekly stops',
    body: 'Tap this link to start getting the week\'s stops from Bayou Eatz:\n\n' + url +
          '\n\nIf you didn\'t ask for this, ignore it and nothing more will be sent.\n\n— Bayou Eatz'
  });
}

/** Flip Confirmed or Unsubscribed to yes for a signed link. */
function setSubscriberFlag(email, t, flag) {
  email = String(email).trim().toLowerCase();
  if (token(email) !== t) return false;

  var sheet = subscribersSheet();
  var col = columns(sheet);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][col.email]).trim().toLowerCase() === email) {
      sheet.getRange(i + 1, col[flag.toLowerCase()] + 1).setValue('yes');
      if (flag === 'Confirmed') sheet.getRange(i + 1, col.unsubscribed + 1).setValue('');
      return true;
    }
  }
  return false;
}

/**
 * Weekly note to confirmed subscribers, with an unsubscribe link each.
 * Set it on a time-driven weekly trigger. Respects Gmail's daily send
 * cap: if it can't finish, it remembers where it stopped and picks up
 * from there next time, and logs that it did.
 */
function weeklyEmail() {
  var stops = tab(SpreadsheetApp.getActiveSpreadsheet(), STOPS_TAB, STOPS_HEADERS);
  var sc = columns(stops);
  var values = stops.getDataRange().getValues();

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var horizon = new Date(today.getTime() + 8 * 24 * 3600 * 1000);

  var upcoming = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (yes(row[sc.hide])) continue;
    if (String(row[sc.type]).toLowerCase().indexOf('priv') === 0) continue;
    var when = localDate(row[sc.date]);
    if (!when || when < today || when > horizon) continue;
    upcoming.push(
      Utilities.formatDate(when, Session.getScriptTimeZone(), 'EEEE, MMM d') +
      ' — ' + row[sc.what] + (row[sc.where] ? ' · ' + row[sc.where] : '') + (row[sc.time] ? ' · ' + row[sc.time] : '')
    );
  }
  if (!upcoming.length) return;   // nothing to say, so say nothing

  var sheet = subscribersSheet();
  var col = columns(sheet);
  var subs = sheet.getDataRange().getValues();
  var props = PropertiesService.getScriptProperties();
  var start = Number(props.getProperty('WEEKLY_CURSOR') || 1);
  if (start >= subs.length) start = 1;

  var quota = MailApp.getRemainingDailyQuota();
  var body = 'Here\'s where the truck will be this week:\n\n' +
             upcoming.join('\n') + '\n\nSee you at the window.\n— Bayou Eatz';

  for (var j = start; j < subs.length; j++) {
    var r = subs[j];
    if (!yes(r[col.confirmed]) || yes(r[col.unsubscribed])) continue;
    var to = String(r[col.email]).trim();
    if (!to) continue;

    if (quota <= 0) {
      // Out of sends for today: remember the row and resume next run.
      props.setProperty('WEEKLY_CURSOR', String(j));
      Logger.log('Daily email quota reached at row ' + j + '; will resume from there next run.');
      return;
    }
    try {
      MailApp.sendEmail({
        to: to,
        subject: 'Bayou Eatz — this week',
        body: body + '\n\nTo stop these: ' + selfUrl() + '?unsub=' + encodeURIComponent(to) + '&t=' + token(to)
      });
      quota--;
    } catch (err) {
      props.setProperty('WEEKLY_CURSOR', String(j));
      Logger.log('Stopped at row ' + j + ' (' + err + '); will resume from there next run.');
      return;
    }
  }
  props.deleteProperty('WEEKLY_CURSOR');
}

/**
 * Housekeeping: mark stops older than 60 days as hidden so the sheet
 * stays readable. Put it on a daily trigger if you want it.
 */
function tidyOldStops() {
  var sheet = tab(SpreadsheetApp.getActiveSpreadsheet(), STOPS_TAB, STOPS_HEADERS);
  var col = columns(sheet);
  var values = sheet.getDataRange().getValues();
  var cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  for (var i = 1; i < values.length; i++) {
    var when = localDate(values[i][col.date]);
    if (when && when < cutoff && !yes(values[i][col.hide])) {
      sheet.getRange(i + 1, col.hide + 1).setValue('yes');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PLUMBING
   ═══════════════════════════════════════════════════════════════════ */
function creds() {
  return PropertiesService.getScriptProperties().getProperties();
}

/** This deployment's own /exec address, for links in emails. */
function selfUrl() {
  return ScriptApp.getService().getUrl();
}

/** A signing secret, made once and kept in Script Properties. */
function signingSecret() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SIGNING_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SIGNING_SECRET', s);
  }
  return s;
}

/** HMAC of an email — the token in confirm and unsubscribe links. */
function token(email) {
  var bytes = Utilities.computeHmacSha256Signature(String(email).trim().toLowerCase(), signingSecret());
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function yes(v) {
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === 'x';
}

/**
 * A sheet's Date column may hold a real Date or typed text. Text like
 * "2026-09-05" must be read as LOCAL midnight — new Date(text) treats
 * it as UTC, which in Louisiana is the previous evening.
 */
function localDate(v) {
  if (v instanceof Date) return isNaN(v) ? null : v;
  var s = String(v == null ? '' : v).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  var d = new Date(s);
  return isNaN(d) ? null : d;
}

/**
 * Column indexes by header name, so a column can be moved or added in
 * the sheet without silently corrupting writes. Keys are lower-case.
 */
function columns(sheet) {
  var last = sheet.getLastColumn();
  var heads = last ? sheet.getRange(1, 1, 1, last).getValues()[0] : [];
  var map = {};
  heads.forEach(function (h, i) { map[String(h).trim().toLowerCase()] = i; });
  return map;
}

/** Append a row by header names, filling any column we don't know. */
function appendByHeader(sheet, obj) {
  var col = columns(sheet);
  var width = Math.max(sheet.getLastColumn(), 1);
  var row = [];
  for (var i = 0; i < width; i++) row.push('');
  Object.keys(obj).forEach(function (k) {
    var idx = col[k.toLowerCase()];
    if (idx != null) row[idx] = obj[k];
  });
  sheet.appendRow(row);
}

/**
 * Get a tab, creating it with headers if missing — and if it exists but
 * is short of headers (made by hand from an older instruction sheet),
 * add the missing ones on the end rather than misaligning every row.
 */
function tab(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var have = columns(sheet);
  var missing = headers.filter(function (h) { return have[h.toLowerCase()] == null; });
  if (missing.length) {
    var start = sheet.getLastColumn() + 1;
    sheet.getRange(1, start, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function graph(path) {
  return 'https://graph.facebook.com/' + GRAPH_VERSION + '/' + path;
}

function fetchJson(url, opts) {
  opts = opts || {};
  var params = {
    muteHttpExceptions: true,
    method: opts.payload ? 'post' : 'get'
  };
  var payload = opts.payload || {};
  if (opts.token) payload.access_token = opts.token;

  if (opts.payload) {
    params.payload = payload;
  } else if (opts.token) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + encodeURIComponent(opts.token);
  }

  try {
    var res = UrlFetchApp.fetch(url, params);
    var out = JSON.parse(res.getContentText());
    if (out.error) {
      return { error: out.error.message || JSON.stringify(out.error) };
    }
    return out;
  } catch (err) {
    return { error: String(err) };
  }
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** JSONP wrapper so the website can read a reply across origins. */
function jsonp(callback, obj) {
  var name = String(callback).replace(/[^A-Za-z0-9_$.]/g, '');
  return ContentService
    .createTextOutput(name + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/** A tiny page for confirm / unsubscribe links opened in a browser. */
function page(message) {
  var html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Bayou Eatz</title>' +
    '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#120718;color:#f4e8cd;font:18px/1.5 system-ui,sans-serif;padding:2rem;text-align:center">' +
    '<div><p style="font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:#e8b53c;margin:0 0 .5rem">Bayou Eatz</p>' +
    '<p style="max-width:32rem;margin:0">' + escapeHtml(message) + '</p></div></body>';
  return HtmlService.createHtmlOutput(html);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
