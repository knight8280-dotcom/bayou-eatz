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
 * WHY THE TOKENS LIVE HERE
 * Facebook and Instagram tokens are as good as a password for those
 * accounts. This script runs on Google's servers as the sheet's owner,
 * so the tokens sit in Script Properties and never reach a visitor's
 * browser. They must never be put in site-data.js or any file in the
 * website repo — that folder is public.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SETUP PART 1 — publishing (5 minutes, required)
 *
 *  1. Open the schedule sheet → Extensions → Apps Script.
 *  2. Delete whatever is in the editor and paste this whole file in.
 *  3. Change PASSCODE below to something only Chef Joe knows.
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
 */

var PASSCODE = 'CHANGE-ME';

/** Bump this if Meta retires the version — they last about two years. */
var GRAPH_VERSION = 'v21.0';

var STOPS_TAB = 'Stops';
var POSTS_TAB = 'Posts';
var SUBS_TAB  = 'Subscribers';

var STOPS_HEADERS = ['Date', 'Type', 'What', 'Where', 'Time', 'Note', 'Hide'];
var POSTS_HEADERS = ['Posted', 'Headline', 'Message', 'Where', 'When', 'Photo', 'Shared', 'Hide'];
var SUBS_HEADERS  = ['Added', 'Email', 'Unsubscribed'];

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
}

