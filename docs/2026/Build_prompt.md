# Build prompt: Racheal's birthday site, version 2 (2026), "The Year It Opens Up"

**Design reference:** `design-reference.dc.html` (delivered with this brief) is the working prototype Racheal approved. It uses a custom templating runtime, so don't copy it as-is: read its markup, CSS and the `renderVals()` logic as the visual and behavioural source of truth, and rebuild it in this repo's stack. Where this brief and the prototype disagree, follow this brief.

You are working in the repo for **birthday.rachealkuranchie.com**. Last year (2025) this repo shipped **"The Constellation of You"**, a full-screen space / mission-control birthday site. Your job is to build **version 2** for 2026 in the same repo: keep what worked about last year's structure, build, deploy and "app you enter, not a page you scroll" feel, and replace the theme, content and data layer with what is described below.

Read the whole brief before you start. Ask before deleting anything from last year: move the 2025 build into an archive folder or route (for example `/2025`) so it still works.

---

## 1. What made 2025 work (keep these, they are the design rules)

1. **One world, and everything is renamed to fit it.** 2025 was space. 2026 is a **grass tennis court (Centre Court)**. Racheal is the player, the opponent is **"The Year"**, achievements are **trophies and medals**, birthday letters are **letters/wishes**, the countdown lives on a **scoreboard**.
2. **A cinematic entrance** before the reveal.
3. **One signature gesture**: tap Racheal to **serve**.
4. **Her real, specific story is the content** (trophies, medals, quotes). Specific beats generic.
5. **A dated climax**: countdown to **7 December** (Africa/Accra, UTC+0), then a celebration (confetti + her song).
6. **Always alive and dual audience**: a view for friends and a view for Racheal.

## 2. Theme, palette, type

- Theme name and slogan: **"Racheal · the year it opens up"**. Never show her age anywhere.
- Palette (no other colours except in illustrations):
  - Court greens: `#173F27` (deep, header/scoreboard wall), `#0F2E1C` (scoreboard panel), `#0B2416` (scoreboard cells), `#2C5A3B` (borders), `#1F5C36` (primary buttons and letter ink), `#4C8A3C` / `#579846` (mown grass stripes), `#3E7A33`.
  - Cream: `#FBF7EE` (page), `#EFE9D8`, `#E6DFCC` (lines), trophy shelf `#F3ECDA` to `#EDE4CC`, shelf edge `#C9B98F`.
  - Accents: scoreboard yellow `#F5D547`, tennis ball `#DFF04A`, trophy gold `#E0B23A` / `#C9971F`, muted text `#5B6B5F`, `#34503D`, `#9FC4A8`, `#CFE3D4`.
  - Red appears in only two places: **the strawberries**, and the old magazine cover (now retired, see section 4).
- Fonts (Google Fonts): **Instrument Serif** (display, italics for emphasis), **Caveat** (handwriting on letters), **DM Sans** (UI), **Space Mono** (scoreboard, game HUD), **Bodoni Moda** (welcome screen title).
- Mobile first. Most friends open the link on a phone. No horizontal page scroll. Touch targets at least 44px.
- Keep it light: plain HTML/CSS/JS (or whatever stack 2025 used), CSS animations, inline SVG. **No game engines, no canvas libraries, no heavy images** beyond Racheal's photos. Respect `prefers-reduced-motion` (stop looping animations, keep the content).

## 3. Two phases (the most important behaviour)

| Phase | When (Africa/Accra) | Friends see | Racheal sees (admin) |
|---|---|---|---|
| **Collecting** | from launch until 6 Dec 23:59 | **Only** the "Wish Racheal a happy birthday" letter page, then a thank-you note and a countdown to 7 December. No welcome animation, no court, no games, nothing else. | Everything, plus her inbox. |
| **Celebration** | from 7 Dec 00:00 onwards (stays open all year so letters can be reread) | Welcome animation, then the full court site, games, trophy cabinet, confetti and the song on the day. | Everything, plus her inbox. |

- Racheal's admin view is unlocked with a secret query param, e.g. `?key=ADMIN_KEY`, saved to `localStorage` so she only types it once. The same key unlocks the full wishes list from the backend before 7 Dec.
- Add a hidden preview switch for testing (`?preview=dec7`) that forces Celebration on the client only.

## 4. Welcome animation (Celebration phase only, about 12 s, skippable)

