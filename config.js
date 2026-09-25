/* ============================================================================
   Opportunity Builds Africa — Fundraising Event 2026 · Show Control
   ----------------------------------------------------------------------------
   EDIT THIS FILE to change the run of show, the background music, or timing.
   Nothing else needs editing. (You can also add music links live in the
   console — this file just provides the starting playlist.)
   ============================================================================ */
window.OBA_CONFIG = {
  eventName: "Opportunity Builds Africa — Fundraising Event 2026",

  // Slides live in /slides as slide-001.jpg ... slide-102.jpg (exported from the deck).
  slideCount: 102,
  slidePath: (n) => `slides/slide-${String(n).padStart(3, "0")}.jpg`,

  // Seconds each slide holds during the auto-advancing slideshow loop.
  loopSeconds: 8,

  // The holding / standby-before-doors screen is just a slide (the welcome slide).
  holdingSlide: 1,

  // The run of show. The operator steps through these in order (big NEXT button),
  // or jumps straight to any one. Types:
  //   loop  – auto-advance a slide range on repeat, with background music
  //   slide – hold on one slide (a speaker backdrop / a slide to talk over), music off
  //   video – play a YouTube video full-screen on the projector, music off
  cues: [
    { id: "cocktail", label: "Cocktail Hour — Slideshow",
      hint: "Auto-advancing slides with music. Start when doors open.",
      type: "loop", from: 1, to: 102, music: true },

    { id: "welcome", label: "Welcome — Jason Bergmann",
      hint: "Executive Director", type: "slide", slide: 81 },

    { id: "video-jason", label: "Play Video — after Jason",
      hint: "Plays full-screen, then standby.", type: "video", youtube: "Hp47LBUG3D8", start: 10 },

    { id: "briana", label: "Speech — Briana Pokorny",
      hint: "Impact & Donor Relations Manager", type: "slide", slide: 83 },

    { id: "video-closing", label: "Play Closing Video",
      hint: "Plays full-screen, then standby.", type: "video", youtube: "vbayG0spHDI" },

    { id: "staff", label: "Staff & Acknowledgements",
      hint: "Presenter-paced — step with Next ▶ or click a slide below.", type: "slide", slide: 84 },
  ],

  // Background music for the cocktail-hour loop — YouTube links, played AUDIO-ONLY
  // (the video is hidden). They play in ORDER and then repeat; the first one starts
  // first. All of these are royalty-free / no-copyright and verified to be embeddable.
  // Swap or reorder freely here, or manage them live in the console (it remembers yours).
  music: [
    "https://www.youtube.com/watch?v=36-d8r2vn0s", // Digya (African) — Kevin MacLeod, warm marimba
    "https://www.youtube.com/watch?v=rOhAckfWIeo", // "Wonders of Africa" — Cazanir, uplifting
    "https://www.youtube.com/watch?v=0q9cICRdpzw", // African Djembe Instrumental — copyright-free
    "https://www.youtube.com/watch?v=epokZOWZ20Q", // 2-hour Smooth Jazz Mix — royalty-free (long tail: no dead air)
  ],

  // The holding screen shown before you start and between cues.
  holding: { title: "Opportunity Builds Africa", subtitle: "Fundraising Event 2026" },
};
