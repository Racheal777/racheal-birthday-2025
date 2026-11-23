/* ============================================================================
 * API — talks to the Google Apps Script backend (docs/2026/Code.gs).
 * When CONFIG.WISHES_API is empty the site falls back to a local "demo" store
 * so the full flow can be tried before the backend is deployed.
 * ==========================================================================*/

window.API = (function () {
  var URL = (window.CONFIG && window.CONFIG.WISHES_API) || '';
  var live = !!URL;

  /* ---- demo store (localStorage) -------------------------------------- */
  var DEMO_KEY = 'demoWishes';
  function demoRead() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); } catch (e) { return []; }
  }
  function demoWrite(list) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch (e) {}
  }

  /* ---- POST a wish ----------------------------------------------------- */
  // Returns { ok, id, number } or { ok:false, error }.
  async function sendWish(wish) {
    var payload = {
      name: wish.name, message: wish.message, tag: wish.tag, website: wish.website || ''
    };
    if (!live) {
      if (payload.website) return { ok: true, id: 'x', number: 0 }; // honeypot
      var list = demoRead();
      var id = 'L' + Date.now().toString(36).slice(-6);
      var rec = { id: id, createdAt: new Date().toISOString(), name: payload.name, tag: payload.tag, message: payload.message };
      list.push(rec);
      demoWrite(list);
      return { ok: true, id: id, number: list.length, demo: true };
    }
    // Content-Type text/plain avoids the CORS preflight (see Code.gs).
    var res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  /* ---- GET the public count ------------------------------------------- */
  async function getCount() {
    if (!live) return { ok: true, count: demoRead().length };
    try {
      var res = await fetch(URL + '?action=count');
      return res.json();
    } catch (e) { return { ok: false, error: 'offline' }; }
  }

  /* ---- GET one letter by id (sender rereads their own) ----------------- */
  async function getLetter(id) {
    if (!live) {
      var mine = demoRead().filter(function (w) { return w.id === id; })[0];
      return mine ? { ok: true, wish: mine } : { ok: false, error: 'Letter not found.' };
    }
    try {
      var res = await fetch(URL + '?action=letter&id=' + encodeURIComponent(id));
      return res.json();
    } catch (e) { return { ok: false, error: 'offline' }; }
  }

  /* ---- GET the full list (locked until 7 Dec unless admin key) --------- */
  async function getWishes(adminKey) {
    if (!live) {
      // In demo mode show the sample inbox plus anything typed this session.
      var samples = (window.CONTENT && window.CONTENT.SAMPLE_WISHES) || [];
      return { ok: true, wishes: samples.concat(demoRead()), demo: true };
    }
    try {
      var url = URL + '?action=list' + (adminKey ? '&key=' + encodeURIComponent(adminKey) : '');
      var res = await fetch(url);
      return res.json(); // { ok, wishes } or { ok:false, error:'locked', count }
    } catch (e) { return { ok: false, error: 'offline' }; }
  }

  return { live: live, sendWish: sendWish, getCount: getCount, getLetter: getLetter, getWishes: getWishes };
})();
