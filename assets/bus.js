/* Tiny message bus so the Operator Console and the Projector (Show) window stay in sync.
   Same-origin BroadcastChannel for live messages; localStorage holds the last state so a
   reloaded Show window recovers instantly. No server, no build step. */
(function () {
  const CHANNEL = "oba-show";
  const LAST = "oba-last-state";

  window.OBABus = function (role /* 'console' | 'show' */) {
    let ch = null;
    try { ch = new BroadcastChannel(CHANNEL); } catch (_) { ch = null; }
    const handlers = {};

    function emit(m) { (handlers[m.kind] || []).forEach((fn) => { try { fn(m); } catch (_) {} }); }

    if (ch) ch.onmessage = (e) => emit(e.data || {});
    // Fallback path for browsers without BroadcastChannel: storage events.
    window.addEventListener("storage", (e) => {
      if (e.key === CHANNEL && e.newValue) { try { emit(JSON.parse(e.newValue)); } catch (_) {} }
    });

    return {
      send(kind, data) {
        const msg = Object.assign({ kind, role, ts: Date.now() }, data || {});
        if (kind === "state" && msg.state) {
          try { localStorage.setItem(LAST, JSON.stringify(msg.state)); } catch (_) {}
        }
        if (ch) { try { ch.postMessage(msg); } catch (_) {} }
        // storage-event fallback (also reaches other tabs when BroadcastChannel is missing)
        try { localStorage.setItem(CHANNEL, JSON.stringify(msg)); } catch (_) {}
      },
      on(kind, fn) { (handlers[kind] = handlers[kind] || []).push(fn); },
      lastState() { try { return JSON.parse(localStorage.getItem(LAST) || "null"); } catch (_) { return null; } },
    };
  };
})();
