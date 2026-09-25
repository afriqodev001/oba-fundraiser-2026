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

  // ---------- state broadcast + preview mirror ----------
  function broadcast() { bus.send("state", { state: S }); }
  function setState(patch, { keepCue = false } = {}) {
    if (!keepCue && !("cueId" in patch)) patch.cueId = null;
    Object.assign(S, patch);
    broadcast(); paint();
  }
  function paint() {
    // preview (a true mirror of the projector: slide image, or a MUTED live video)
    const img = $("pvImg"), tag = $("pvTag"), pv = $("pvVideo"), mh = $("muteHint");
    const hideAll = () => { img.style.display = "none"; tag.style.display = "none";
      pv.style.display = "none"; mh.style.display = "none"; };
    const showTag = (txt, sub, amber) => { hideAll(); tag.style.display = "flex";
      tag.className = "tag" + (amber ? " amber" : ""); $("pvTagB").textContent = txt; $("pvTagS").textContent = sub || ""; };
    if (S.mode === "slide" || S.mode === "loop") {
      hideAll(); stopPv(); img.style.display = "block"; img.src = C.slidePath(S.slide);
    } else if (S.mode === "video") {
      hideAll(); pv.style.display = "block"; mh.style.display = "block"; playPv(S.videoId, S.videoStart);
    } else if (S.mode === "black") {
      stopPv(); showTag("⬛ BLACK", "", false);
    } else {
      stopPv(); showTag("Holding screen", C.holding.title, true);
    }
    // labels
    const label = { slide: "Speaker slide", loop: "Cocktail-hour loop", video: "Video playing",
                    black: "Black", holding: "Holding screen" }[S.mode];
    $("modeLabel").textContent = label;
    $("slideNo").textContent = (S.mode === "slide" || S.mode === "loop") ? S.slide : "—";
    // active cue highlight
    document.querySelectorAll(".cue").forEach((b) => b.classList.toggle("active", b.dataset.cue === S.cueId));
    $("nextLabel").textContent = nextCueLabel();
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
    if (m.name === "hello") { lastHello = Date.now(); broadcast(); }
    if (m.name === "video-ended") setState({ mode: "black" });
  });
  function updateProjector() {
    const live = Date.now() - lastHello < 12000;
    $("showState").textContent = live ? "projector: live" : "projector: not open";
    $("showState").className = "pill " + (live ? "live" : "off");
    $("projWarn").style.display = live ? "none" : "block";
  }
  setInterval(updateProjector, 2000); updateProjector();
  $("openShow").onclick = () => {
    window.open("show.html", "oba_show", "width=1280,height=720");
    setTimeout(broadcast, 800);
  };

  // ---------- wire up controls ----------
  renderCues();
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
  broadcast();
})();
