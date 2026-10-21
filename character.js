/* Pixel character that walks after the cursor: along the bottom of the screen, hopping
   over the dock, or along the top edge of the front window when one is open.
   Sprite sheets are single rows of 176×256 frames with the feet on row 250. */
(() => {
  "use strict";

  // Only for a mouse or trackpad; touch screens have no cursor to follow.
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const DIR = "assets/character/";
  const FW = 176, FH = 256, GROUND = 250;
  // Full size on most laptop screens, a bit smaller on short ones.
  const SCALE = innerHeight >= 760 ? 1 : 0.75;
  const ANIM = {
    walk: { frames: 8, fps: 9 },
    run: { frames: 4, fps: 10 },
  };
  // Order of frames in poses.png
  const POSES = ["stand", "arms_crossed", "hands_on_hips", "hand_in_pocket", "wave", "back_hands_on_hips",
    "hand_on_head", "shrug", "arms_crossed_2", "hand_on_hip", "crouch_point", "peace"];
  // hand_in_pocket is left out: its sheet frame has a patch of white background between the legs
  const IDLE_POSES = ["arms_crossed", "hands_on_hips", "wave", "hand_on_head", "shrug", "hand_on_hip", "peace"];

  const NEAR = 14;        // px from the cursor where she stops
  const RUN_FROM = 360;   // px from the cursor where she starts running
  const WALK_SPEED = 130 * SCALE;  // px per second, roughly matching her stride
  const RUN_SPEED = 400 * SCALE;
  const HALF = (FW * SCALE) / 2;
  const TALL = GROUND * SCALE;     // from her feet to the top of the frame
  const MENUBAR = 28;
  // jump.png: frames 0–1 crouch, 2–5 in the air, 6–7 landing
  const CROUCH = 0.12;             // seconds spent on the take-off and landing frames

  const el = document.createElement("div");
  el.className = "buddy";
  el.setAttribute("aria-hidden", "true");
  el.style.width = FW * SCALE + "px";
  el.style.height = FH * SCALE + "px";
  document.body.appendChild(el);
  // Tell app.js how much room to leave above new windows so she fits on top of them.
  document.documentElement.style.setProperty("--buddy-headroom", MENUBAR + TALL + 8 + "px");

  // Warm the cache so switching animations doesn't flash.
  for (const f of ["walk_right", "walk_left", "run_right", "run_left", "jump_right", "jump_left", "poses"]) new Image().src = DIR + f + ".png";

  const dock = document.getElementById("dock");
  const floorY = () => innerHeight;

  let x = innerWidth * 0.82, y = floorY();
  let target = x;
  let facing = "left";
  let on = null;           // window she stands on, or null for the floor
  let relX = 0;            // her x relative to that window, so she rides along when it's dragged
  let hop = null;          // jump in progress
  let state = "";          // walk | run | idle
  let frame = 0, frameTime = 0;
  let pose = "stand", idleFor = 0, poseFor = 0;
  let last = performance.now();

  function show(sheet, i, frames) {
    el.style.backgroundImage = `url(${DIR}${sheet}.png)`;
    el.style.backgroundSize = `${FW * SCALE * frames}px ${FH * SCALE}px`;
    el.style.backgroundPosition = `${-i * FW * SCALE}px 0`;
  }

  function setState(s) {
    if (s === state) return;
    state = s;
    frame = 0;
    frameTime = 0;
    if (s === "idle") { pose = "stand"; idleFor = 0; poseFor = 0; }
  }

  // The front window, if there's room above it for her to stand.
  function frontWindow() {
    let best = null;
    for (const w of document.querySelectorAll(".window:not(.closing)")) {
      if (!best || +w.style.zIndex > +best.style.zIndex) best = w;
    }
    if (!best) return null;
    const r = best.getBoundingClientRect();
    return r.top - MENUBAR >= TALL * 0.85 && r.width > FW * SCALE ? best : null;
  }

  // Where she can stand on the floor without being inside the dock.
  function dockSpan() {
    const r = dock.getBoundingClientRect();
    return { l: r.left - HALF * 0.6, r: r.right + HALF * 0.6, top: r.top };
  }

  function clearOfDock(px) {
    const d = dockSpan();
    return px > d.l && px < d.r ? (px - d.l < d.r - px ? d.l : d.r) : px;
  }

  // The arc is the straight line between the ends lifted by bow·p·(1−p);
  // pick the bow that makes its highest point reach `peak`.
  function bowFor(y0, y1, peak) {
    const top = (k) => {
      let m = Infinity;
      for (let i = 0; i <= 40; i++) { const p = i / 40; m = Math.min(m, y0 + (y1 - y0) * p - k * p * (1 - p)); }
      return m;
    };
    let lo = 0, hi = 8 * (Math.max(y0, y1) - peak);
    for (let n = 0; n < 24; n++) { const k = (lo + hi) / 2; if (top(k) > peak) lo = k; else hi = k; }
    return hi;
  }

  function jump(x1, y1, to, height) {
    hop = {
      x0: x, y0: y, x1, y1, to, t: -CROUCH,
      bow: bowFor(y, y1, Math.min(y, y1) - height),
      T: 0.42 + Math.hypot(x1 - x, y1 - y) / 1800,
    };
    if (Math.abs(x1 - x) > 2) facing = x1 > x ? "right" : "left";
    state = "";
  }

  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") target = e.clientX; }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { target = x; });
  // A click while she's standing makes her jump on the spot.
  addEventListener("pointerdown", () => { if (state === "idle" && !hop) jump(x, y, on, Math.max(12, Math.min(70 * SCALE, y - TALL))); }, { passive: true });

  function tickHop(dt) {
    hop.t += dt;
    if (hop.to && (!hop.to.isConnected || hop.to.classList.contains("closing"))) {
      // the window closed mid-jump: come down to the floor instead
      hop.to = null;
      hop.x1 = clearOfDock(hop.x1);
      hop.y1 = floorY();
    } else if (hop.to) {
      // the window may still be animating open or being dragged: aim for where it is now
      const r = hop.to.getBoundingClientRect();
      hop.x1 = Math.min(r.right - HALF, Math.max(r.left + HALF, hop.x1));
      hop.y1 = r.top;
    }
    let i;
    if (hop.t < 0) {
      i = hop.t < -CROUCH / 2 ? 0 : 1;
    } else if (hop.t < hop.T) {
      const p = hop.t / hop.T;
      x = hop.x0 + (hop.x1 - hop.x0) * p;
      y = hop.y0 + (hop.y1 - hop.y0) * p - hop.bow * p * (1 - p);
      i = 2 + Math.min(3, Math.floor(p * 4));
    } else {
      x = hop.x1;
      y = hop.y1;
      i = hop.t < hop.T + CROUCH / 2 ? 6 : 7;
      if (hop.t >= hop.T + CROUCH) {
        on = hop.to;
        if (on) relX = x - on.getBoundingClientRect().left;
        hop = null;
        setState("idle");
        return;
      }
    }
    show(`jump_${facing}`, i, 8);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (hop) {
      tickHop(dt);
    } else {
      const want = frontWindow();
      if (want !== on) {
        if (want) {
          // up onto the window that just opened (or came to the front), keeping her head on screen
          const r = want.getBoundingClientRect();
          jump(Math.min(r.right - HALF, Math.max(r.left + HALF, x)), r.top, want, Math.max(12, Math.min(70 * SCALE, r.top - TALL)));
        } else {
          // the window closed: drop to the floor, clear of the dock
          jump(clearOfDock(x), floorY(), null, 30 * SCALE);
        }
        tickHop(0);
      } else {
        walk(dt);
      }
    }

    el.style.transform = `translate(${Math.round(x - HALF)}px, ${Math.round(y - TALL)}px)`;
    requestAnimationFrame(tick);
  }

  function walk(dt) {
    let lo = HALF, hi = innerWidth - HALF, goal;
    if (on) {
      const r = on.getBoundingClientRect();
      x = r.left + relX;
      y = r.top;
      lo = r.left + HALF;
      hi = r.right - HALF;
      goal = Math.min(hi, Math.max(lo, target));
    } else {
      y = floorY();
      goal = Math.min(hi, Math.max(lo, target));
      const d = dockSpan();
      const left = x <= (d.l + d.r) / 2;
      const goalAcross = left ? goal > d.l : goal < d.r;
      if (goalAcross) {
        const edge = left ? d.l : d.r;
        // past the dock: hop over it once she reaches its edge; over it: wait at the edge
        if ((left ? goal >= d.r : goal <= d.l) && Math.abs(x - edge) < 2) {
          jump(left ? d.r : d.l, y, null, y - d.top + 40 * SCALE);
          tickHop(0);
          return;
        }
        goal = edge;
      }
    }

    const dx = goal - x;
    const dist = Math.abs(dx);
    if (dist <= NEAR && !(goal !== target && dist > 1)) setState("idle");
    else setState(dist > RUN_FROM || (state === "run" && dist > RUN_FROM / 3) ? "run" : "walk");

    if (state !== "idle") {
      facing = dx > 0 ? "right" : "left";
      const step = (state === "run" ? RUN_SPEED : WALK_SPEED) * dt;
      x += Math.sign(dx) * Math.min(step, dist);
      const a = ANIM[state];
      frameTime += dt;
      while (frameTime >= 1 / a.fps) { frameTime -= 1 / a.fps; frame = (frame + 1) % a.frames; }
      show(`${state}_${facing}`, frame, a.frames);
    } else {
      // Stand for a while, then strike a random pose, then go back to standing.
      idleFor += dt;
      if (pose === "stand" && idleFor > 3.5) {
        pose = IDLE_POSES[Math.floor(Math.random() * IDLE_POSES.length)];
        poseFor = 0;
      } else if (pose !== "stand" && (poseFor += dt) > 2.6) {
        pose = "stand";
        idleFor = 0;
      }
      show("poses", POSES.indexOf(pose), POSES.length);
    }
    if (on) relX = x - on.getBoundingClientRect().left;
  }

  requestAnimationFrame(tick);
})();
