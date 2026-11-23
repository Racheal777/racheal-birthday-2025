/* ============================================================================
 * Racheal's birthday site 2026 — "The Year It Opens Up" (Centre Court)
 * App logic, rebuilt in vanilla JS from the approved prototype.
 * ==========================================================================*/
(function () {
  'use strict';
  var CFG = window.CONFIG, C = window.CONTENT, API = window.API;

  /* ---- tiny DOM helpers ------------------------------------------------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'style') n.setAttribute('style', attrs[k]);
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function $(id) { return document.getElementById(id); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function svg(markup) { var w = el('span'); w.innerHTML = markup; return w.firstChild; }

  var BALL_SVG = '<svg width="%W" height="%H" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="#DFF04A"/><path d="M6 12c8 4 8 16 0 20M38 12c-8 4-8 16 0 20" stroke="#fff" stroke-width="2.5" fill="none"/></svg>';
  function ball(size) { return BALL_SVG.replace('%W', size).replace('%H', size); }

  var mainEl, introLayer, popLayer, gameLayer, toastLayer, songLayer, confettiLayer, header, footer, previewAs;

  /* ---- URL params & identity -------------------------------------------- */
  var params = new URLSearchParams(location.search);

  // Secret admin key: ?key=... -> save once, then strip from the URL.
  var keyParam = params.get('key');
  if (keyParam) {
    try { localStorage.setItem('adminKey', keyParam); } catch (e) {}
    params.delete('key');
    history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash);
  }
  function adminKey() { try { return localStorage.getItem('adminKey') || ''; } catch (e) { return ''; } }
  function isAdmin() { return !!adminKey(); }

  var preview = params.get('preview') === 'dec7';
  function celebrating() { return Date.now() >= CFG.REVEAL_UTC || preview; }
  function collecting() { return !celebrating() && !isAdmin(); }

  // /letter/{id} or ?letter=id -> sender rereads their own letter.
  var letterId = params.get('letter');
  var m = location.pathname.match(/\/letter\/([A-Za-z0-9]+)/);
  if (m) letterId = m[1];

  /* ---- read-state for the admin inbox (per device) ---------------------- */
  function readIds() { try { return JSON.parse(localStorage.getItem('readIds') || '[]'); } catch (e) { return []; } }
  function markRead(id) {
    var r = readIds(); if (r.indexOf(id) < 0) { r.push(id); try { localStorage.setItem('readIds', JSON.stringify(r)); } catch (e) {} }
  }

  /* ---- state ------------------------------------------------------------ */
  var state = {
    mode: isAdmin() ? 'racheal' : 'friend', // admin may preview the friend view
    view: letterId ? 'single' : 'home',
    forceBday: false,                        // admin: preview 7 December
    introDone: false,
    // write form
    fMsg: '', fName: '', fTag: 'Career', fError: false,
    // admin inbox
    inbox: null, curId: null, modalId: null, opening: false,
    // court
    found: [false, false, false, false], strawI: 0, umpI: 0, yearI: 0, serveI: 0, crowdI: 0, serveN: 0, serving: false,
    // counts
    count: 0,
    // single letter
    single: null, singleErr: ''
  };
  function set(patch) { for (var k in patch) state[k] = patch[k]; render(); }

  function bday() { return state.forceBday || celebrating(); }

  /* ---- countdown -------------------------------------------------------- */
  function p2(n) { return String(n).padStart(2, '0'); }
  function countdownStr() {
    if (bday()) return 'TODAY';
    var diff = Math.max(0, CFG.REVEAL_UTC - Date.now());
    var dd = Math.floor(diff / 86400000), hh = Math.floor(diff / 3600000) % 24,
        mm = Math.floor(diff / 60000) % 60, ss = Math.floor(diff / 1000) % 60;
    return dd + 'd ' + p2(hh) + ':' + p2(mm) + ':' + p2(ss);
  }
  function tickClocks() {
    var txt = countdownStr();
    document.querySelectorAll('[data-countdown]').forEach(function (n) { n.textContent = txt; });
    // flip to celebration automatically at the reveal moment
    if (!preview && Date.now() >= CFG.REVEAL_UTC && collectingWas) { collectingWas = false; render(); }
  }
  var collectingWas = collecting();

  /* ---- data ------------------------------------------------------------- */
  function refreshCount() {
    API.getCount().then(function (r) { if (r && r.ok && r.count !== state.count) set({ count: r.count }); });
  }
  function loadInbox() {
    if (state.inbox) return;
    API.getWishes(adminKey()).then(function (r) {
      if (r && r.ok && r.wishes) {
        var ri = readIds();
        var list = r.wishes.map(function (w) {
          return { id: w.id, name: w.name, tag: w.tag, msg: w.message || w.msg || '', read: ri.indexOf(w.id) >= 0 };
        });
        set({ inbox: list });
      } else {
        set({ inbox: [] });
      }
    });
  }
  function inbox() { return state.inbox || []; }
  function unread() { return inbox().filter(function (w) { return !w.read; }); }

  /* ======================================================================
   * RENDER
   * ====================================================================*/
  function render() {
    var admin = isAdmin(), isR = admin && state.mode === 'racheal';

    // header: brand always; preview-as only for admin
    header.hidden = false;
    previewAs.hidden = !admin;
    if (admin) {
      previewAs.querySelector('[data-seg="racheal"]').className = 'seg' + (isR ? ' on' : '');
      previewAs.querySelector('[data-seg="friend"]').className = 'seg' + (isR ? '' : ' on');
    }

    // single-letter route takes over everything
    if (state.view === 'single') { footer.hidden = true; mountSingle(); return; }

    // COLLECTING: friends see only the write flow
    if (collecting() && !isR) {
      footer.hidden = true;
      mountWriteFlow(true);
      return;
    }

    // CELEBRATION (or admin)
    footer.hidden = false;
    $('bday-toggle').textContent = state.forceBday ? 'Back to today' : 'Preview 7 December';
    $('bday-toggle').hidden = !admin;
    footer.querySelector('[data-act="replayIntro"]').hidden = false;

    // intro / welcome overlay (once per load, celebration only, home view)
    if (celebrating() && !state.introDone && state.view === 'home') { showIntro(); }

    if (state.view === 'write' || state.view === 'sealing' || state.view === 'sent') { mountWriteFlow(false); return; }
    if (isR && state.view === 'envelope') { mountEnvelope(); return; }
    if (isR && state.view === 'letter') { mountLetter(); return; }
    if (isR && state.view === 'archive') { mountArchive(); return; }
    mountHome();
  }

  /* ---- HOME (scoreboard + court + cabinet) ------------------------------ */
  function mountHome() {
    var admin = isAdmin(), isR = admin && state.mode === 'racheal';
    var screen = el('div', { class: 'screen' });

    // confetti on the birthday
    if (bday()) screen.appendChild(confettiBlock());

    /* --- scoreboard --- */
    var board = el('div', { class: 'scoreboard in' }, [
      el('div', { class: 'top' }, [
        el('p', { class: 'sb-kicker', text: 'CENTRE COURT · 7 DECEMBER' }),
        el('p', { class: 'sb-status flick', text: bday() ? 'CELEBRATING' : 'WARMING UP' })
      ]),
      bday()
        ? el('div', { class: 'sb-bday' }, [
            el('p', { class: 'hb flick', text: 'Happy Birthday, Racheal' }),
            el('p', { class: 'slogan', text: 'THE YEAR IT OPENS UP' })
          ])
        : el('div', { class: 'sb-centre' }, [
            el('span', { class: 'small', text: 'NOW PLAYING ON CENTRE COURT' }),
            el('span', { class: 'title', html: 'Racheal\'s <em>Birthday Match</em>' }),
            el('span', { class: 'slogan', text: 'THE YEAR IT OPENS UP' })
          ]),
      el('div', { class: 'sb-cells' }, [
        cell('BIRTHDAY IN', countdownStr(), null, true),
        cell('LETTERS', String(state.count), function () {
          if (isR) { state.view = unread().length ? 'envelope' : 'archive'; render(); scrollTop(); }
          else { state.view = 'write'; state.fMsg=''; state.fName=''; render(); scrollTop(); }
        }),
        cell('TROPHIES', String(C.TROPHIES.length), function () { openPrize(C.TROPHIES, 'Trophy', 0); }),
        cell('QUOTES FOUND', state.found.filter(Boolean).length + ' / 4', null)
      ])
    ]);

    var actions = el('div', { class: 'sb-actions' });
    if (isR && unread().length) {
      actions.appendChild(el('button', { class: 'btn bob', style: 'display:inline-flex;align-items:center;gap:10px', onclick: function () { state.view='envelope'; render(); scrollTop(); } }, [
        svg('<svg width="24" height="18" viewBox="0 0 26 20" aria-hidden="true"><rect x="1" y="1" width="24" height="18" rx="3" fill="#fff"/><path d="M1.5 2.5l11.5 9 11.5-9" stroke="#1F5C36" stroke-width="1.6" fill="none"/></svg>'),
        document.createTextNode((unread().length === 1 ? '1 new wish' : unread().length + ' new wishes') + ' · Tap to read')
      ]));
    }
    if (isR && !unread().length && inbox().length) {
      actions.appendChild(el('button', { class: 'btn ghost-light', text: 'Reread every letter', onclick: function () { state.view='archive'; render(); scrollTop(); } }));
    }
    if (!isR) {
      actions.appendChild(el('button', { class: 'btn', text: 'Write Racheal a letter', onclick: function () { state.view='write'; render(); scrollTop(); } }));
    }
    actions.appendChild(el('span', { class: 'sb-hint', text: 'Tap Racheal to serve. Find the 4 hidden quotes on the court.' }));

    var scoreWall = el('section', { class: 'scoreboard-wall', 'aria-label': 'Scoreboard' }, [
      el('div', { style: 'max-width:900px;margin:0 auto', html: '' })
    ]);
    scoreWall.firstChild.appendChild(board);
    scoreWall.appendChild(actions);

    screen.appendChild(scoreWall);
    screen.appendChild(courtSection(isR));
    screen.appendChild(cabinetSection());

    swap(screen);
    if (isR) loadInbox();
  }

  function cell(k, v, onclick, isCountdown) {
    var vNode = el('span', { class: 'v', text: v });
    if (isCountdown) vNode.setAttribute('data-countdown', '');
    var kids = [el('span', { class: 'k', text: k }), vNode];
    if (onclick) return el('button', { class: 'cell', onclick: onclick }, kids);
    return el('div', { class: 'cell' }, kids);
  }

  /* ---- the court -------------------------------------------------------- */
  var COURT_SVG = '<svg viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true" class="court-bg">\
<rect x="0" y="0" width="1200" height="196" fill="#1E4A2C"/><rect x="0" y="150" width="1200" height="46" fill="#163A22"/>\
<g fill="#2A5C38" opacity=".55"><circle cx="80" cy="60" r="38"/><circle cx="150" cy="40" r="30"/><circle cx="1080" cy="70" r="40"/><circle cx="1140" cy="38" r="28"/><circle cx="300" cy="30" r="24"/><circle cx="900" cy="26" r="26"/></g>\
<rect x="0" y="192" width="1200" height="510" fill="#4C8A3C"/>\
<g fill="#579846"><polygon points="-482.3,650 1682.3,650 1509.1,552.4 -309.1,552.4"/><polygon points="-183.7,481.7 1383.7,481.7 1288.7,428.2 -88.7,428.2"/><polygon points="-14.3,386.2 1214.3,386.2 1154.3,352.4 45.7,352.4"/><polygon points="94.9,324.7 1105.1,324.7 1063.8,301.4 136.2,301.4"/><polygon points="171.2,281.7 1028.8,281.7 998.7,264.7 201.3,264.7"/><polygon points="227.4,250 972.6,250 949.7,237.1 250.3,237.1"/><polygon points="270.6,225.7 929.4,225.7 911.3,215.5 288.7,215.5"/><polygon points="304.8,206.4 895.2,206.4 880.6,198.1 319.4,198.1"/></g>\
<g fill="#B9A56E" opacity=".75"><ellipse cx="600" cy="612" rx="190" ry="34"/><ellipse cx="600" cy="232" rx="70" ry="8"/></g>\
<g fill="#C8B57E" opacity=".55"><ellipse cx="600" cy="606" rx="110" ry="20"/></g>\
<g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linejoin="round"><polygon points="60.3,650 1139.7,650 765.3,226.9 434.7,226.9"/><line x1="195.1" y1="650" x2="476" y2="226.9"/><line x1="1004.9" y1="650" x2="724" y2="226.9"/><line x1="334.1" y1="440.7" x2="865.9" y2="440.7"/><line x1="452.3" y1="262.5" x2="747.7" y2="262.5"/><line x1="600" y1="440.7" x2="600" y2="262.5"/><line x1="600" y1="650" x2="600" y2="634"/><line x1="600" y1="226.9" x2="600" y2="231"/></g>\
<polygon points="304.6,326.1 895.4,326.1 895.4,276.7 600,283.9 304.6,276.7" fill="rgba(20,20,20,.22)"/>\
<g stroke="rgba(25,25,25,.55)" stroke-width="1"><line x1="330" y1="278" x2="330" y2="326"/><line x1="360" y1="279" x2="360" y2="326"/><line x1="390" y1="280" x2="390" y2="326"/><line x1="420" y1="280" x2="420" y2="326"/><line x1="450" y1="281" x2="450" y2="326"/><line x1="480" y1="282" x2="480" y2="326"/><line x1="510" y1="282" x2="510" y2="326"/><line x1="540" y1="283" x2="540" y2="326"/><line x1="570" y1="283" x2="570" y2="326"/><line x1="630" y1="283" x2="630" y2="326"/><line x1="660" y1="283" x2="660" y2="326"/><line x1="690" y1="282" x2="690" y2="326"/><line x1="720" y1="282" x2="720" y2="326"/><line x1="750" y1="281" x2="750" y2="326"/><line x1="780" y1="280" x2="780" y2="326"/><line x1="810" y1="280" x2="810" y2="326"/><line x1="840" y1="279" x2="840" y2="326"/><line x1="870" y1="278" x2="870" y2="326"/><line x1="304.6" y1="292" x2="895.4" y2="292"/><line x1="304.6" y1="303" x2="895.4" y2="303"/><line x1="304.6" y1="314" x2="895.4" y2="314"/></g>\
<polyline points="304.6,276.7 600,283.9 895.4,276.7" fill="none" stroke="#fff" stroke-width="5"/>\
<line x1="600" y1="284" x2="600" y2="326" stroke="#fff" stroke-width="3"/>\
<g fill="#2B2B2B"><rect x="300" y="272" width="8" height="56" rx="2"/><rect x="892" y="272" width="8" height="56" rx="2"/></g></svg>';

  function spot(style, label, kids, onclick, cls) {
    return el('button', { class: 'spot' + (cls ? ' ' + cls : ''), style: style, 'aria-label': label, onclick: onclick }, kids);
  }
  function tag(text, green) { return el('span', { class: 'tag' + (green ? ' green' : ''), text: text }); }

  function courtSection(isR) {
    var court = el('div', { class: 'court' });
    court.appendChild(svg(COURT_SVG));

    // The Year (opponent)
    court.appendChild(spot('left:50%;top:30%', 'The Year, Racheal\'s opponent', [
      svg('<svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true"><circle cx="17" cy="8" r="7" fill="#2D2D2D"/><rect x="9" y="16" width="16" height="18" rx="5" fill="#E9EDE6"/><rect x="10" y="33" width="5" height="12" rx="2" fill="#2D2D2D"/><rect x="19" y="33" width="5" height="12" rx="2" fill="#2D2D2D"/></svg>'),
      tag('The Year')
    ], function () { state.yearI++; openPop({ kicker: 'Across the net', title: C.YEAR[(state.yearI - 1) % C.YEAR.length], text: '' }); }));

    // Racheal (serve)
    var face = el('span', { class: 'face' });
    var img = el('img', { src: CFG.PHOTO_COVER, alt: '' });
    img.addEventListener('error', function () { img.remove(); face.appendChild(el('span', { class: 'mono-fallback', text: 'R' })); });
    face.appendChild(img);
    court.appendChild(spot('left:52%;top:80%', 'Racheal. Tap to serve', [face, tag('Racheal · tap to serve', true)], serve, 'hop'));

    // serve ball (animates on serve)
    var serveBall = el('span', { class: 'serve-ball', 'aria-hidden': 'true', id: 'serve-ball', hidden: true }, [svg(ball(22))]);
    court.appendChild(serveBall);

    // hidden quote balls
    var QPOS = [[35, 68], [64, 55], [41, 43], [58, 36]];
    QPOS.forEach(function (pos, i) {
      var found = state.found[i];
      var inner = found
        ? el('span', { style: 'width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center' }, [svg('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F7A3B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>')])
        : svg('<svg class="gball-glow" width="30" height="30" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="#DFF04A"/><path d="M6 12c8 4 8 16 0 20M38 12c-8 4-8 16 0 20" stroke="#fff" stroke-width="2.5" fill="none"/></svg>');
      court.appendChild(spot('left:' + pos[0] + '%;top:' + pos[1] + '%', found ? 'Quote ' + (i + 1) + ', found' : 'Hidden tennis ball ' + (i + 1), [inner], function () { foundQuote(i); }));
    });

    // strawberries & cream
    court.appendChild(spot('left:20%;top:40%', 'Strawberries and cream: fun facts about Racheal', [
      svg('<svg class="wob" width="58" height="48" viewBox="0 0 58 48" aria-hidden="true"><path d="M8 22c2-8 10-12 21-12s19 4 21 12z" fill="#FFF8EA"/><circle cx="20" cy="16" r="6" fill="#E3263A"/><circle cx="32" cy="13" r="6.5" fill="#D11F33"/><circle cx="40" cy="18" r="5.5" fill="#E3263A"/><path d="M30 7l2 3 3-2" stroke="#3E8B3A" stroke-width="2" fill="none"/><path d="M4 22h50c0 13-11 22-25 22S4 35 4 22z" fill="#fff"/><path d="M4 22h50" stroke="#3E7A33" stroke-width="3"/></svg>'),
      tag('Strawberries & cream')
    ], function () { state.strawI++; openPop({ kicker: 'Strawberries & cream', title: C.STRAW[(state.strawI - 1) % C.STRAW.length], text: 'Tap the bowl again for another sweet one.' }); }));

    // the crowd (plays song)
    court.appendChild(spot('left:22%;top:13%', 'The crowd', [
      svg('<svg class="bob" width="92" height="34" viewBox="0 0 92 34" aria-hidden="true"><g fill="#F2D6B8"><circle cx="10" cy="12" r="7"/><circle cx="28" cy="10" r="7"/><circle cx="46" cy="12" r="7"/><circle cx="64" cy="10" r="7"/><circle cx="82" cy="12" r="7"/></g><g fill="#7A4E2D"><circle cx="28" cy="10" r="7" opacity=".9"/><circle cx="64" cy="10" r="7" opacity=".9"/></g><g fill="#E9EDE6"><rect x="3" y="20" width="14" height="14" rx="5"/><rect x="21" y="18" width="14" height="16" rx="5" fill="#DFF04A"/><rect x="39" y="20" width="14" height="14" rx="5"/><rect x="57" y="18" width="14" height="16" rx="5" fill="#F5D547"/><rect x="75" y="20" width="14" height="14" rx="5"/></g></svg>'),
      tag('The crowd')
    ], function () { var n = state.crowdI; state.crowdI++; playSong(); toast(C.CROWD[n % C.CROWD.length]); }));

    // challenge (rally game)
    court.appendChild(spot('left:84%;top:86%', 'Challenge: play a rally game', [
      el('span', { class: 'challenge-pill' }, [svg('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'), document.createTextNode('CHALLENGE')])
    ], openGame));

    // umpire
    court.appendChild(spot('left:82%;top:38%', 'Chair umpire', [
      svg('<svg width="44" height="70" viewBox="0 0 44 70" aria-hidden="true"><circle cx="22" cy="9" r="7" fill="#2D2D2D"/><rect x="13" y="16" width="18" height="16" rx="4" fill="#173F27"/><rect x="8" y="30" width="28" height="5" fill="#E9E2CF"/><path d="M11 35l-5 34M33 35l5 34M8 50h28" stroke="#E9E2CF" stroke-width="3.5"/></svg>'),
      tag('Umpire')
    ], function () { state.umpI++; openPop({ kicker: 'The umpire says', title: C.UMP[(state.umpI - 1) % C.UMP.length], text: '' }); }));

    return el('section', { class: 'court-wall', 'aria-label': 'The court' }, [court]);
  }

  function serve() {
    var b = $('serve-ball'); if (!b) return;
    if (state.serving) return;
    state.serving = true;
    var n = state.serveN; state.serveN++;
    var msg = C.SERVES[state.serveI % C.SERVES.length]; state.serveI++;
    b.hidden = false; b.className = 'serve-ball s' + (n % 2);
    clearTimeout(serve._t);
    serve._t = setTimeout(function () {
      state.serving = false; b.hidden = true; b.className = 'serve-ball';
      openPop({ kicker: 'Your serve', title: msg, text: '' });
    }, 1100);
  }

  function foundQuote(i) {
    if (!state.found[i]) { state.found[i] = true; }
    var n = state.found.filter(Boolean).length;
    openPop({ kicker: 'Quote ' + (i + 1) + ' · ' + n + ' of 4 found', title: C.QUOTES[i], text: n === 4 ? 'You found them all. Game, set, match.' : 'Keep looking. There are more balls on the court.' });
    // refresh the court so the found ball shows a check and the QUOTES cell updates
    if (state.view === 'home') render();
  }

  /* ---- trophy cabinet --------------------------------------------------- */
  function cabinetSection() {
    var trophyGrid = el('div', { class: 'prize-grid' });
    C.TROPHIES.forEach(function (t, i) {
      trophyGrid.appendChild(el('button', { class: 'tcard', onclick: function () { openPrize(C.TROPHIES, 'Trophy', i); } }, [
        el('span', { class: 'ticon trophy', 'aria-hidden': 'true' }, [svg('<svg width="54" height="68" viewBox="0 0 58 72"><path d="M15 4h28v14c0 10-6 18-14 18S15 28 15 18z" fill="#E0B23A"/><path d="M15 9H5c0 10 5 15 11 15M43 9h10c0 10-5 15-11 15" stroke="#C9971F" stroke-width="4" fill="none"/><rect x="25" y="35" width="8" height="14" fill="#C9971F"/><rect x="15" y="49" width="28" height="7" rx="2" fill="#E0B23A"/><rect x="11" y="56" width="36" height="12" rx="2" fill="#0F2E1C"/><path d="M21 10l4 10" stroke="#FFF1B8" stroke-width="3" stroke-linecap="round"/></svg>')]),
        el('span', { class: 'tlabel', text: t.title }),
        el('span', { class: 'tnum', text: 'TROPHY ' + (i + 1) })
      ]));
    });
    var medalGrid = el('div', { class: 'prize-grid' });
    C.MEDALS.forEach(function (md, i) {
      medalGrid.appendChild(el('button', { class: 'tcard medal', onclick: function () { openPrize(C.MEDALS, 'Medal', i); } }, [
        el('span', { class: 'ticon medal', 'aria-hidden': 'true' }, [svg('<svg width="40" height="58" viewBox="0 0 44 62"><path d="M10 0h10l6 22H16zM24 0h10l-6 22h-10z" fill="#1F5C36"/><path d="M20 0h4l-2 22z" fill="#DFF04A"/><circle cx="22" cy="40" r="17" fill="#E0B23A"/><circle cx="22" cy="40" r="11" fill="none" stroke="#FFF1B8" stroke-width="2"/></svg>')]),
        el('span', { class: 'tlabel', text: md.title }),
        el('span', { class: 'tnum', text: 'MEDAL ' + (i + 1) })
      ]));
    });

    return el('section', { class: 'cabinet-wall', 'aria-label': 'Trophy cabinet' }, [
      el('div', { class: 'cabinet' }, [
        el('div', { class: 'cabinet-head' }, [
          el('h2', { text: 'The trophy cabinet' }),
          el('p', { text: 'Trophies are the big wins. Medals are the small ones. Tap any.' })
        ]),
        el('div', { class: 'shelf' }, [
          el('p', { class: 'shelf-label', text: 'TROPHIES' }), trophyGrid,
          el('div', { class: 'shelf-divider' }),
          el('p', { class: 'shelf-label', text: 'MEDALS' }), medalGrid
        ])
      ])
    ]);
  }

  /* ======================================================================
   * WRITE / SEAL / THANK-YOU  (priority #1: the Collecting flow)
   * ====================================================================*/
  function mountWriteFlow(isCollecting) {
    if (state.view === 'sealing') return mountSealing(isCollecting);
    if (state.view === 'sent') return mountSent(isCollecting);
    mountWrite(isCollecting);
  }

  function mountWrite(isCollecting) {
    var titleA = isCollecting ? 'Wish Racheal a' : 'Write her';
    var titleB = isCollecting ? 'happy birthday' : 'a letter';
    var sub = isCollecting
      ? 'Write her a birthday letter. She will open every one on 7 December, the day her year opens up.'
      : 'This is the year it opens up for her. On 7 December she opens every letter.';

    var msgInput = el('textarea', { id: 'fmsg', class: 'ink', rows: '5', placeholder: 'This year, I wish you...' });
    msgInput.value = state.fMsg;
    msgInput.addEventListener('input', function () { state.fMsg = msgInput.value; state.fError = false; });

    var nameInput = el('input', { id: 'fname', class: 'ink', placeholder: 'your name' });
    nameInput.value = state.fName;
    nameInput.addEventListener('input', function () { state.fName = nameInput.value; state.fError = false; });

    // honeypot
    var honey = el('input', { id: 'website', name: 'website', autocomplete: 'off', tabindex: '-1', 'aria-hidden': 'true', style: 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0' });

    var stampGrid = el('div', { class: 'stamp-grid' });
    var ICONS = {
      Career: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
      Love: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
      Money: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
      Travel: '<path d="M2 16l20-8-6 12-3-5-5 2zM13 15l3-5"/>',
      Joy: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
      Balance: '<path d="M12 3v17M7 21h10M4 7h16M4 7l-2.5 6h5zM20 7l-2.5 6h5z"/>'
    };
    C.TAGS.forEach(function (t, i) {
      var on = state.fTag === t;
      var style = 'padding:16px 6px 12px;min-height:92px;border:0;outline:2.5px dashed ' + (on ? '#fff' : '#1F5C36') + ';outline-offset:-7px;background:' + (on ? '#1F5C36' : '#fff') + ';color:' + (on ? '#fff' : '#1F5C36') + ';box-shadow:0 0 0 1.5px #1F5C36;transform:rotate(' + (on ? (i % 2 ? 3 : -3) : 0) + 'deg) scale(' + (on ? 1.04 : 1) + ')';
      stampGrid.appendChild(el('button', { class: 'stamp', style: style, 'aria-pressed': on ? 'true' : 'false', onclick: function () { syncForm(); state.fTag = t; render(); } }, [
        el('span', { style: 'display:flex;justify-content:center' }, [svg('<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[t] + '</svg>')]),
        el('span', { style: 'display:block;margin-top:6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase', text: t })
      ]));
    });

    var writeCard = el('div', { class: 'write-card ruled in' }, [
      el('p', { class: 'hand', style: 'margin:0;font-size:32px;line-height:42px', text: 'Dear Racheal,' }),
      el('label', { for: 'fmsg', class: 'sr-only', text: 'Your wish for Racheal' }),
      msgInput, honey,
      el('div', { style: 'margin:26px 0 8px;background:#fff;padding:4px 0' }, [
        el('p', { style: 'margin:0 0 12px;font-size:14px;font-weight:700;color:#173F27', text: 'Choose a stamp: what should open up for her this year?' }),
        stampGrid
      ]),
      el('p', { class: 'hand', style: 'margin:22px 0 0;font-size:30px;line-height:42px', text: 'With love,' }),
      el('label', { for: 'fname', class: 'sr-only', text: 'Your name' }),
      nameInput
    ]);

    var screen = el('section', { class: 'screen paper-screen', 'aria-label': 'Write Racheal a letter', style: 'align-items:center;gap:28px;padding:56px 20px 88px' }, [
      el('div', { class: 'in', style: 'text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;max-width:560px' }, [
        el('p', { style: 'margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#1F5C36;font-weight:700', text: "Racheal's birthday · 7 December" }),
        el('h1', { style: 'margin:0;font-family:\'Instrument Serif\',serif;font-weight:400;font-size:clamp(44px,8vw,72px);line-height:1;color:#173F27', html: titleA + ' <em style="color:#1F5C36">' + titleB + '</em>' }),
        el('p', { style: 'margin:0;font-size:17px;line-height:1.6;color:#34503D', text: sub })
      ]),
      writeCard,
      state.fError ? el('p', { style: 'margin:0;font-size:15px;color:#1F5C36', text: 'Write your wish and sign your name first.' }) : null,
      el('button', { class: 'btn', style: 'padding:16px 34px', text: 'Seal it with love', onclick: seal })
    ]);
    swap(screen);
  }

  function syncForm() {
    var fm = $('fmsg'), fn = $('fname');
    if (fm) state.fMsg = fm.value;
    if (fn) state.fName = fn.value;
  }

  function seal() {
    syncForm();
    var honey = $('website');
    if (!state.fMsg.trim() || !state.fName.trim()) { state.fError = true; render(); return; }
    var payload = { name: state.fName.trim(), message: state.fMsg.trim(), tag: state.fTag, website: honey ? honey.value : '' };
    state.pendingName = payload.name;
    state.view = 'sealing'; render(); scrollTop();

    API.sendWish(payload).then(function (r) {
      if (r && r.ok) {
        state.myId = r.id; state.myNumber = r.number;
        state.wishBack = C.BLESSINGS[Math.floor(Math.random() * C.BLESSINGS.length)];
        setTimeout(function () { state.view = 'sent'; render(); scrollTop(); }, 1500);
      } else {
        // keep their text, let them retry
        state.view = 'write';
        state.sendError = (r && r.error) || 'Something went wrong. Please try again.';
        render();
        toast(state.sendError);
        state.sendError = '';
      }
    }).catch(function () {
      state.view = 'write';
      render();
      toast('Could not send just now. Your letter is still here — try again.');
    });
  }

  function mountSealing(isCollecting) {
    var env = el('div', { class: 'env open', 'aria-hidden': 'true' }, [
      el('span', { class: 'back' }),
      el('span', { class: 'paper ruled' }, [el('span', { class: 'hand', style: 'display:block;font-size:24px;line-height:42px', text: 'Dear Racheal,' })]),
      el('span', { class: 'front' }),
      el('span', { class: 'flap' }),
      el('span', { class: 'seal' }, [svg(ball(34))])
    ]);
    // close the flap shortly after mount for the sealing effect
    setTimeout(function () { env.className = 'env'; }, 250);
    swap(el('section', { class: 'screen paper-screen', 'aria-label': 'Sealing your letter', style: 'align-items:center;justify-content:center;gap:30px;padding:88px 20px' }, [
      env, el('p', { class: 'hand', style: 'margin:0;font-size:32px', text: 'Sealing it with love...' })
    ]));
  }

  function mountSent(isCollecting) {
    var letterRoute = 'birthday.rachealkuranchie.com/letter/' + (state.myId || '');
    var kids = [
      el('div', { class: 'in', style: 'display:flex;flex-direction:column;gap:10px;align-items:center' }, [
        el('p', { style: 'margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#1F5C36;font-weight:700', text: 'Letter #' + (state.myNumber || '') + ' is on its way' }),
        el('h1', { style: 'margin:0;font-family:\'Instrument Serif\',serif;font-weight:400;font-size:clamp(40px,7vw,64px);line-height:1.05;color:#173F27', html: 'Thank you, <em style="color:#1F5C36">' + escapeHtml(state.pendingName || '') + '</em>' })
      ]),
      el('div', { class: 'in ruled', style: 'position:relative;width:min(100%,460px);box-sizing:border-box;border:1.5px solid #1F5C36;border-radius:6px;padding:30px 30px 26px;text-align:left;transform:rotate(-1.5deg);box-shadow:8px 8px 0 #EAF1E1' }, [
        el('p', { style: 'margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5B6B5F;line-height:42px', text: 'A note back from Racheal' }),
        el('p', { class: 'hand', style: 'margin:0;font-size:28px;line-height:42px', text: state.wishBack || '' }),
        el('p', { class: 'hand', style: 'margin:0;font-size:28px;line-height:42px;text-align:right', html: 'Racheal <span class="heart">&#9825;</span>' })
      ]),
      el('p', { style: 'margin:0;font-size:15px;color:#34503D' }, [
        document.createTextNode('Keep this link to reread your letter: '),
        el('a', { href: '/letter/' + (state.myId || '') }, [document.createTextNode(letterRoute)])
      ])
    ];

    if (collecting()) {
      kids.push(el('div', { class: 'countdown-box' }, [
        el('span', { class: 'k', text: 'THE BIRTHDAY COURT OPENS IN' }),
        (function () { var v = el('span', { class: 'v', text: countdownStr() }); v.setAttribute('data-countdown', ''); return v; })(),
        el('span', { class: 'sub', text: 'Come back on 7 December to see the full celebration.' })
      ]));
    }

    var row = el('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center' });
    if (!collecting()) row.appendChild(el('button', { class: 'btn', text: 'Back to the court', onclick: function () { state.view = 'home'; render(); scrollTop(); } }));
    row.appendChild(el('button', { class: 'btn ghost', text: 'Write another letter', onclick: function () { state.fMsg = ''; state.fName = ''; state.fTag = 'Career'; state.view = 'write'; render(); scrollTop(); } }));
    kids.push(row);

    swap(el('section', { class: 'screen paper-screen', 'aria-label': 'Letter sent', style: 'align-items:center;gap:26px;padding:64px 20px 88px;text-align:center' }, kids));
  }

  /* ======================================================================
   * SINGLE LETTER (sender rereads own) — /letter/{id}
   * ====================================================================*/
  function mountSingle() {
    if (!state.single && !state.singleErr) {
      API.getLetter(letterId).then(function (r) {
        if (r && r.ok && r.wish) set({ single: r.wish }); else set({ singleErr: (r && r.error) || 'Letter not found.' });
      });
      swap(el('section', { class: 'screen paper-screen', style: 'align-items:center;justify-content:center;padding:80px 20px' }, [el('p', { class: 'hand', style: 'font-size:30px', text: 'Fetching your letter…' })]));
      return;
    }
    if (state.singleErr) {
      swap(el('section', { class: 'screen paper-screen', style: 'align-items:center;justify-content:center;gap:20px;padding:80px 20px;text-align:center' }, [
        el('h1', { style: 'font-family:\'Instrument Serif\',serif;font-weight:400;font-size:40px;color:#173F27', text: 'We could not find that letter' }),
        el('a', { class: 'btn', href: '/', text: 'Go to the court' })
      ]));
      return;
    }
    var w = state.single;
    swap(el('section', { class: 'screen paper-screen', 'aria-label': 'Your letter', style: 'align-items:center;gap:28px;padding:56px 20px 88px' }, [
      el('article', { class: 'in ruled letter-card' }, [
        el('div', { class: 'letter-stamp', style: 'transform:rotate(4deg)', text: w.tag || 'Joy' }),
        el('div', { class: 'postmark', 'aria-hidden': 'true', html: 'OPENS UP<br>7 DEC' }),
        el('p', { class: 'hand', style: 'margin:0;font-size:32px;line-height:42px', text: 'Dear Racheal,' }),
        el('p', { class: 'hand', style: 'margin:0;font-size:30px;line-height:42px;color:#173F27;white-space:pre-line', text: w.message || w.msg || '' }),
        el('p', { class: 'hand', style: 'margin:42px 0 0;font-size:30px;line-height:42px', html: 'With love,<br>' + escapeHtml(w.name || '') })
      ]),
      el('a', { class: 'btn', href: '/', text: 'Back to the court' })
    ]));
  }

  /* ======================================================================
   * ADMIN: envelope inbox, letter reader, archive
   * ====================================================================*/
  function mountEnvelope() {
    var u = unread();
    if (!u.length) { state.view = 'archive'; return render(); }
    var env = el('button', { class: 'env' + (state.opening ? ' open' : ''), 'aria-label': 'Tap to open your letter', onclick: openEnvelope }, [
      el('span', { class: 'back' }),
      el('span', { class: 'paper ruled' }, [el('span', { class: 'hand', style: 'display:block;font-size:24px;line-height:42px', text: 'Dear Racheal,' })]),
      el('span', { class: 'front' }),
      el('span', { class: 'flap' }),
      el('span', { class: 'seal' }, [svg(ball(34))])
    ]);
    var stackWrap = el('div', { class: 'bob', style: 'position:relative' });
    if (u.length > 1) { stackWrap.appendChild(el('div', { class: 'stack2', 'aria-hidden': 'true' })); stackWrap.appendChild(el('div', { class: 'stack', 'aria-hidden': 'true' })); }
    stackWrap.appendChild(env);

    swap(el('section', { class: 'screen paper-screen', 'aria-label': 'New wishes', style: 'align-items:center;justify-content:center;gap:36px;padding:64px 20px 88px;text-align:center' }, [
      el('div', { class: 'in', style: 'display:flex;flex-direction:column;gap:10px;align-items:center' }, [
        el('p', { style: 'margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#1F5C36;font-weight:700', text: u.length === 1 ? '1 new wish' : u.length + ' new wishes' }),
        el('h1', { style: 'margin:0;font-family:\'Instrument Serif\',serif;font-weight:400;font-size:clamp(44px,8vw,76px);line-height:1;color:#173F27', html: 'Someone wrote you <em style="color:#1F5C36">a letter</em>' })
      ]),
      stackWrap,
      el('p', { class: 'hand', style: 'margin:0;font-size:30px', html: 'Tap to read <span class="heart">&#9825;</span>' })
    ]));
  }

  function openEnvelope() {
    if (state.opening) return;
    var u = unread(); if (!u.length) return;
    var next = u[0];
    state.opening = true; render();
    setTimeout(function () { state.opening = false; state.view = 'letter'; state.curId = next.id; render(); scrollTop(); }, 1150);
  }

  function mountLetter() {
    var w = inbox().filter(function (x) { return x.id === state.curId; })[0] || { name: '', msg: '', tag: '' };
    var remaining = unread().filter(function (x) { return x.id !== w.id; }).length;
    swap(el('section', { class: 'screen paper-screen', 'aria-label': 'Your letter', style: 'align-items:center;gap:28px;padding:56px 20px 88px' }, [
      el('article', { class: 'in ruled letter-card' }, [
        el('div', { class: 'letter-stamp', style: 'transform:rotate(4deg)', text: w.tag }),
        el('div', { class: 'postmark', 'aria-hidden': 'true', html: 'OPENS UP<br>7 DEC' }),
        el('p', { class: 'hand', style: 'margin:0;font-size:32px;line-height:42px', text: 'Dear Racheal,' }),
        el('p', { class: 'hand', style: 'margin:0;font-size:30px;line-height:42px;color:#173F27;white-space:pre-line', text: w.msg }),
        el('p', { class: 'hand', style: 'margin:42px 0 0;font-size:30px;line-height:42px', html: 'With love,<br>' + escapeHtml(w.name) })
      ]),
      el('button', { class: 'btn', text: remaining > 0 ? 'Next letter' : 'Back to the court', onclick: function () {
        // mark read
        markRead(w.id);
        state.inbox = inbox().map(function (x) { return x.id === w.id ? Object.assign({}, x, { read: true }) : x; });
        var left = unread().length;
        state.view = left ? 'envelope' : 'home'; state.curId = null; render(); scrollTop();
      } })
    ]));
  }

  function mountArchive() {
    var all = inbox();
    var grid = el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:28px 22px' });
    all.forEach(function (w, i) {
      var envStyle = 'position:relative;display:block;width:100%;aspect-ratio:3/2;border-radius:10px;background:' + (i % 3 === 1 ? '#173F27' : '#1F5C36') + ';transform:rotate(' + ([-2, 1.5, -1, 2][i % 4]) + 'deg);box-shadow:0 8px 0 #EAF1E1';
      grid.appendChild(el('button', { class: 'mini', 'aria-label': 'Letter from ' + w.name, onclick: function () { state.modalId = w.id; openLetterModal(w); } }, [
        el('span', { style: envStyle }, [
          el('span', { style: 'position:absolute;left:0;right:0;top:0;height:58%;background:#fff;clip-path:polygon(0 0,100% 0,50% 100%);opacity:.14' }),
          el('span', { class: 'hand', style: 'position:absolute;left:18px;bottom:14px;font-size:26px;color:#fff', text: 'From ' + w.name }),
          el('span', { style: 'position:absolute;right:12px;top:12px;background:#fff;color:#1F5C36;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 7px;border:1.5px dashed #1F5C36', text: w.tag })
        ])
      ]));
    });
    swap(el('section', { class: 'screen paper-screen', 'aria-label': 'Every letter', style: 'padding:56px 20px 88px' }, [
      el('div', { style: 'max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:32px' }, [
        el('div', { class: 'in', style: 'display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px' }, [
          el('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
            el('p', { style: 'margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#1F5C36;font-weight:700', text: all.length + ' letters, kept all year' }),
            el('h1', { style: 'margin:0;font-family:\'Instrument Serif\',serif;font-weight:400;font-size:60px;line-height:1;color:#173F27', text: 'My letters' })
          ]),
          el('button', { class: 'btn ghost', text: 'Back to the court', onclick: function () { state.view = 'home'; render(); scrollTop(); } })
        ]),
        grid,
        API.live ? null : el('p', { style: 'margin:0;font-size:13px;color:#5B6B5F', text: 'Sample letters, shown in demo mode. Real letters appear here once the backend is connected.' })
      ])
    ]));
  }

  function openLetterModal(w) {
    clear(popLayer);
    var card = el('article', { role: 'dialog', 'aria-label': 'Letter', class: 'in ruled letter-modal' }, [
      el('div', { class: 'letter-stamp', style: 'transform:rotate(5deg)', text: w.tag }),
      el('p', { class: 'hand', style: 'margin:0;font-size:30px;line-height:42px', text: 'Dear Racheal,' }),
      el('p', { class: 'hand', style: 'margin:0;font-size:28px;line-height:42px;color:#173F27;white-space:pre-line', text: w.msg }),
      el('p', { class: 'hand', style: 'margin:30px 0 0;font-size:28px;line-height:42px', html: 'With love,<br>' + escapeHtml(w.name) }),
      el('button', { class: 'btn', style: 'margin-top:18px', text: 'Fold it back', onclick: closeOverlays })
    ]);
    var ov = el('div', { class: 'overlay scroll' }, [el('button', { class: 'backdrop', 'aria-label': 'Close', onclick: closeOverlays }), card]);
    popLayer.appendChild(ov);
    trapFocus(ov);
  }

  /* ======================================================================
   * POP CARD (serve / quotes / straw / umpire / year / trophies / medals)
   * ====================================================================*/
  function openPop(pop) {
    clear(popLayer);
    var kids = [
      el('span', { class: 'kicker', text: pop.kicker }),
      el('p', { class: 'title', text: pop.title })
    ];
    if (pop.text) kids.push(el('p', { class: 'body', text: pop.text }));
    var row = el('div', { class: 'row' });
    if (pop.list) row.appendChild(el('button', { class: 'btn', style: 'background:#173F27', text: 'Next ' + pop.kind.toLowerCase(), onclick: function () { openPrize(pop.list, pop.kind, (pop.i + 1) % pop.list.length); } }));
    row.appendChild(el('button', { class: 'btn ghost', text: 'Close', onclick: closeOverlays }));
    kids.push(row);
    var card = el('article', { role: 'dialog', 'aria-label': pop.kicker, class: 'pop in' }, kids);
    var ov = el('div', { class: 'overlay' }, [el('button', { class: 'backdrop', 'aria-label': 'Close', onclick: closeOverlays }), card]);
    popLayer.appendChild(ov);
    trapFocus(ov);
  }
  function openPrize(list, kind, i) {
    openPop({ kicker: kind + ' ' + (i + 1) + ' of ' + list.length, title: list[i].title, text: list[i].text, list: list, kind: kind, i: i });
  }

  function closeOverlays() { clear(popLayer); releaseFocus(); }

  /* ======================================================================
   * TOAST
   * ====================================================================*/
  function toast(msg) {
    clear(toastLayer);
    var t = el('div', { role: 'status', class: 'toast in' }, [
      svg('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5D547" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'),
      el('span', { text: msg })
    ]);
    toastLayer.appendChild(t);
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { clear(toastLayer); }, 6000);
  }

  /* ======================================================================
   * SONG — YouTube IFrame API (lazy), fallback to a WebAudio chime
   * ====================================================================*/
  var songState = { ready: false, player: null, playing: false, chime: null };
  function playSong() {
    if (CFG.SONG_YOUTUBE_ID) { ytPlay(); return; }
    // fallback chime (ported from prototype)
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      var ctx = new Ctx();
      var N = [[392,.75],[392,.25],[440,1],[392,1],[523.25,1],[493.88,2],[392,.75],[392,.25],[440,1],[392,1],[587.33,1],[523.25,2],[392,.75],[392,.25],[783.99,1],[659.25,1],[523.25,1],[493.88,1],[440,2],[698.46,.75],[698.46,.25],[659.25,1],[523.25,1],[587.33,1],[523.25,2.5]];
      var beat = 0.42, t = ctx.currentTime + 0.1;
      N.forEach(function (p) { var f = p[0], d = p[1]; var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d * beat - 0.02); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d * beat); t += d * beat; });
      showSongChip();
    } catch (e) {}
  }
  function ytPlay() {
    if (songState.player) { try { songState.player.playVideo(); } catch (e) {} showSongChip(); return; }
    loadYT(function () {
      var holder = el('div', { id: 'yt-holder', style: 'position:fixed;width:1px;height:1px;left:-9999px;top:-9999px' });
      document.body.appendChild(holder);
      songState.player = new YT.Player('yt-holder', {
        height: '1', width: '1', videoId: CFG.SONG_YOUTUBE_ID,
        playerVars: { autoplay: 1, playsinline: 1 },
        events: {
          onReady: function (e) { e.target.playVideo(); songState.playing = true; showSongChip(); },
          onStateChange: function (e) { songState.playing = (e.data === YT.PlayerState.PLAYING); updateSongChip(); }
        }
      });
    });
  }
  function loadYT(cb) {
    if (window.YT && window.YT.Player) return cb();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) prev(); cb(); };
    if (!document.getElementById('yt-api')) {
      var s = el('script', { id: 'yt-api', src: 'https://www.youtube.com/iframe_api' });
      document.head.appendChild(s);
    }
  }
  function showSongChip() {
    clear(songLayer);
    var btn = el('button', { 'aria-label': 'Pause the music', onclick: toggleSong }, [svg('<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>')]);
    songState.chipBtn = btn;
    songLayer.appendChild(el('div', { class: 'song-chip in' }, [
      svg('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5D547" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'),
      el('span', { text: CFG.SONG_TITLE || 'Now playing' }),
      btn
    ]));
  }
  function updateSongChip() { if (songState.chipBtn) songState.chipBtn.innerHTML = songState.playing ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'; }
  function toggleSong() {
    if (!songState.player) { clear(songLayer); return; }
    try { if (songState.playing) songState.player.pauseVideo(); else songState.player.playVideo(); } catch (e) {}
  }

  /* ======================================================================
   * RALLY GAME (tennis scoring, 3 lives, faster per game)
   * ====================================================================*/
  var G = null;
  function openGame() {
    clear(gameLayer);
    G = { dur: 2300, pt: 0, games: 0, lives: 3, phase: 'serve', over: '', key: 0, start: 0 };
    var overlay = el('div', { class: 'game-overlay' });
    var strip = el('button', { class: 'strip', 'aria-label': 'Swing at the ball', onclick: swing });
    strip.appendChild(el('span', { class: 'net', 'aria-hidden': 'true' }));
    strip.appendChild(el('span', { class: 'zone', 'aria-hidden': 'true' }));
    strip.appendChild(el('span', { class: 'who year', text: 'THE YEAR' }));
    strip.appendChild(el('span', { class: 'who you', text: 'YOU' }));
    var racket = el('span', { class: 'racket', 'aria-hidden': 'true' }, [svg('<svg width="40" height="70" viewBox="0 0 40 70"><ellipse cx="20" cy="20" rx="15" ry="18" fill="rgba(255,255,255,.15)" stroke="#fff" stroke-width="3"/><path d="M8 14h24M7 22h26M10 30h20M14 6v28M20 3v34M26 6v28" stroke="rgba(255,255,255,.6)" stroke-width="1"/><rect x="17" y="38" width="6" height="30" rx="3" fill="#F5D547"/></svg>')]);
    strip.appendChild(racket);
    var cheer = el('span', { class: 'cheer in', hidden: true });
    strip.appendChild(cheer);

    var ballWrap = el('span', { class: 'gball' }, [
      el('span', { class: 'shadow', 'aria-hidden': 'true' }),
      el('span', { class: 'bounce' }, [svg(ball(26))])
    ]);
    strip.appendChild(ballWrap);

    var hud = el('div', { class: 'hud' }, [
      el('span', { class: 'k', text: 'GAMES' }), el('span', { class: 'k', text: 'POINTS' }), el('span', { class: 'k', text: 'CHANCES' }),
      el('span', { class: 'v', id: 'g-games', text: '0' }),
      el('span', { class: 'v', id: 'g-points', text: '0' }),
      el('span', { class: 'lives', id: 'g-lives' })
    ]);

    var msg = el('p', { class: 'gmsg', id: 'g-msg', 'aria-live': 'polite', text: 'Round 1. Hit the ball in the yellow zone. You have 3 chances — win 3 games to beat The Year.' });
    var buttons = el('div', { class: 'buttons', id: 'g-buttons' });

    var panel = el('div', { role: 'dialog', 'aria-label': 'Rally challenge', class: 'game in' }, [
      el('div', { class: 'head' }, [
        el('div', {}, [el('p', { class: 'round', id: 'g-round', text: 'ROUND 1 · BEAT THE YEAR IN 3 GAMES' }), el('p', { class: 'title', text: 'Return The Year\'s serve' })]),
        hud
      ]),
      strip, msg, buttons
    ]);
    overlay.appendChild(panel);
    gameLayer.appendChild(overlay);
    G.els = { strip: strip, racket: racket, cheer: cheer, ballWrap: ballWrap, bounce: ballWrap.querySelector('.bounce'), games: $('g-games'), points: $('g-points'), lives: $('g-lives'), msg: msg, round: $('g-round'), buttons: buttons };
    trapFocus(overlay);
    renderGameButtons();
    renderLives();
    startServe();
  }
  function startServe() {
    if (!G || G.over) return;
    clearTimeout(G._missT); clearTimeout(G._t);
    G.phase = 'serve'; G.key++; G.start = Date.now();
    var k = G.key % 2;
    G.els.ballWrap.hidden = false;
    G.els.ballWrap.className = 'gball gb' + k; G.els.ballWrap.style.animationDuration = G.dur + 'ms';
    G.els.bounce.className = 'bounce gbn' + k; G.els.bounce.style.animationDuration = G.dur + 'ms';
    // One swing per serve: if the ball passes without a swing, it is a miss.
    G._missT = setTimeout(function () { if (G && G.phase === 'serve' && !G.over) registerMiss('Missed it! You let the ball go by.'); }, G.dur + 60);
  }
  function stopBall() { if (G && G.els) { G.els.ballWrap.hidden = true; } }
  function setResult(text, kind) {
    G.els.msg.textContent = text;
    G.els.msg.className = 'gmsg result ' + (kind || '');
  }
  function registerMiss(reason) {
    if (!G || G.over) return;
    clearTimeout(G._missT); clearTimeout(G._t);
    G.phase = 'between';
    G.lives -= 1;
    renderLives();
    setCheer('Aaah...');
    if (G.lives <= 0) {
      G.over = 'lost'; stopBall();
      setResult('Game over — The Year takes the match.' + (G.games > 0 ? ' You won ' + G.games + (G.games === 1 ? ' game.' : ' games.') : '') + ' Tap Rematch to try again.', 'lose');
      renderGameButtons();
    } else {
      G.els.msg.className = 'gmsg';
      G.els.msg.textContent = reason + ' ' + G.lives + (G.lives === 1 ? ' chance' : ' chances') + ' left.';
      G._t = setTimeout(function () { setCheer(''); startServe(); }, 750);
    }
  }
  function setCheer(txt) { if (txt) { G.els.cheer.textContent = txt; G.els.cheer.hidden = false; } else { G.els.cheer.hidden = true; } }
  function renderLives() {
    clear(G.els.lives);
    for (var i = 0; i < 3; i++) G.els.lives.appendChild(el('span', { style: 'background:' + (i < G.lives ? '#DFF04A' : 'rgba(255,255,255,.18)') }));
  }
  function renderGameButtons() {
    clear(G.els.buttons);
    if (!G.over) G.els.buttons.appendChild(el('button', { class: 'btn gold', style: 'flex:1 1 200px;font-size:18px;letter-spacing:2px', text: 'SWING', onclick: swing }));
    if (G.over === 'won') G.els.buttons.appendChild(el('button', { class: 'btn gold', style: 'flex:1 1 200px', text: 'Champion! Play again', onclick: resetGame }));
    if (G.over === 'lost') G.els.buttons.appendChild(el('button', { class: 'btn gold', style: 'flex:1 1 200px', text: 'Rematch', onclick: resetGame }));
    G.els.buttons.appendChild(el('button', { class: 'btn ghost-light', text: 'Close', onclick: closeGame }));
  }
  function swing() {
    if (!G || G.over || G.phase !== 'serve') return; // one swing per serve; ignore between serves
    clearTimeout(G._missT);
    var dur = G.dur;
    var phase = ((Date.now() - (G.start || Date.now())) % dur) / dur;
    // swing the racket
    G.els.racket.classList.remove('sw0', 'sw1'); void G.els.racket.offsetWidth; G.els.racket.classList.add('sw0');
    if (phase > 0.72 && phase < 0.98) {
      var sweet = phase > 0.82 && phase < 0.9;
      var pt = G.pt + 1, games = G.games, nd = dur, msg, cheer;
      if (pt === 4) { pt = 0; games += 1; nd = Math.round(dur * 0.86); msg = games >= 3 ? 'Game, set, birthday! You beat The Year — you are the champion.' : 'Game, Racheal! That makes ' + games + '. Win ' + (3 - games) + ' more. Serves get faster now.'; cheer = 'The crowd goes wild!'; }
      else { msg = sweet ? 'Sweet spot! Clean winner.' : ['Nice return!', 'Down the line!', 'Cross-court beauty!'][pt % 3]; cheer = sweet ? 'Ooooh!' : 'Clap clap clap'; }
      G.pt = pt; G.games = games; G.dur = nd; G.phase = 'return'; G.over = games >= 3 ? 'won' : '';
      // return animation
      G.els.ballWrap.className = 'gball gret'; G.els.ballWrap.style.animationDuration = '450ms';
      G.els.bounce.className = 'bounce garc'; G.els.bounce.style.animationDuration = '450ms';
      setCheer(cheer);
      G.els.points.textContent = ['0', '15', '30', '40'][G.pt];
      G.els.games.textContent = String(G.games);
      G.els.round.textContent = ['ROUND 1', 'SEMI-FINAL', 'FINAL'][Math.min(G.games, 2)] + ' · BEAT THE YEAR IN 3 GAMES';
      if (games >= 3) { stopBall(); setResult(msg, 'win'); renderGameButtons(); }
      else { G.els.msg.className = 'gmsg'; G.els.msg.textContent = msg; G.phase = 'return'; clearTimeout(G._t); G._t = setTimeout(function () { setCheer(''); startServe(); }, 520); }
    } else {
      registerMiss(phase <= 0.72 ? 'Too early!' : 'Too late!');
    }
  }
  function resetGame() { clearTimeout(G._t); clearTimeout(G._missT); G.dur = 2300; G.pt = 0; G.games = 0; G.lives = 3; G.over = ''; G.phase = 'serve'; G.els.points.textContent = '0'; G.els.games.textContent = '0'; G.els.round.textContent = 'ROUND 1 · BEAT THE YEAR IN 3 GAMES'; G.els.msg.className = 'gmsg'; G.els.msg.textContent = 'New match. Round 1. 3 chances.'; setCheer(''); renderLives(); renderGameButtons(); startServe(); }
  function closeGame() { if (G) clearTimeout(G._t); clear(gameLayer); G = null; releaseFocus(); }

  /* ======================================================================
   * INTRO / WELCOME ANIMATION
   * ====================================================================*/
  function showIntro() {
    state.introDone = true; // runs once per load unless replayed
    clear(introLayer);
    var photo = el('img', { class: 'photo photo-anim', src: CFG.PHOTO_TENNIS, alt: 'Racheal' });
    photo.addEventListener('error', function () {
      if (photo.src.indexOf(CFG.PHOTO_COVER) < 0) { photo.src = CFG.PHOTO_COVER; }
      else { photo.remove(); reveal.insertBefore(el('div', { class: 'mono-fallback', 'aria-hidden': 'true', text: 'R' }), reveal.firstChild); }
    });
    var reveal = el('div', { class: 'reveal reveal-anim' }, [
      photo,
      el('div', { class: 'scrim', 'aria-hidden': 'true' }),
      svg('<svg aria-hidden="true" viewBox="0 0 1000 1000" preserveAspectRatio="none" class="lines"><g fill="none" stroke="#fff" stroke-width="3" class="draw"><polygon points="300,420 700,420 980,1000 20,1000"/><line x1="340" y1="420" x2="140" y2="1000"/><line x1="660" y1="420" x2="860" y2="1000"/><line x1="250" y1="640" x2="750" y2="640"/><line x1="500" y1="640" x2="500" y2="1000"/></g></svg>')
    ]);
    var bar = el('div', { class: 'bar' }, [el('span', { class: 'loadbar' })]);
    var dialog = el('div', { role: 'dialog', 'aria-label': 'Welcome to Racheal\'s birthday', class: 'intro' }, [
      el('div', { class: 'stripes', 'aria-hidden': 'true' }),
      reveal,
      el('span', { class: 'ballin ball-drop', 'aria-hidden': 'true' }, [svg(ball(64))]),
      el('div', { class: 'text' }, [
        el('div', { class: 'i1' }, [
          el('p', { class: 'eyebrow', text: 'CENTRE COURT · 7 DECEMBER' }),
          el('p', { class: 'maintitle', html: 'The year it<br><em>opens up</em>' })
        ]),
        el('div', { class: 'bottom' }, [
          el('p', { class: 'name i2', text: 'Racheal' }),
          el('p', { class: 'sub i3', text: 'THE BIRTHDAY MATCH IS ABOUT TO BEGIN' }),
          el('div', { class: 'bar-row i3' }, [
            bar,
            el('button', { class: 'enter', text: 'ENTER THE COURT', onclick: function () { enterCourt(true); } })
          ])
        ])
      ])
    ]);
    introLayer.appendChild(dialog);
    clearTimeout(showIntro._t);
    showIntro._t = setTimeout(function () { enterCourt(false); }, 12000);
  }
  function enterCourt(fromTap) {
    clearTimeout(showIntro._t);
    clear(introLayer);
    // tapping ENTER on 7 Dec starts the song (needs a user gesture)
    if (fromTap && bday()) playSong();
  }

  /* ======================================================================
   * SHARED UI chrome: footer actions, preview toggle, focus trap
   * ====================================================================*/
  function wireChrome() {
    document.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-act');
        if (a === 'goHome') { state.view = 'home'; render(); scrollTop(); }
        if (a === 'asRacheal') { state.mode = 'racheal'; state.view = 'home'; render(); scrollTop(); }
        if (a === 'asFriend') { state.mode = 'friend'; state.view = 'home'; render(); scrollTop(); }
        if (a === 'replayIntro') { state.introDone = false; state.view = 'home'; render(); showIntro(); }
        if (a === 'toggleBirthday') {
          if (!state.forceBday) { state.forceBday = true; state.view = 'home'; render(); playSong(); scrollTop(); }
          else { state.forceBday = false; render(); }
        }
      });
    });
  }

  var focusTrapHandler = null, lastFocused = null;
  function trapFocus(container) {
    lastFocused = document.activeElement;
    var sel = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    function handler(e) {
      if (e.key === 'Escape') { if (G && gameLayer.contains(container)) closeGame(); else closeOverlays(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.slice.call(container.querySelectorAll(sel)).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', handler);
    focusTrapHandler = handler;
    var focusable = container.querySelector(sel); if (focusable) focusable.focus();
  }
  function releaseFocus() {
    if (focusTrapHandler) { document.removeEventListener('keydown', focusTrapHandler); focusTrapHandler = null; }
    if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) {} }
  }

  /* ---- confetti --------------------------------------------------------- */
  function confettiBlock() {
    var layer = el('div', { class: 'confetti-layer', 'aria-hidden': 'true' });
    var colors = ['#F5D547', '#fff', '#1F5C36', '#DFF04A'];
    for (var i = 0; i < 40; i++) {
      layer.appendChild(el('span', { class: 'conf', style: 'left:' + ((i * 37) % 100) + '%;background:' + colors[i % 4] + ';animation-duration:' + (4 + (i % 5)) + 's;animation-delay:-' + ((i * 0.43) % 6).toFixed(2) + 's;width:' + (6 + (i % 3) * 2) + 'px' }));
    }
    return layer;
  }

  /* ---- utils ------------------------------------------------------------ */
  function swap(node) { clear(mainEl); mainEl.appendChild(node); }
  function scrollTop() { try { window.scrollTo(0, 0); } catch (e) {} }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  /* ---- init ------------------------------------------------------------- */
  function init() {
    mainEl = $('main'); introLayer = $('intro-layer'); popLayer = $('pop-layer');
    gameLayer = $('game-layer'); toastLayer = $('toast-layer'); songLayer = $('song-layer');
    confettiLayer = $('confetti-layer'); header = $('site-header'); footer = $('site-footer');
    previewAs = $('preview-as');
    wireChrome();
    render();
    refreshCount();
    setInterval(tickClocks, 1000);
    // poll count at most once a minute
    setInterval(refreshCount, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