/* ═══════════════════════════════════════════════════════════════════
   THE ENDPOINT
   ═══════════════════════════════════════════════════════════════════ */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Mailing-list signups come from the public site with no passcode —
    // anyone may join — so they're handled BEFORE the passcode gate.
    // Checking the passcode first would reject every signup, and because
    // the browser can't read this reply, the visitor would still be told
    // "you're on the list" while the address was thrown away.
    if (body.subscribe) {
      if (!allowSignup()) {
        return reply({ ok: false, error: 'too many signups right now' });
      }
      return reply(addSubscriber(String(body.subscribe)));
    }

    if (String(body.passcode || '') !== PASSCODE) {
      return reply({ ok: false, error: 'bad passcode' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var caption = body.caption || composeCaption(body);
    var shared = shareEverywhere(caption, String(body.photo || ''));

    tab(ss, POSTS_TAB, POSTS_HEADERS).appendRow([
      new Date(),
      String(body.headline || ''),
      String(body.message || ''),
      String(body.where || ''),
      String(body.when || ''),
      String(body.photo || ''),
      shared.summary,
      ''
    ]);

    // Only a dated update belongs on the calendar. "Closed today" is a
    // post, not a stop.
    if (body.date) {
      tab(ss, STOPS_TAB, STOPS_HEADERS).appendRow([
        String(body.date),
        String(body.type || 'public'),
        String(body.headline || ''),
        String(body.where || ''),
        String(body.when || ''),
        String(body.message || ''),
        ''
      ]);
    }

    return reply({ ok: true, shared: shared.summary, detail: shared.detail });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function doGet() {
  return reply({ ok: true, service: 'Bayou Eatz publishing endpoint' });
}

/* ═══════════════════════════════════════════════════════════════════
   SOCIALS
   ═══════════════════════════════════════════════════════════════════ */
function shareEverywhere(caption, photoUrl) {
  var c = creds();
  var detail = {};
  var parts = [];

  // ── Facebook: text, or text + photo when there's one.
  if (c.FB_PAGE_ID && c.FB_PAGE_TOKEN) {
    var fb = photoUrl
      ? fetchJson(graph(c.FB_PAGE_ID + '/photos'),
          { token: c.FB_PAGE_TOKEN, payload: { url: photoUrl, caption: caption } })
      : fetchJson(graph(c.FB_PAGE_ID + '/feed'),
          { token: c.FB_PAGE_TOKEN, payload: { message: caption } });

    detail.facebook = fb.error ? ('failed: ' + fb.error) : 'posted';
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
 * The caption, written the way Chef Joe would say it. Kept here as well
 * as on the website so a post made from the sheet or a scheduled job
 * reads exactly like one made from the site.
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
   The site promises subscribers "the week's stops" — this is where the
   addresses land so that promise can actually be kept.
   ═══════════════════════════════════════════════════════════════════ */
/** The open signup path needs a ceiling, since there's no passcode on it.
 *  Apps Script can't see the caller's address, so this is a global
 *  count: at most SIGNUPS_PER_MINUTE across everyone. Real traffic for a
 *  food truck never gets close; a script hammering it does. */
var SIGNUPS_PER_MINUTE = 20;
var MAX_SUBSCRIBERS = 5000;

function allowSignup() {
  var cache = CacheService.getScriptCache();
  var key = 'signups-' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n <= SIGNUPS_PER_MINUTE;
}

function addSubscriber(email) {
  email = email.trim().toLowerCase();
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'that email does not look right' };
  }

  var sheet = tab(SpreadsheetApp.getActiveSpreadsheet(), SUBS_TAB, SUBS_HEADERS);
  var existing = sheet.getDataRange().getValues();
  if (existing.length - 1 >= MAX_SUBSCRIBERS) {
    return { ok: false, error: 'list is full' };
  }
  for (var i = 1; i < existing.length; i++) {
    if (String(existing[i][1]).trim().toLowerCase() === email) {
      return { ok: true, already: true };
    }
  }
  sheet.appendRow([new Date(), email, '']);
  return { ok: true };
}

/**
 * Weekly note to the list. Set this on a time-driven trigger:
 * Triggers → Add trigger → weeklyEmail → Time-driven → Week timer.
 */
function weeklyEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stops = tab(ss, STOPS_TAB, STOPS_HEADERS).getDataRange().getValues();
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var horizon = new Date(today.getTime() + 8 * 24 * 3600 * 1000);

  var upcoming = [];
  for (var i = 1; i < stops.length; i++) {
    var row = stops[i];
    if (String(row[6]).toLowerCase() === 'yes') continue;      // Hide
    if (String(row[1]).toLowerCase() === 'private') continue;  // not public
    var when = stopDate(row[0]);
    if (isNaN(when) || when < today || when > horizon) continue;
    upcoming.push(
      Utilities.formatDate(when, Session.getScriptTimeZone(), 'EEEE, MMM d') +
      ' — ' + row[2] + (row[3] ? ' · ' + row[3] : '') + (row[4] ? ' · ' + row[4] : '')
    );
  }

  if (!upcoming.length) return;   // nothing to say, so say nothing

  var subs = tab(ss, SUBS_TAB, SUBS_HEADERS).getDataRange().getValues();
  var body = 'Here\'s where the truck will be this week:\n\n' +
             upcoming.join('\n') + '\n\nSee you at the window.\n— Bayou Eatz' +
             '\n\nTo stop these emails, reply with the word "unsubscribe".';

  for (var j = 1; j < subs.length; j++) {
    if (String(subs[j][2]).toLowerCase() === 'yes') continue;  // unsubscribed
    var to = String(subs[j][1]).trim();
    if (!to) continue;
    try {
      MailApp.sendEmail(to, 'Bayou Eatz — this week', body);
    } catch (err) {
      // Gmail caps daily sends; stop rather than half-send and lose track.
      Logger.log('Stopped at ' + to + ': ' + err);
      return;
    }
  }
}

/**
 * Housekeeping: mark stops older than 60 days as hidden so the sheet
 * stays readable. Put it on a daily trigger if you want it.
 */
function tidyOldStops() {
  var sheet = tab(SpreadsheetApp.getActiveSpreadsheet(), STOPS_TAB, STOPS_HEADERS);
  var values = sheet.getDataRange().getValues();
  var cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  for (var i = 1; i < values.length; i++) {
    var when = stopDate(values[i][0]);
    if (!isNaN(when) && when < cutoff && String(values[i][6]).toLowerCase() !== 'yes') {
      sheet.getRange(i + 1, 7).setValue('yes');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PLUMBING
   ═══════════════════════════════════════════════════════════════════ */
function creds() {
  return PropertiesService.getScriptProperties().getProperties();
}

/**
 * The Date column holds either a real date or the text the website
 * posts, "2026-09-05". new Date() on that text means midnight UTC,
 * which in Louisiana is the evening BEFORE — so today's stop would be
 * read as yesterday's and left out of the weekly email. Read it as a
 * local calendar day instead.
 */
function stopDate(v) {
  if (v instanceof Date) return v;
  var m = String(v || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(v);
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

function tab(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
