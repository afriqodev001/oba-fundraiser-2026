# Opportunity Builds Africa — Fundraising Event 2026 · Show Control

A tiny, dependency-free web app to run the event slideshow + videos from a laptop onto a projector.
Built for **Hyractech** to run OBA's evening. No server, no build step — it's just static files on Netlify.

## Run the show (operator)

1. Open the site (e.g. **https://oba.hyractech.com**) on the control laptop.
2. Plug in the projector and set the display to **Extend** (not Mirror).
3. Click **🖥️ Open Projector Window**, drag that new window onto the projector, and **click it once**
   — it goes full-screen and enables sound. (Press `F` to toggle full-screen.)
4. Drive everything from the **Operator Console** on the laptop:
   - **Run of Show** buttons (left) are the cues, in order. Press **NEXT ▶** to step through them, or click any
     cue directly.
   - The **center preview** always shows exactly what's on the projector.
   - **Background music** (right): paste YouTube links, press **▶ Play**. It plays audio-only during the
     cocktail loop and auto-pauses for speaker slides and videos.

### The run of show
| # | Cue | What happens |
|---|-----|--------------|
| 1 | **Cocktail Hour — Slideshow** | All slides auto-advance on repeat, with background music. |
| 2 | **Welcome — Jason Bergmann** | Holds on Jason's slide. Music off. |
| 3 | **Play Video — after Jason** | Plays the video full-screen (from 0:10), then a branded standby screen. |
| 4 | **Speech — Briana Pokorny** | Holds on Briana's slide. Music off. |
| 5 | **Play Closing Video** | Plays the closing film full-screen, then standby. |
| 6 | **Staff & Acknowledgements** | Jumps to the staff/title block for the presenter to talk over. |

**Presenter-paced slides (staff, titles — slides 84–99 & 101):** these are in the auto-slideshow *and* meant
to be clicked through live. Use cue 6 to jump there, then **Next ▶ / →** to advance as the presenter talks —
or click any slide in the **All Slides** filmstrip to jump straight to it. The **Welcome screen** button shows
the welcome slide; **⏸ Standby** shows the OBA logo on a dark screen between moments.

### Keyboard
`→`/`Space` next slide · `←` prev · `N` next cue · `M` music play/pause · `B` black · `1`–`5` jump to cue.

## Editing content
Everything you'd change lives in **`config.js`**:
- `cues` — the run of show (slide numbers, video IDs).
- `music` — the starting playlist (you can also add links live in the console; those are remembered per-computer).
- `loopSeconds` — how long each slide holds in the cocktail loop.

Slides are pre-rendered images in **`/slides`** (`slide-001.jpg` … `slide-102.jpg`), exported from the Google
deck. To refresh them after the deck changes, re-export the deck to PDF and re-render (see `tools/`), or replace
the images.

## Deploy (Netlify)
This repo is a plain static site. On Netlify: **Add new site → Import from Git →** pick this repo →
build command empty, publish directory `.`. Then point the subdomain (e.g. `oba.hyractech.com`) at it via a
CNAME to the Netlify site.

> **⚠ Make the site PUBLIC.** If the Netlify site is team/password protected, the projector window (a popup)
> hits Netlify's login wall instead of the show, so videos won't play. Set it public under
> **Site configuration → Access & security → Visibility / Password protection.**

## Notes
- Slides are fully local, so they work even if the venue Wi-Fi is flaky. **Music and the two speaker videos
  stream from YouTube**, so keep the laptop online for those.
- Audio (music + video sound) comes out of the **laptop's** audio device → connect that to the room's PA.
  The projector only needs the video.