Full-screen, fills the whole viewport on every device (no letterboxing, no coloured side bars).
1. Starts on striped grass (`#4C8A3C` / `#579846` horizontal stripes).
2. A tennis ball drops from the top and bounces three times in the centre.
3. On the last bounce it scales up to fill the screen and a circle wipe (`clip-path: circle()`) reveals **Racheal's photo** full-bleed (`object-fit: cover`). Use her **tennis-outfit photo** (`assets/racheal-tennis.jpg`, she will supply it). Until it exists, fall back to `assets/racheal-cover.jpg`.
4. White court lines draw themselves over the photo (SVG `stroke-dashoffset`).
5. Text fades in, very little of it so people can read it: small yellow mono line "CENTRE COURT · 7 DECEMBER", big Bodoni title "The year it / *opens up*", big gold italic "Racheal", small mono line "THE BIRTHDAY MATCH IS ABOUT TO BEGIN".
6. A 12 s progress bar plus an **"ENTER THE COURT"** button. Darken the top and bottom of the photo with green gradients so all text stays readable.

## 5. Home page (Celebration phase)

Order from top to bottom: header, scoreboard, court, trophy cabinet, footer.

### 5.1 Header
Cream bar: "Racheal · *the year it opens up*" (Instrument Serif). Nothing else for friends.

### 5.2 Scoreboard (on a deep green wall)
A dark green board with a thick border, like a real tennis scoreboard:
- Top row: "CENTRE COURT · 7 DECEMBER" and a flickering status: "WARMING UP" before the day, "CELEBRATING" on and after 7 Dec.
- Centre of the board (no "vs" score rows): small mono "NOW PLAYING ON CENTRE COURT", big Instrument Serif "Racheal's *Birthday Match*" (italic part in yellow), small mono "THE YEAR IT OPENS UP" in ball green.
- On 7 Dec this is replaced by a glowing "Happy Birthday, Racheal" and "THE YEAR IT OPENS UP".
- Four cells: **BIRTHDAY IN** (live `Xd HH:MM:SS`, or "TODAY"), **LETTERS** (tap: friends go to write, Racheal goes to her inbox), **TROPHIES** (tap: opens trophy 1), **QUOTES FOUND** (`n / 4`).
- Under the board: friends see a green **"Write Racheal a letter"** button. Racheal sees a bobbing **"N new wishes · Tap to read"** button (or "Reread every letter" when caught up). Hint text: "Tap Racheal to serve. Find the 4 hidden quotes on the court."

### 5.3 The court (the centrepiece)
A grass court seen **from behind Racheal's baseline**, looking across the net to the opponent's full baseline. Use the SVG in Appendix A as the base drawing: it is built from real court proportions (23.77 m x 10.97 m, singles 8.23 m, service line 6.40 m from the net) projected in perspective, viewBox `0 0 1200 700`. It includes the back wall, mowing stripes, worn baselines, doubles and singles lines, service boxes, centre marks, the net with mesh, tape, centre strap and posts.

Put the drawing in a container with `aspect-ratio: 1200/700`, `width: max(100%, 560px)`, centred with the overflow hidden, so on phones it crops the edges instead of shrinking. Place every tappable thing as an absolutely positioned `<button>` using these percentages of the container:

| Thing | Position (left, top) | Looks like | On tap |
|---|---|---|---|
| **Racheal** | 52%, 80% | Round photo of her face (crop from her photo), white border, tag "Racheal · tap to serve", gentle hop | **Serve**: a ball flies from her over the net to the far court (arc, shrinks with distance, about 1.1 s), then a card shows one of the SERVES lines |
| **The Year** (opponent) | 50%, 30% | Small player figure + tag "The Year" | Card with the next YEAR line |
| **4 hidden quote balls** | 35/68, 64/55, 41/43, 58/36 | Glowing tennis balls | Reveal quote n, mark the ball with a check, update "QUOTES FOUND". All 4 found: "You found them all. Game, set, match." |
| **Strawberries & cream** | 20%, 40% | Bowl of red strawberries and cream, gentle wobble | Card with the next sweet STRAW blessing |
| **Chair umpire** | 82%, 38% | Umpire on a tall chair | Card with the next UMP line |
| **The crowd** | 22%, 13% | Row of little spectators on the wall, bobbing | **Plays Racheal's song** (see 5.6) and shows a small "now playing" bar at the bottom with the next CROWD line |
| **Challenge** | 84%, 86% | Pill button "↺ CHALLENGE" in scoreboard style | Opens the **rally game** (5.5) |

