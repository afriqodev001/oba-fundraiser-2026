/* Projector (Show) window: renders whatever the Operator Console broadcasts —
   a slide image, a full-screen YouTube video, a branded holding screen, or black. */
(function () {
  const C = window.OBA_CONFIG;
  const bus = window.OBABus("show");
  const el = {
    slide: document.getElementById("slide"),
    videowrap: document.getElementById("videowrap"),
    standby: document.getElementById("standby"),
    unlock: document.getElementById("unlock"),
  };
  const HOLD = C.holdingSlide || 1;

  let unlocked = false;
  let player = null, playerReady = false, pendingVideo = null, currentVideo = null;
  let state = bus.lastState() || { mode: "holding" };
  // Which console is driving us. The projector locks onto the console that sends REAL content (a slide,
  // video or standby) and then ignores "welcome/holding" states coming from any OTHER console — so a
  // second, idle Operator Console tab can't knock the projector back to the welcome screen mid-show. A
  // real state from a new console always takes over (the operator deliberately switched consoles).
  let driverCid = null;
  const REAL_MODES = { slide: 1, loop: 1, video: 1, black: 1 };

  // ---- YouTube player (created once the API is ready) ----------------------
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("ytshow", {
      width: "100%", height: "100%", videoId: "",
      playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, fs: 0, iv_load_policy: 3 },
      events: {
        onReady: () => { playerReady = true; if (pendingVideo) { playVideo(pendingVideo.id, pendingVideo.start); pendingVideo = null; } },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            bus.send("event", { name: "video-ended", videoId: currentVideo });
            show("standby"); // hold on branded standby until the operator advances
          }
        },
      },
    });
  };
  function playVideo(id, start) {
    currentVideo = id;
    if (!playerReady) { pendingVideo = { id, start }; return; }
    try { player.loadVideoById({ videoId: id, startSeconds: start || 0 }); player.playVideo(); } catch (_) {}
  }
  function stopVideo() { try { if (player) player.stopVideo(); } catch (_) {} }

  // ---- render --------------------------------------------------------------
  function show(which) {
    el.slide.style.display = which === "slide" ? "block" : "none";
    el.videowrap.style.display = which === "video" ? "block" : "none";
    el.standby.style.display = which === "standby" ? "flex" : "none";
  }
  function render(s) {
    state = s || state;
    const m = state.mode;
    if (m === "slide" || m === "loop") {
      stopVideo();
      el.slide.src = C.slidePath(state.slide || 1);
      show("slide");
    } else if (m === "video") {
      show("video");
      if (state.videoId && state.videoId !== currentVideo) {
        if (unlocked) playVideo(state.videoId, state.videoStart);
        else pendingVideo = { id: state.videoId, start: state.videoStart };
      }
    } else if (m === "black") {
      stopVideo(); show("standby");
    } else {
      stopVideo(); el.slide.src = C.slidePath(HOLD); show("slide"); // holding = the welcome slide
    }
  }

  bus.on("state", (msg) => {
    const s = msg && msg.state; if (!s) return;
    const cid = msg.cid || "";
    if (REAL_MODES[s.mode]) { driverCid = cid; render(s); }                 // real content → this console is the driver
    else if (!driverCid || cid === driverCid) { driverCid = driverCid || cid; render(s); }  // holding: honor only from the driver
    // else: a non-driver console's welcome/holding state — ignore it, keep showing the driver's content.
  });
  // Ask the console to (re)send the current state, so opening/reloading catches up,
  // and heartbeat so the console can show "projector: live".
  bus.send("event", { name: "hello" });
  setInterval(() => bus.send("event", { name: "hello" }), 4000);
  render(state);

  // ---- unlock (one gesture enables sound + full-screen) --------------------
  function goFullscreen() {
    const d = document.documentElement;
    (d.requestFullscreen || d.webkitRequestFullscreen || function () {}).call(d);
  }
  el.unlock.addEventListener("click", () => {
    unlocked = true;
    el.unlock.style.display = "none";
    goFullscreen();
    if (state.mode === "video" && state.videoId) playVideo(state.videoId, state.videoStart);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "f" || e.key === "F") {
      if (document.fullscreenElement) document.exitFullscreen(); else goFullscreen();
    }
  });
})();
