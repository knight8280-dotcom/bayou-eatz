/**
 * BAYOU EATZ — publishing endpoint
 * ─────────────────────────────────────────────────────────────────────
 * Paste this into script.google.com, attached to the schedule sheet.
 * It lets the "Post an update" page on bayoueatz's own website write a
 * row into the sheet, so Chef Joe never leaves his site to post.
 *
 * WHY IT'S SAFE
 * The script runs as YOU (the sheet's owner). The website never holds a
 * Google password or an API key — it only knows the web-app address and
 * the passcode you set below. Anyone who somehow found the address still
 * can't post without the passcode, and even then the worst they could do
 * is add a row you can delete.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SETUP — once, about five minutes
 *
 *  1. Open the schedule sheet → Extensions → Apps Script.
 *  2. Delete whatever is in the editor and paste this whole file in.
 *  3. Change PASSCODE below to something only Chef Joe knows.
 *  4. Save (the disk icon).
 *  5. Deploy → New deployment → gear icon → Web app.
 *       Execute as:        Me
 *       Who has access:    Anyone
 *     Click Deploy, then Authorize access and allow it.
 *  6. Copy the Web app URL it gives you (ends in /exec).
 *  7. Paste that URL and the passcode into the "Publish" box on
 *     /post.html — it prints the exact line to save in site-data.js.
 *
 * The sheet needs two tabs:
 *   "Stops" — Date | Type | What | Where | Time | Note | Hide
 *   "Posts" — Posted | Headline | Message | Where | When | Hide
 * Both are created automatically the first time something is posted.
 */

var PASSCODE = 'CHANGE-ME';

var STOPS_TAB = 'Stops';
var POSTS_TAB = 'Posts';

var STOPS_HEADERS = ['Date', 'Type', 'What', 'Where', 'Time', 'Note', 'Hide'];
var POSTS_HEADERS = ['Posted', 'Headline', 'Message', 'Where', 'When', 'Hide'];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (String(body.passcode || '') !== PASSCODE) {
      return reply({ ok: false, error: 'bad passcode' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // An update always becomes a post. It only becomes a calendar stop
    // as well when it names a date — "we're closed today" shouldn't put
    // anything on the calendar.
    var posts = tab(ss, POSTS_TAB, POSTS_HEADERS);
    posts.appendRow([
      new Date(),
      String(body.headline || ''),
      String(body.message || ''),
      String(body.where || ''),
      String(body.when || ''),
      ''
    ]);

    if (body.date) {
      var stops = tab(ss, STOPS_TAB, STOPS_HEADERS);
      stops.appendRow([
        String(body.date),
        String(body.type || 'public'),
        String(body.headline || ''),
        String(body.where || ''),
        String(body.when || ''),
        String(body.message || ''),
        ''
      ]);
    }

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

/** Lets you open the /exec address in a browser to check it's alive. */
function doGet() {
  return reply({ ok: true, service: 'Bayou Eatz publishing endpoint' });
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