Cards are small modals: cream card, ball-yellow ring, kicker line, big Instrument Serif title, optional body, Close (and "Next" for trophies and medals). Close on Escape and on backdrop tap. Trap focus while a modal is open.

### 5.4 Trophy cabinet
Section title "The trophy cabinet", subline "Trophies are the big wins. Medals are the small ones. Tap any."
- The cabinet is a deep green panel (`#173F27`, rounded 26 px, inner 6 px border `#1F4D2E`) with two labelled rows in Space Mono: **TROPHIES** then **MEDALS**, split by a thin `#2C5A3B` line.
- Every item is a **uniform card** (`<button>`), cream `#FBF7EE`, radius 18 px, a 6 px shelf edge (`box-shadow: inset 0 -6px 0 #C9B98F`), **fixed height** (trophies 196 px, medals 168 px), in a grid `repeat(auto-fill, minmax(150px, 1fr))` with 14 px gaps.
- Inside each card, top to bottom with `justify-content: space-between`: the icon in a fixed box (trophy cup on a soft gold glow circle, 96 px; medal 72 px), then the label in a **fixed 2-line box** (`height: 2.6em`, `-webkit-line-clamp: 2`, centred, 14 px bold), then a small mono kicker "TROPHY 3" / "MEDAL 2". Short and long labels therefore never move the icons or change card sizes. Lift 4 px on hover.
- Tap opens a card: "Trophy 2 of 6", title, text, and a "Next trophy" button.

### 5.5 Challenge: the rally game (light, no libraries)
A modal with a small horizontal court strip (striped grass, white border, dashed net in the middle, "THE YEAR" on the left, "YOU" on the right with a racket).
- The Year serves: the ball travels left to right (linear X) with a **bounce arc** (Y keyframes: high, bounce at about 62%, rising after) and a ground shadow.
- A **yellow hit zone** covers 70% to 92% of the strip. The player taps **SWING** (or the strip itself; Space and Enter on keyboard).
- Timing is measured with `Date.now()` against the serve start, not by reading positions: `phase = elapsed % duration / duration`. A hit is `0.72 < phase < 0.98`; a **sweet spot** is `0.82 < phase < 0.90`.
- On a hit: the racket swings (rotate about -55 deg), the ball flies back to The Year in 450 ms, then the next serve starts.
- **Tennis scoring**: points go 0, 15, 30, 40, then "Game, Racheal!". Win **3 games** (Round 1, Semi-final, Final) to become **Champion**: "Game, set, birthday! You are the champion."
- First serve takes 2300 ms. Each game won makes serves 14% faster. Points within a game don't change the speed.
- **3 balls (lives)**: too early ("Too early!") or too late ("Too late!") costs a ball. At 0: "The Year takes this match. Rematch?"
- Crowd reactions float over the strip: "Ooooh!" on a sweet spot, "Clap clap clap" on a hit, "The crowd goes wild!" on a game, "Aaah..." on a miss.
- HUD in Space Mono: GAMES, POINTS, BALLS (3 dots). Buttons: SWING / "Champion! Play again" / "Rematch", and Close.

### 5.6 Music
- Racheal wants **"Birthday" by Anne-Marie**. Use the **official YouTube embed** (YouTube IFrame Player API, loaded lazily on first need). The video ID goes in config as `SONG_YOUTUBE_ID` (Racheal will paste it). Do not download or rehost the audio.
- The song plays when: (a) someone taps **the crowd**, and (b) on 7 Dec when someone taps "ENTER THE COURT" or the "Happy Birthday" scoreboard. Browsers block autoplay with sound, so always start it from a tap.
- Show a small floating player chip (song name, pause/play) while playing. The player itself can be a hidden 1x1 iframe.

### 5.7 Celebration on 7 December
Confetti (CSS, about 40 pieces in yellow, white, ball-green and a little red) falls over the scoreboard and court. The scoreboard switches to "Happy Birthday, Racheal". The song plays on the first tap.

## 6. Letters (friends write, Racheal reads)

Same visual language as the rest: court-green ink on cream lined paper.

