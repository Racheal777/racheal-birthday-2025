# Deploying — this repo is the live one (GitHub → Vercel → your domain)

This repo (`github.com/Racheal777/racheal-birthday-2025`) is deployed on **Vercel**, and
**birthday.rachealkuranchie.com** is attached to that same Vercel project. The 2026 site
now lives at the repo **root**; last year's app is kept at `archive-2025-source/` (source)
and served as a static archive at **`/2025/`**.

## One-time: switch Vercel from "build the Vite app" to "serve the static site"
The project was set up to build the old React/Vite app. The 2026 site has **no build step**,
so in the Vercel dashboard → the project → **Settings → Build & Development Settings**:

- **Framework Preset:** `Other`
- **Build Command:** Override **off** (empty)
- **Output Directory:** Override **off** (empty) — it serves the repo root
- **Install Command:** Override **off** (empty)

Save.

## Every deploy
```bash
git add -A
git commit -m "your message"
git push
```
Vercel redeploys automatically. After the first push with the settings above:

- **https://birthday.rachealkuranchie.com/** → the 2026 site (the link you share).
  Before 7 December it shows **only** the write-a-letter page; friends never see the
  rest of the site.
- **https://birthday.rachealkuranchie.com/2025/** → last year's Constellation site.
- **?preview=dec7** → your private preview of the full 7 December celebration.
- **?key=YOUR_ADMIN_KEY** → your admin view + letter inbox (saved on that device).

## What goes where
- `js/config.js` — the backend URL and song id (already set).
- `js/content.js` — trophies / medals / quotes (your 2026 wins).
- `assets/` — your photos (`racheal-tennis.jpg`, `racheal-cover.jpg`).
- `archive-2025-source/` — last year's React source, kept for reference. To rebuild its
  static archive: `cd archive-2025-source && npm install && npx vite build --base=/2025/
  --outDir dist && rm -rf ../2025 && cp -R dist ../2025 && rm -rf dist`.
