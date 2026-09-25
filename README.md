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

### The run of show (aligned to the event schedule)
| # | Cue | Time | What happens |
|---|-----|------|--------------|
| 1 | **Social Hour — Slideshow** | 4:00 PM | All slides auto-advance on repeat, with background music. |
| 2 | **Welcome — Jason Bergmann** | 5:30 PM | Holds on Jason's slide. Music off. |
| 3 | **Video — A Partner in Change** | 5:40 PM | Plays full-screen (from 0:10), then standby. |
| 4 | **Bri's Program — Staff Acknowledgement** | 5:45 PM | **Hands off to Briana's Google Slides** (see below). |
| 5 | **Video — A Day in the Life of a Maasai Girl** | ~6:15 PM | Plays full-screen, then standby. |

Between moments (raffle, Fund-a-Need, dinner) use **⏸ Standby** (OBA logo on dark) or **Welcome screen**. The
**All Slides** filmstrip lets you jump to any slide of the main deck at any time.

### Hand-off: Briana's animated slides (cue 4)
Briana runs her segment from **her own Google Slides deck** because her click-by-click animations only play in
Google Slides' native present mode — those can't be embedded in this site. So cue 4 doesn't show a slide; it
puts our projector on standby and shows a **hand-off panel** in the console:
1. Click **Open Bri's Slides** — her deck opens in present mode (with animations).
2. Move that window onto the projector and press **F11** (browser full-screen) to hide the address bar.
3. Briana clicks through with her remote. (Our projector output is on the branded standby meanwhile.)
4. When she's done, come back and press **NEXT ▶** for the closing video.

Set the deck in `config.js` → `briSlides` (its `…/present` URL). **Rehearse the window switch**, and make sure
the deck is signed in / accessible on the control laptop (or Briana presents from her own laptop via an HDMI
switch — same idea, our controller just sits on standby during her part).

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