### 6.1 Write (the only page friends see while Collecting)
- Eyebrow "Racheal's birthday · 7 December". Title "Wish Racheal a *happy birthday*" (Collecting) or "Write her *a letter*" (Celebration). Sub: "Write her a birthday letter. She will open every one on 7 December, the day her year opens up."
- A lined-paper card (cream, 42 px green rules) that reads like a letter: "Dear Racheal," in Caveat, then a borderless textarea in Caveat, then **"Choose a stamp: what should open up for her this year?"** with 6 postage-stamp buttons (Career, Love, Money, Travel, Joy, Balance; icons: briefcase, heart, coins, plane, smile, scale; selected stamp is green and tilted), then "With love," and a borderless name input.
- Hidden honeypot input named `website`.
- Button **"Seal it with love"**. Validation: "Write your wish and sign your name first."

### 6.2 Sealing animation, then the thank-you
- Show the envelope open with the letter inside, then the flap closes and the seal appears (about 1.5 s) while the POST happens.
- Thank-you screen: "Letter #N is on its way", "Thank you, *{name}*", and a tilted lined card **"A note back from Racheal"** with one random BLESSINGS line in Caveat, signed "Racheal ♡".
- "Keep this link to reread your letter": `/letter/{id}` (or `?letter=id`). That route shows their own letter by fetching `action=letter`.
- While Collecting, also show a scoreboard-style countdown box: "THE BIRTHDAY COURT OPENS IN Xd HH:MM:SS / Come back on 7 December to see the full celebration." Hide "Back to the court" while Collecting.
- "Write another letter" resets the form.

### 6.3 Racheal's inbox (admin)
- **Envelope screen** (if there are unread letters): "N new wishes", heading "Someone wrote you *a letter*", a stacked pile of envelopes (deep green envelope, flap, white seal showing a tennis ball), "Tap to read ♡" in Caveat. Tapping opens the flap (rotateX) and the letter slides up, then the full letter shows.
- **Letter screen**: lined paper, stamp in the top-right corner with the tag, a postmark "OPENS UP · 7 DEC", "Dear Racheal," / message / "With love, {name}". Button "Next letter" (back to the envelope pile) or "Back to the court".
- **Archive** "My letters": a grid of slightly rotated closed envelopes "From {name}" with the tag stamp; tap opens the letter in a modal ("Fold it back").
- Read and unread state is per device in `localStorage` (a list of read ids). That's fine.

## 7. Content (Racheal will fill the placeholders; ship with these)

```js
const TROPHIES = [
  { title: 'The Pivot Blueprint', text: 'I launched my 90-day program for people breaking into tech from non-traditional backgrounds, and ran the first cohort.' },
  { title: 'AWS Community Builder', text: 'Joined the AWS Community Builders and kept showing up for the AWS Accra community.' },
  { title: 'Tech Icon of the Year', text: 'Honoured as Triumph Tech Icon of the Year.' },
  { title: 'Building Mémoire', text: 'Co-founding Mémoire as CTO, a cinematic home for travel stories.' },
  { title: 'Going platform', text: 'Started my move into platform engineering: Kubernetes, Terraform and AWS.' },
  { title: '[Your trophy]', text: '[A big win from 2026.]' }
]; // Racheal to confirm which of these happened in 2026
const MEDALS = [
  { title: 'Tennis, 3x a week', text: 'Kept my tennis going three times a week. Forehand loading.' },
  { title: '[Small win]', text: '[A small win, a first, or a funny one.]' },
  { title: '[Small win]', text: '[Another small win.]' },
  { title: '[Small win]', text: '[One more.]' }
];
const QUOTES = ['[Quote 1 for the year]', '[Quote 2]', '[Quote 3]', '[Quote 4]'];
const STRAW = [
  'May your day be as sweet as strawberries and cream.',
  'Here is to a year that is fresh, sweet and full of good surprises, for you and for me.',
  'May every good thing find you in season.',
  'Sweet things are coming. Save room for them.',
  'May your joy be as rich as the cream and your days as bright as the berries.'
];
const UMP = ['Quiet, please. Birthday in progress.', 'New balls, please! And new opportunities.', 'Challenge accepted: the year opens up.'];
const YEAR = ['The Year: "I brought my best game."', 'The Year: "Every door you knock on, I will open."', 'The Year: "Fine. You win. Happy birthday."'];
const CROWD = ['The crowd is singing for Racheal', 'Ra-che-al! Ra-che-al!', 'Standing ovation from the stands', 'Mexican wave, twice'];
const SERVES = [
  'Ace! May your year open up too.',
  'Clean winner. Whatever you are working on, it lands this year.',
  'In! That is a sign. Keep going.',
  'Service winner. Something good is coming your way.',
  'Let! Serve again. Second chances count too.'
];
const BLESSINGS = [
  'Thank you for this. This is the year it opens up for me, and I pray it opens up for you too.',
  'You lit up my year. May this be the year every door opens for you, just as it is opening for me.',
  'Your words mean more than you know. May this year open up for you in ways you never expected.',
  'As my year opens up, I am asking that yours does too. Wide open, full of light.'
];
const TAGS = ['Career', 'Love', 'Money', 'Travel', 'Joy', 'Balance'];
```

