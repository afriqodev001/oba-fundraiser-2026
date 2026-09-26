/* Operator Console: the single screen you drive the show from. Broadcasts state to the
   projector (show.html), runs the cocktail-loop timer, and plays background music. */
(function () {
  const C = window.OBA_CONFIG;
  const bus = window.OBABus("console");
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  let S = { mode: "holding", slide: 1, from: 1, to: C.slideCount, videoId: null, cueId: null };
  let loopTimer = null;
  let loopSec = Number(localStorage.getItem("oba-loopsec")) || C.loopSeconds;
  // Which console is actually driving the projector. Only ONE should — otherwise a second, idle console
  // tab (still on the welcome screen) also answers the projector's heartbeat, and the projector flips
  // between the running slideshow and that idle tab's welcome screen. A console starts NOT driving; it
  // takes over when the operator uses it (opens the projector, or issues any cue/slide). When another
  // console announces it is driving, this one yields — so the most-recently-used tab always wins.
  const MYID = Math.random().toString(36).slice(2);
  let driving = false;

  // ---------- state broadcast + preview mirror ----------
  function broadcast() { bus.send("state", { state: S, cid: MYID }); }
  function setState(patch, { keepCue = false } = {}) {
    driving = true;                 // any state change means the operator is using THIS console
    if (!keepCue && !("cueId" in patch)) patch.cueId = null;
    Object.assign(S, patch);
    broadcast(); paint();
  }
  const HOLD = C.holdingSlide || 1;
  function paint() {
    // preview mirrors the projector: slide image (contain), a MUTED live video, the welcome
    // slide (holding), or the branded standby (OBA logo on black).
    const img = $("pvImg"), pv = $("pvVideo"), mh = $("muteHint");
    const showImg = (src, fit) => { pv.style.display = "none"; mh.style.display = "none";
      img.style.display = "block"; img.style.objectFit = fit || "contain"; img.src = src; };
    if (S.mode === "slide" || S.mode === "loop") { stopPv(); showImg(C.slidePath(S.slide)); }
    else if (S.mode === "video") { img.style.display = "none"; pv.style.display = "block";
      mh.style.display = "block"; playPv(S.videoId, S.videoStart); }
    else if (S.mode === "black") { stopPv(); img.style.background = "#000"; showImg("assets/oba-logo.png", "contain"); }
    else { stopPv(); img.style.background = ""; showImg(C.slidePath(HOLD)); }
    if (S.mode !== "black") img.style.background = "";
    // labels
    const label = { slide: "Speaker slide", loop: "Slideshow", video: "Video playing",
                    black: "Standby", holding: "Welcome screen" }[S.mode];
    $("modeLabel").textContent = label;
    $("slideNo").textContent = (S.mode === "slide" || S.mode === "loop") ? S.slide : "—";
    // active cue highlight + filmstrip highlight
    document.querySelectorAll(".cue").forEach((b) => b.classList.toggle("active", b.dataset.cue === S.cueId));
    highlightFilm();
    // hand-off panel (Briana's Google Slides) — shown over the preview when her cue is active
    const isHandoff = C.cues.some((c) => c.id === S.cueId && c.type === "gslides");
    $("handoff").style.display = isHandoff ? "flex" : "none";
    if (isHandoff) $("modeLabel").textContent = "Bri's Program → Google Slides";
    $("nextLabel").textContent = nextCueLabel();
  }
  function highlightFilm() {
    const cur = (S.mode === "slide" || S.mode === "loop") ? S.slide : 0;
    document.querySelectorAll("#film .thumb").forEach((t) => {
      const on = Number(t.dataset.n) === cur; t.classList.toggle("on", on);
      if (on) t.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }

  // ---------- cocktail loop ----------
  function clearLoop() { if (loopTimer) { clearInterval(loopTimer); loopTimer = null; } }
  function startLoop() {
    clearLoop();
    loopTimer = setInterval(() => {
      let n = S.slide + 1; if (n > S.to) n = S.from;
      setState({ mode: "loop", slide: n }, { keepCue: true });
    }, loopSec * 1000);
  }

  // ---------- cues ----------
  function goCue(cue) {
    if (!cue) return;
    clearLoop();
    if (cue.type === "loop") {
      setState({ mode: "loop", slide: cue.from, from: cue.from, to: cue.to, cueId: cue.id }, { keepCue: true });
      startLoop();
      if (cue.music) musicPlay(); else musicPause();
    } else if (cue.type === "slide") {
      setState({ mode: "slide", slide: cue.slide, cueId: cue.id }, { keepCue: true });
      musicPause();
    } else if (cue.type === "video") {
      setState({ mode: "video", videoId: cue.youtube, videoStart: cue.start || 0, cueId: cue.id }, { keepCue: true });
      musicPause();
    } else if (cue.type === "gslides") {
      // Hand the projector over to Briana's Google Slides (native animations). Our projector goes to
      // the branded standby; the console shows the hand-off steps + an Open button.
      musicPause();
      setState({ mode: "black", cueId: cue.id }, { keepCue: true });
    }
  }
  function nextCueLabel() {
    const i = C.cues.findIndex((c) => c.id === S.cueId);
    const nxt = C.cues[i + 1] || (S.cueId ? null : C.cues[0]);
    return nxt ? nxt.label : "— end —";
  }
  function nextCue() {
    const i = C.cues.findIndex((c) => c.id === S.cueId);
    goCue(C.cues[i + 1] || (S.cueId ? null : C.cues[0]));
  }

  function renderCues() {
    const box = $("cueList");
    box.innerHTML = "";
    C.cues.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "cue"; b.dataset.cue = c.id;
      b.innerHTML = `<span class="lab"><span class="num">${i + 1}</span>${c.label}</span>
                     <span class="hint">${c.hint || ""}</span>`;
      b.onclick = () => goCue(c);
      box.appendChild(b);
    });
  }

  // ---------- slide filmstrip (click any slide to jump; great for the presenter-paced block) ----------
  function renderFilm() {
    const box = $("film");
    box.innerHTML = "";
    for (let n = 1; n <= C.slideCount; n++) {
      const t = document.createElement("button");
      t.className = "thumb"; t.dataset.n = n; t.title = "Slide " + n;
      t.innerHTML = `<img loading="lazy" src="slides-thumb/thumb-${String(n).padStart(3, "0")}.jpg" alt="" /><span>${n}</span>`;
      t.onclick = () => setState({ mode: "slide", slide: n });
      box.appendChild(t);
    }
  }

  // ---------- manual slide nav ----------
  function stepSlide(d) {
    const total = C.slideCount;
    const n = clamp((S.slide || 1) + d, 1, total);
    if (S.mode === "loop") { setState({ slide: n }, { keepCue: true }); startLoop(); }
    else setState({ mode: "slide", slide: n });
  }

  // ---------- background music (hidden YouTube player) ----------
  const YT_ID = (s) => {
    if (!s) return "";
    s = String(s).trim();
    const m = s.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(s) ? s : "");
  };
  let mp = null, mpReady = false, mList = [], mIdx = 0, mPlaying = false;
  const _volRaw = localStorage.getItem("oba-vol");
  let vol = _volRaw == null ? 70 : Number(_volRaw); if (!Number.isFinite(vol)) vol = 70;

  function loadPlaylist() {
    let saved = null; try { saved = JSON.parse(localStorage.getItem("oba-music") || "null"); } catch (_) {}
    const urls = saved || (C.music || []);
    mList = urls.map((u) => ({ url: u, id: YT_ID(u) })).filter((t) => t.id);
    renderTracks();
  }
  function savePlaylist() { localStorage.setItem("oba-music", JSON.stringify(mList.map((t) => t.url))); }
  function renderTracks() {
    const box = $("tracks"); box.innerHTML = "";
    if (!mList.length) { box.innerHTML = `<div class="note">No music yet — paste a YouTube link below.</div>`; return; }
    mList.forEach((t, i) => {
      const row = document.createElement("div"); row.className = "track";
      row.innerHTML = `<span class="t ${i === mIdx && mPlaying ? "playing" : ""}">${i + 1}. ${t.url}</span>
                       <button class="x" title="remove">✕</button>`;
      row.querySelector(".t").onclick = () => { mIdx = i; musicPlay(true); };
      row.querySelector(".x").onclick = () => { mList.splice(i, 1); if (mIdx >= mList.length) mIdx = 0; savePlaylist(); renderTracks(); };
      box.appendChild(row);
    });
  }
  function musicPill() {
    const p = $("musicPill"); const on = mPlaying;
    p.textContent = on ? "playing" : "off"; p.className = "pill " + (on ? "live" : "off");
    $("musicToggle").textContent = on ? "⏸ Pause" : "▶ Play";
  }
  function musicPlay(force) {
    if (!mList.length) { musicPill(); return; }
    if (!mpReady) { mPlaying = true; musicPill(); return; } // will start on ready
    try {
      if (force || mp.getVideoData().video_id !== mList[mIdx].id) mp.loadVideoById(mList[mIdx].id);
      mp.setVolume(vol); mp.playVideo();
    } catch (_) {}
    mPlaying = true; musicPill(); renderTracks();
  }
  function musicPause() { try { if (mp) mp.pauseVideo(); } catch (_) {} mPlaying = false; musicPill(); renderTracks(); }
  function musicToggle() { mPlaying ? musicPause() : musicPlay(); }
  function musicNext() { if (!mList.length) return; mIdx = (mIdx + 1) % mList.length; musicPlay(true); }

  // ---------- preview mirror (a MUTED copy of the video, for the operator's confidence) ----------
  let pv = null, pvReady = false, pvPending = null, pvCurrent = null;
  function playPv(id, start) {
    if (!id) return;
    if (!pvReady) { pvPending = { id, start }; return; }
    try {
      if (id !== pvCurrent) { pv.loadVideoById({ videoId: id, startSeconds: start || 0 }); pvCurrent = id; }
      pv.mute(); pv.playVideo();
    } catch (_) {}
  }
  function stopPv() { try { if (pv) pv.stopVideo(); } catch (_) {} pvCurrent = null; }

  window.onYouTubeIframeAPIReady = function () {
    mp = new YT.Player("ytmusic", {
      height: "1", width: "1", videoId: "",
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
      events: {
        onReady: () => { mpReady = true; mp.setVolume(vol); if (mPlaying) musicPlay(true); },
        onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) musicNext(); },
      },
    });
    pv = new YT.Player("pvyt", {
      height: "100%", width: "100%", videoId: "",
      playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, fs: 0, mute: 1, disablekb: 1 },
      events: { onReady: () => { pvReady = true; try { pv.mute(); } catch (_) {} if (pvPending) { playPv(pvPending.id, pvPending.start); pvPending = null; } } },
    });
  };

  // ---------- projector window (heartbeat-tracked) ----------
  let lastHello = 0;
  bus.on("event", (m) => {
    // Only the console the operator is driving answers the projector's heartbeat — an idle duplicate tab
    // stays silent so it can't overwrite the running show with its welcome screen.
    if (m.name === "hello") { lastHello = Date.now(); if (driving) broadcast(); }
    if (m.name === "video-ended" && driving) setState({ mode: "black" });
  });
  // Another console just took control → yield fully (stop driving AND stop our loop timer), so only the
  // most-recently-used tab drives the projector.
  bus.on("state", (m) => { if (m.cid && m.cid !== MYID) { driving = false; clearLoop(); } });
  function updateProjector() {
    const live = Date.now() - lastHello < 12000;
    $("showState").textContent = live ? "projector: live" : "projector: not open";
    $("showState").className = "pill " + (live ? "live" : "off");
    $("projWarn").style.display = live ? "none" : "block";
  }
  setInterval(updateProjector, 2000); updateProjector();
  $("openShow").onclick = () => {
    driving = true;                 // the console that opens the projector is the one driving it
    window.open("show.html", "oba_show", "width=1280,height=720");
    setTimeout(broadcast, 800);
  };
  $("openBri").onclick = () => window.open(C.briSlides, "bri_slides", "width=1280,height=720");

  // ---------- wire up controls ----------
  renderCues();
  renderFilm();
  $("slideTotal").textContent = C.slideCount;
  $("jump").max = C.slideCount;
  $("loopSec").value = loopSec;
  $("vol").value = vol; $("volVal").textContent = vol;

  $("nextCue").onclick = nextCue;
  $("prev").onclick = () => stepSlide(-1);
  $("next").onclick = () => stepSlide(1);
  $("jumpGo").onclick = () => setState({ mode: "slide", slide: clamp(Number($("jump").value) || 1, 1, C.slideCount) });
  $("resumeLoop").onclick = () => goCue(C.cues.find((c) => c.type === "loop"));
  $("holdingBtn").onclick = () => { clearLoop(); setState({ mode: "holding" }); };
  $("blackBtn").onclick = () => { clearLoop(); musicPause(); setState({ mode: "black" }); };
  $("loopSec").onchange = () => { loopSec = clamp(Number($("loopSec").value) || C.loopSeconds, 2, 60);
    localStorage.setItem("oba-loopsec", loopSec); if (S.mode === "loop") startLoop(); };

  $("musicToggle").onclick = musicToggle;
  $("musicNext").onclick = musicNext;
  $("vol").oninput = () => { vol = Number($("vol").value); $("volVal").textContent = vol;
    localStorage.setItem("oba-vol", vol); try { if (mp) mp.setVolume(vol); } catch (_) {} };
  $("addBtn").onclick = () => { const u = $("addUrl").value.trim(); if (!YT_ID(u)) { $("addUrl").placeholder = "Not a valid YouTube link"; return; }
    mList.push({ url: u, id: YT_ID(u) }); $("addUrl").value = ""; savePlaylist(); renderTracks(); };
  $("addUrl").onkeydown = (e) => { if (e.key === "Enter") $("addBtn").click(); };

  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA/.test((e.target.tagName || ""))) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); stepSlide(1); }
    else if (e.key === "ArrowLeft") stepSlide(-1);
    else if (e.key === "n" || e.key === "N") nextCue();
    else if (e.key === "m" || e.key === "M") musicToggle();
    else if (e.key === "b" || e.key === "B") { clearLoop(); musicPause(); setState({ mode: "black" }); }
    else if (/^[1-5]$/.test(e.key)) goCue(C.cues[Number(e.key) - 1]);
  });

  loadPlaylist();
  paint();
  // No broadcast on load: a console pushes to the projector only once the operator drives it (opens the
  // projector or issues a cue), so opening a second/duplicate tab never clobbers the running show.
})();
