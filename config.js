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

  // Briana runs her own segment ("Program / Staff Acknowledgement") from HER Google Slides deck so her
  // click animations play — those only work in Google Slides' native present mode, which can't be embedded.
  // The "Bri's Program" cue hands the projector over to this (see README §Hand-off).
  briSlides: "https://docs.google.com/presentation/d/1M_5-Leo2Tup89pVPTZYBdceYh9EA7whEq4lFyAGYQ1M/present",

  // The run of show — aligned to the event schedule. The operator steps through with NEXT, or jumps to any.
  // Types:  loop – auto-advancing slides + music · slide – hold one slide · video – full-screen YouTube ·
  //         gslides – hand off the projector to Briana's Google Slides (native animations)
  cues: [
    { id: "cocktail", label: "Social Hour — Slideshow",
      hint: "4:00 PM · doors open · slides + music",
      type: "loop", from: 1, to: 102, music: true },

    { id: "welcome", label: "Welcome — Jason Bergmann",
      hint: "5:30 PM · Executive Director", type: "slide", slide: 81 },

    { id: "video-mesha", label: "Video — A Partner in Change",
      hint: "5:40 PM · intro'd by Mesha · plays full-screen, then standby",
      type: "video", youtube: "Hp47LBUG3D8", start: 10 },

    { id: "bri", label: "Bri's Program — Staff Acknowledgement",
      hint: "5:45 PM · her animated Google Slides → follow the hand-off steps",
      type: "gslides" },

    { id: "video-closing", label: "Video — A Day in the Life of a Maasai Girl",
      hint: "~6:15 PM · Rod intros, before Fund-a-Need · then standby",
      type: "video", youtube: "vbayG0spHDI" },
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
