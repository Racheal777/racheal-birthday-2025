/**
 * Racheal's birthday site 2026 – "The Year It Opens Up"
 * Wishes backend: Google Sheet + Apps Script web app. No database needed.
 *
 * SETUP (5 minutes)
 * 1. Create a Google Sheet. Extensions > Apps Script. Paste this whole file into Code.gs.
 * 2. Project Settings > Script properties > add:
 *      ADMIN_KEY   = a long random string (only you know it; unlocks your inbox before 7 Dec)
 * 3. Run `setup` once from the editor (authorise when asked). It creates the "Wishes" tab.
 * 4. Deploy > New deployment > Web app
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the /exec URL into the site's config as WISHES_API.
 * 5. Every time you change this file: Deploy > Manage deployments > Edit > New version.
 *
 * API
 *   POST  {WISHES_API}            body (text/plain JSON): { name, message, tag, website }
 *         -> { ok: true, id, number }          (website is a honeypot; must be empty)
 *   GET   {WISHES_API}?action=count            -> { ok, count }                  (always public)
 *   GET   {WISHES_API}?action=letter&id=ID     -> { ok, wish }                   (sender rereads own letter)
 *   GET   {WISHES_API}?action=list             -> { ok, wishes: [...] }          (only from 7 Dec, Africa/Accra)
 *   GET   {WISHES_API}?action=list&key=ADMIN   -> { ok, wishes: [...] }          (Racheal, any time)
 *
 * Send POSTs as Content-Type "text/plain;charset=utf-8" so the browser skips the CORS preflight.
 */

var SHEET_NAME = 'Wishes';
var TZ = 'Africa/Accra';
var REVEAL_DATE = '2026-12-07';              // 7 December, Africa/Accra
var TAGS = ['Career', 'Love', 'Money', 'Travel', 'Joy', 'Balance'];
var MAX_NAME = 60;
var MAX_MESSAGE = 2000;
var HEADERS = ['id', 'createdAt', 'name', 'tag', 'message', 'hidden'];

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.website) return json_({ ok: true, id: 'x', number: 0 });          // bot filled the honeypot

    var name = clean_(body.name, MAX_NAME);
    var message = clean_(body.message, MAX_MESSAGE);
    var tag = TAGS.indexOf(body.tag) >= 0 ? body.tag : 'Joy';
    if (!name || !message) return json_({ ok: false, error: 'Please add your name and a wish.' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sh = sheet_();
      var id = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
      sh.appendRow([id, new Date(), name, tag, message, '']);
      var number = sh.getLastRow() - 1;
      return json_({ ok: true, id: id, number: number });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'count';
  var rows = rows_();

  if (action === 'count') return json_({ ok: true, count: rows.length });

  if (action === 'letter') {
    var mine = rows.filter(function (r) { return r.id === p.id; })[0];
    return mine ? json_({ ok: true, wish: mine }) : json_({ ok: false, error: 'Letter not found.' });
  }

  if (action === 'list') {
    var admin = p.key && p.key === PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
    if (!admin && !revealed_()) return json_({ ok: false, error: 'locked', count: rows.length });
    return json_({ ok: true, wishes: rows });
  }

  return json_({ ok: false, error: 'Unknown action.' });
}

/* helpers */
function sheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) { setup(); sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); }
  return sh;
}

function rows_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .filter(function (r) { return r[0] && String(r[5]).toLowerCase() !== 'yes'; })   // type "yes" in column F to hide a wish
    .map(function (r) {
      return { id: String(r[0]), createdAt: new Date(r[1]).toISOString(), name: String(r[2]), tag: String(r[3]), message: String(r[4]) };
    });
}

function revealed_() {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  return today >= REVEAL_DATE;   // stays open after the birthday so the letters can be reread all year
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}