Keep all content in one `content.js` (or JSON) file so Racheal can edit it without touching layout code.

## 8. Backend: Google Sheet + Apps Script (no database)

Use the Apps Script in **`Code.gs`** (delivered alongside this brief) exactly as written. Racheal deploys it as a web app and gives you the `/exec` URL. Put it in config as `WISHES_API`.

Contract:
- `POST WISHES_API`, header `Content-Type: text/plain;charset=utf-8` (avoids the CORS preflight), body `JSON.stringify({ name, message, tag, website })` returns `{ ok, id, number }`.
- `GET WISHES_API?action=count` returns `{ ok, count }`. Use it for the LETTERS cell and the "RACHEAL" score.
- `GET WISHES_API?action=letter&id=ID` returns `{ ok, wish }`.
- `GET WISHES_API?action=list` returns `{ ok, wishes }` from 7 Dec onwards, otherwise `{ ok: false, error: 'locked' }`.
- `GET WISHES_API?action=list&key=ADMIN_KEY` returns `{ ok, wishes }` any time (Racheal).
- Each wish is `{ id, createdAt, name, tag, message }`. Racheal can hide a wish by typing "yes" in column F of the sheet.

Client rules:
- **Render every wish with `textContent`, never `innerHTML`.** Wishes are typed by the public.
- Show a friendly error and keep the typed text if the POST fails; allow retry.
- Cache `list` results in memory. Poll `count` at most once a minute.
- Never put `ADMIN_KEY` in the code or the repo.

```js
async function sendWish({ name, message, tag, website }) {
  const res = await fetch(WISHES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ name, message, tag, website })
  });
  return res.json(); // { ok, id, number } or { ok:false, error }
}
async function getWishes(adminKey) {
  const url = WISHES_API + '?action=list' + (adminKey ? '&key=' + encodeURIComponent(adminKey) : '');
  return (await fetch(url)).json();
}
```

## 9. Phase logic (client)

```js
const TZ_OFFSET_MIN = 0;                 // Africa/Accra is UTC+0 all year
const REVEAL = Date.UTC(2026, 11, 7);    // 7 Dec 2026 00:00 Accra
const isAdmin = !!localStorage.getItem('adminKey');
const preview = new URLSearchParams(location.search).get('preview') === 'dec7';
const celebrating = Date.now() >= REVEAL || preview;
const collecting = !celebrating && !isAdmin;   // friends: only the write page
```

## 10. Accessibility and quality bar
- Real `<button>`, `<a href>`, `<label>` everywhere. `aria-label` on icon-only buttons. Decorative SVG gets `aria-hidden="true"`.
- Text contrast at least 4.5:1, including the light labels on green.
- `prefers-reduced-motion`: no bouncing, flying, confetti or looping animations; the welcome jumps straight to its final frame.
- Works at 360 px wide: the scoreboard cells wrap and the court crops its edges instead of shrinking the tap targets below 44 px.
- Lighthouse: performance 90+ on mobile. Lazy-load the YouTube API and the photo used in the welcome.

## 11. Acceptance checklist
- [ ] Before 7 Dec, a friend opening the site sees **only** the write page, can send a wish, gets the note back and the countdown, and the wish appears as a new row in the Google Sheet.
- [ ] `/letter/{id}` shows that friend's own letter.
- [ ] Racheal with `?key=...` sees the full site, her envelope inbox, every wish, and read state that persists.
- [ ] On 7 Dec (or `?preview=dec7`) friends get the welcome animation, the court, the cabinet, the confetti and "Happy Birthday, Racheal", and the song plays on tap.
- [ ] Every court object in 5.3 is tappable and does its thing.
- [ ] The rally game scores 15/30/40/Game, has 3 lives, gets faster per game, and can be won and lost.
- [ ] The trophy cabinet stays aligned with long and short labels.
- [ ] No age shown anywhere. No Wimbledon name or logo (generic grass-court tennis only).
- [ ] The 2025 site still works at its archived route.

