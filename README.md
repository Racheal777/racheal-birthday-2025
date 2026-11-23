# birthday.rachealkuranchie.com — 2026: "The Year It Opens Up"

Racheal's birthday site, version 2. Theme: a grass tennis **Centre Court**.
Light vanilla HTML/CSS/JS — no frameworks, no build step. Just host the folder.

Last year's **"Constellation of You"** is archived and still live at **`/2025/`**.

## Two phases (automatic, Africa/Accra = UTC+0)
- **Collecting** — until 6 Dec 2026 23:59. Friends see **only** the write-a-letter
  page → a thank-you note → a countdown. Nothing else.
- **Celebration** — from 7 Dec 2026 00:00, forever after (so letters can be reread):
  welcome animation, scoreboard, the court, games, trophy cabinet, confetti + song.

Racheal (admin) sees everything, any time, plus her letter inbox.

## Setup (Racheal)
1. **Backend** — open `docs/2026/Code.gs`, follow the comment at the top: paste it into a
   Google Sheet's Apps Script, set a Script Property `ADMIN_KEY` (any long random string),
   run `setup`, then Deploy → Web app (execute as *Me*, access *Anyone*). Copy the `/exec`
   URL into `js/config.js` → `WISHES_API`.
   *Until this is set, the site runs in **demo mode**: letters are kept only in the
   current browser so the flow can still be tried.*
2. **Song** — paste the YouTube video id of "Birthday" by Anne-Marie into
   `js/config.js` → `SONG_YOUTUBE_ID` (just the id, not the whole URL).
3. **Photos** — drop `racheal-tennis.jpg` and `racheal-cover.jpg` into `assets/`
   (see `assets/README.md`).
4. **Content** — edit `js/content.js` (trophies, medals, the 4 quotes, etc.). Layout code
   is never touched.

## Admin & previews (query params)
- `?key=YOUR_ADMIN_KEY` — unlocks Racheal's view + inbox, and the full letter list before
  7 Dec. Saved to `localStorage`, so she types it once, then the clean URL works.
- `?preview=dec7` — forces the Celebration view on this device only (for testing).
- `/letter/<id>` — a friend rereads the exact letter they sent.

> The admin key is **never** stored in this repo. It lives only in the Apps Script
> Script Properties and in Racheal's browser once she visits the `?key=` link.

## Project structure
```
index.html            the 2026 site
css/styles.css        all styles (ported from the approved prototype)
js/config.js          the values Racheal fills in (API, song, photos) — no secrets
js/content.js         trophies, medals, quotes, blessings, sample letters
js/api.js             talks to the Apps Script backend (demo fallback built in)
js/app.js             all behaviour: phases, serve, rally game, letters, inbox, song
assets/               Racheal's photos (+ guide)
2025/                 built archive of last year's site  (source: racheal-birthday-2025/)
docs/2026/            the brief, Code.gs, and the approved design prototype
_redirects, vercel.json   SPA routing so /letter/<id> works on static hosts
```

## Deploy
Publish the repo root as the web root (Netlify, Vercel, Cloudflare Pages, GitHub Pages…).
`_redirects` (Netlify) and `vercel.json` (Vercel) route `/letter/<id>` to the app; on
other hosts add an equivalent rewrite of `/letter/*` → `/index.html` (200). `/2025/`
is a real folder and needs no config.

## Rebuilding the 2025 archive (only if its source changes)
```
cd racheal-birthday-2025
npm install
npx vite build --base=/2025/ --outDir dist
rm -rf ../2025 && cp -R dist ../2025 && rm -rf dist
```

## Accessibility & performance
Real buttons/links/labels, focus-trapped modals (Esc + backdrop close), `aria-label`s on
icon-only controls, 44px+ touch targets, text contrast ≥ 4.5:1, and a full
`prefers-reduced-motion` path (no bouncing/flying/confetti). The YouTube player and the
welcome photo load lazily.
