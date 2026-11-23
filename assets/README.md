# Photos for the 2026 site

Drop two JPGs in this folder. Until they are here, the site falls back gracefully
(the welcome shows a green panel with an "R", the court shows an "R" monogram).

| File | Used for | Notes |
|---|---|---|
| `racheal-tennis.jpg` | The welcome animation (full-bleed behind the title) | Tennis-outfit photo. Portrait or landscape both work — it's `object-fit: cover`, centred near the top. **Preferred.** |
| `racheal-cover.jpg` | Welcome fallback **and** the round face on the court | Any flattering photo where her face is in the upper-middle. |

### Tuning the crops (optional)
- Welcome photo position: `css/styles.css` → `.intro .photo { object-position: 52% 36% }`.
- Court face position: `css/styles.css` → `.face img { object-position: 50% 28% }`.

Keep each file reasonably small (ideally under ~400 KB) so the page loads fast on phones.
