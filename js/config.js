/* ============================================================================
 * Racheal's birthday site 2026 — "The Year It Opens Up"
 * CONFIG — the only values Racheal needs to paste in. Nothing secret lives here.
 * ==========================================================================*/

window.CONFIG = {
  /* -- Backend (Google Sheet + Apps Script web app, see docs/2026/Code.gs) --
   * Deploy Code.gs as a Web app and paste its /exec URL here.
   * Until it is set, the site runs in "demo" mode: letters are kept only in
   * this browser so the write/seal/thank-you flow can still be demoed.        */
  WISHES_API: 'https://script.google.com/macros/s/AKfycby2zrnpOBZXpDnu-2oS3OYgm8Vql2pI_n8C6NyeoIdKRPlt94I10z2dGJzTJk7JzuDJrg/exec',

  /* -- Song: "Birthday" by Anne-Marie (official YouTube video id only) --
   * Paste just the id, e.g. for youtu.be/XXXXXXXXXXX use 'XXXXXXXXXXX'.
   * The audio is streamed from YouTube's official embed; never rehosted.      */
  SONG_YOUTUBE_ID: 'egVAW6l_QU8', // the crowd plays this
  SONG_TITLE: 'Birthday — Anne-Marie',

  /* -- The reveal moment: 7 December 2026, 00:00 Africa/Accra (UTC+0) -------- */
  REVEAL_UTC: Date.UTC(2026, 11, 7), // month is 0-indexed: 11 = December

  /* -- Photos (Racheal supplies these; see assets/README.md) -----------------
   * Welcome prefers the tennis-outfit photo and falls back to the cover.      */
  PHOTO_TENNIS: 'assets/racheal-tennis.jpg',
  PHOTO_COVER: 'assets/racheal-cover.jpg',

  /* The archived 2025 site lives here. */
  SITE_2025: '/2025/'
};