---

## Appendix A: court SVG (viewBox 0 0 1200 700)

```html
<svg viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;display:block">
<rect x="0" y="0" width="1200" height="196" fill="#1E4A2C"/>
<rect x="0" y="150" width="1200" height="46" fill="#163A22"/>
<g fill="#2A5C38" opacity=".55"><circle cx="80" cy="60" r="38"/><circle cx="150" cy="40" r="30"/><circle cx="1080" cy="70" r="40"/><circle cx="1140" cy="38" r="28"/><circle cx="300" cy="30" r="24"/><circle cx="900" cy="26" r="26"/></g>
<rect x="0" y="192" width="1200" height="510" fill="#4C8A3C"/>
<g fill="#579846"><polygon points="-482.3,650 1682.3,650 1509.1,552.4 -309.1,552.4"/><polygon points="-183.7,481.7 1383.7,481.7 1288.7,428.2 -88.7,428.2"/><polygon points="-14.3,386.2 1214.3,386.2 1154.3,352.4 45.7,352.4"/><polygon points="94.9,324.7 1105.1,324.7 1063.8,301.4 136.2,301.4"/><polygon points="171.2,281.7 1028.8,281.7 998.7,264.7 201.3,264.7"/><polygon points="227.4,250 972.6,250 949.7,237.1 250.3,237.1"/><polygon points="270.6,225.7 929.4,225.7 911.3,215.5 288.7,215.5"/><polygon points="304.8,206.4 895.2,206.4 880.6,198.1 319.4,198.1"/></g>
<g fill="#B9A56E" opacity=".75"><ellipse cx="600" cy="612" rx="190" ry="34"/><ellipse cx="600" cy="232" rx="70" ry="8"/></g>
<g fill="#C8B57E" opacity=".55"><ellipse cx="600" cy="606" rx="110" ry="20"/></g>
<g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linejoin="round">
<polygon points="60.3,650 1139.7,650 765.3,226.9 434.7,226.9"/>
<line x1="195.1" y1="650" x2="476" y2="226.9"/><line x1="1004.9" y1="650" x2="724" y2="226.9"/>
<line x1="334.1" y1="440.7" x2="865.9" y2="440.7"/><line x1="452.3" y1="262.5" x2="747.7" y2="262.5"/>
<line x1="600" y1="440.7" x2="600" y2="262.5"/>
<line x1="600" y1="650" x2="600" y2="634"/><line x1="600" y1="226.9" x2="600" y2="231"/>
</g>
<polygon points="304.6,326.1 895.4,326.1 895.4,276.7 600,283.9 304.6,276.7" fill="rgba(20,20,20,.22)"/>
<g stroke="rgba(25,25,25,.55)" stroke-width="1">
<line x1="330" y1="278" x2="330" y2="326"/><line x1="360" y1="279" x2="360" y2="326"/><line x1="390" y1="280" x2="390" y2="326"/><line x1="420" y1="280" x2="420" y2="326"/><line x1="450" y1="281" x2="450" y2="326"/><line x1="480" y1="282" x2="480" y2="326"/><line x1="510" y1="282" x2="510" y2="326"/><line x1="540" y1="283" x2="540" y2="326"/><line x1="570" y1="283" x2="570" y2="326"/><line x1="630" y1="283" x2="630" y2="326"/><line x1="660" y1="283" x2="660" y2="326"/><line x1="690" y1="282" x2="690" y2="326"/><line x1="720" y1="282" x2="720" y2="326"/><line x1="750" y1="281" x2="750" y2="326"/><line x1="780" y1="280" x2="780" y2="326"/><line x1="810" y1="280" x2="810" y2="326"/><line x1="840" y1="279" x2="840" y2="326"/><line x1="870" y1="278" x2="870" y2="326"/>
<line x1="304.6" y1="292" x2="895.4" y2="292"/><line x1="304.6" y1="303" x2="895.4" y2="303"/><line x1="304.6" y1="314" x2="895.4" y2="314"/>
</g>
<polyline points="304.6,276.7 600,283.9 895.4,276.7" fill="none" stroke="#fff" stroke-width="5"/>
<line x1="600" y1="284" x2="600" y2="326" stroke="#fff" stroke-width="3"/>
<g fill="#2B2B2B"><rect x="300" y="272" width="8" height="56" rx="2"/><rect x="892" y="272" width="8" height="56" rx="2"/></g>
</svg>
```