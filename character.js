/* Pixel character that walks after the cursor: along the bottom of the screen, hopping
   over the dock, or along the top edge of the front window when one is open.
   Sprite sheets are single rows of 176×256 frames with the feet on row 250. */
(() => {
  "use strict";

  // Only for a mouse or trackpad; touch screens have no cursor to follow.
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const DIR = "assets/character/";
  // sprites carry the same ?v= as this script, so a new version's sprites aren't served from the old cache
  const VER = new URL(document.currentScript.src).search;
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
  // sit.png: 4 frames sitting on an edge, legs swinging; the seat is on row 144
  const SEAT = 144;
  const LEGS = (GROUND - SEAT) * SCALE;  // how far her feet hang below the edge she sits on
  // fall.png: 0 startled in mid-air, 1 falling, 2 landed on her bottom, 3 getting up, 4–5 shaking her fist
  const FALL = { freeze: 1.0, land: 0.7, up: 0.35, angry: 2.6, gravity: 2600 * SCALE };
  const CURSES = ["#@!%", "&*!#", "%$#@!", "!!!"];
  // On the Character & Merch window she puts on its hoodie. hoodie_on.png: 5 frames (holds it up, arms in,
  // over her head, head out, tugs it down), seconds on each;
  // sit_hoodie.png is sit.png in the hoodie. It stays with the window: she falls off in her t-shirt.
  const MERCH = "p:character";
  const DRESS = [0.8, 0.5, 0.6, 0.6, 0.7];
  // When the Mockups window opens she runs to the bottom-left corner, pulls a desk in from off screen
  // and sits at it for a while; the desk stays until the page is reloaded.
  // desk.png: 4 frames of 184×212, floor on row 208, desk's left edge at x 8: 0 empty, 1–3 her at the PC.
  // pull_left.png: 4 frames facing left, hands reaching to x 10, feet on row 250.
  const MOCKUPS = "p:mockups";
  // When Llama & Mavka opens, its llama gallops across the bottom chasing its bird, lies down on the right
  // and falls asleep with the bird perched on its back; the pair stays there until the page is reloaded.
  // llama_run.png: 6 frames of 220×200; llama_sleep.png: 0 standing, 1 kneeling, 2 resting, 3 curled up asleep,
  // drawn from x 6; feet on row 196 in both. bird.png: 6 frames of 80×64: 0–3 flying, 4 perched, 5 dozing,
  // perched feet on row 61. Asleep, the llama's back is on row 130 around x 60.
  const LLAMA_KEY = "p:llama-mavka";
  const LLAMA = { w: 220, h: 200, floor: 196, body: 141, right: 24, speed: 380, settle: [0.6, 0.5, 0.8], backY: 130, backX: 60 };
  const BIRD = { w: 80, h: 64, feet: 61, land: 1.4 };
  // When Lookbook opens, a wardrobe drops from the top of the screen next to the dock; she runs to it and
  // tries on the three outfits from the project's films, ducking inside between them. The wardrobe stays.
  // wardrobe.png: 2 frames of 300×280 (doors closed, doors open), floor on row 276, body 208 px wide.
  // outfits.png: 6 frames of her front-on, two poses per outfit: graphic hoodie, striped sweater, windbreaker.
  const LOOK_KEY = "p:lookbook";
  const WARD = { w: 300, h: 280, floor: 276, body: 208, gap: 30, gravity: 3200 };
  const CHANGE = (() => {
    // [seconds, doors open?, shaking?, her sprite or null while she's inside]
    const steps = [[0.45, 1, 0, ["poses", 0, 12]]];
    for (let k = 0; k < 3; k++) {
      steps.push([1.2, 0, 1, null], [1.0, 1, 0, ["outfits", 2 * k, 6]], [1.4, 1, 0, ["outfits", 2 * k + 1, 6]]);
    }
    steps.push([1.2, 0, 1, null], [0.5, 1, 0, ["poses", 0, 12]], [1.2, 1, 0, ["poses", 4, 12]], [0.3, 0, 0, ["poses", 0, 12]]);
    return steps;
  })();
  const DESK = { w: 184, h: 212, floor: 208, grip: 176, hands: 10, chair: 130, left: 4, pull: 2.4, work: 5 };

  const el = document.createElement("div");
  el.className = "buddy";
  el.setAttribute("aria-hidden", "true");
  el.style.width = FW * SCALE + "px";
  el.style.height = FH * SCALE + "px";
  document.body.appendChild(el);
  const bubble = document.createElement("div");
  bubble.className = "buddy-bubble";
  bubble.setAttribute("aria-hidden", "true");
  document.body.appendChild(bubble);
  // Tell app.js how much room to leave above new windows so she fits sitting on top of them.
  document.documentElement.style.setProperty("--buddy-headroom", MENUBAR + SEAT * SCALE + 10 + "px");

  // Warm the cache so switching animations doesn't flash.
  for (const f of ["walk_right", "walk_left", "run_right", "run_left", "jump_right", "jump_left", "poses", "sit", "fall", "hoodie_on", "sit_hoodie", "desk", "pull_left", "llama_run", "llama_sleep", "bird", "wardrobe", "outfits"]) new Image().src = DIR + f + ".png" + VER;

  const desk = document.createElement("div");
  desk.className = "buddy-desk";
  desk.setAttribute("aria-hidden", "true");
  desk.style.width = DESK.w * SCALE + "px";
  desk.style.height = DESK.h * SCALE + "px";
  desk.style.bottom = -(DESK.h - DESK.floor) * SCALE + "px";
  desk.style.backgroundImage = `url(${DIR}desk.png${VER})`;
  desk.style.backgroundSize = `${DESK.w * SCALE * 4}px ${DESK.h * SCALE}px`;
  let deskLeft = null;     // x of the desk frame's left edge, null while there's no desk
  // everything she brings in is gone after a reload; clear what earlier versions saved
  try { for (const k of ["buddy-desk", "buddy-llama", "buddy-wardrobe"]) localStorage.removeItem(k); } catch (e) { /* storage blocked */ }
  function placeDesk(left, i = 0) {
    deskLeft = left;
    desk.style.transform = `translateX(${Math.round(left)}px)`;
    desk.style.backgroundPosition = `${-i * DESK.w * SCALE}px 0`;
    if (!desk.isConnected) document.body.insertBefore(desk, el);
  }

  function sprite(cls, w, h) {
    const d = document.createElement("div");
    d.className = cls;
    d.setAttribute("aria-hidden", "true");
    d.style.width = w * SCALE + "px";
    d.style.height = h * SCALE + "px";
    return d;
  }
  const llama = sprite("buddy-llama", LLAMA.w, LLAMA.h);
  llama.style.bottom = -(LLAMA.h - LLAMA.floor) * SCALE + "px";
  const bird = sprite("buddy-bird", BIRD.w, BIRD.h);
  function frameOf(node, sheet, i, frames, w, h) {
    node.style.backgroundImage = `url(${DIR}${sheet}.png${VER})`;
    node.style.backgroundSize = `${w * SCALE * frames}px ${h * SCALE}px`;
    node.style.backgroundPosition = `${-i * w * SCALE}px 0`;
  }
  // phase: run → settle → asleep; null until Llama & Mavka first opens
  let scene = null;
  let llamaWin = null;

  function tickScene(dt) {
    const w = document.querySelector(`.window[data-key="${LLAMA_KEY}"]:not(.closing)`);
    if (w !== llamaWin) {
      llamaWin = w;
      if (w && !scene) scene = { phase: "run", t: 0, lx: -LLAMA.w * SCALE };
    }
    if (!scene) return;
    if (!llama.isConnected) document.body.insertBefore(llama, el), document.body.insertBefore(bird, el);
    scene.t += dt;
    const restX = innerWidth - LLAMA.right - LLAMA.body * SCALE;
    const groundY = innerHeight;
    // where the bird sits on the sleeping llama's back
    const perchX = restX + (LLAMA.backX - BIRD.w / 2) * SCALE;
    const perchY = groundY - (LLAMA.floor - LLAMA.backY + BIRD.feet) * SCALE;
    let bx, by, bi, flip = false, breathe = 1;
    if (scene.phase === "run") {
      // gallop in from the left, the bird flapping just ahead of its nose
      scene.lx = Math.min(restX, scene.lx + LLAMA.speed * SCALE * dt);
      llama.style.transform = `translateX(${Math.round(scene.lx)}px)`;
      frameOf(llama, "llama_run", Math.floor(scene.t * 12) % 6, 6, LLAMA.w, LLAMA.h);
      bx = Math.min(innerWidth - BIRD.w * SCALE, scene.lx + (LLAMA.w + 20 + 18 * Math.sin(scene.t * 2.5)) * SCALE);
      by = groundY - (180 - 16 * Math.sin(scene.t * 6)) * SCALE;
      bi = Math.floor(scene.t * 10) % 4;
      if (scene.lx >= restX) { scene.phase = "settle"; scene.t = 0; }
    } else if (scene.phase === "settle") {
      // stop, kneel, rest, curl up; the bird circles back and lands on her back
      const [a, b, c] = LLAMA.settle;
      const i = scene.t < a ? 0 : scene.t < a + b ? 1 : scene.t < a + b + c ? 2 : 3;
      llama.style.transform = `translateX(${Math.round(restX)}px)`;
      frameOf(llama, "llama_sleep", i, 4, LLAMA.w, LLAMA.h);
      if (!scene.from) scene.from = { x: Math.min(innerWidth - BIRD.w * SCALE, restX + (LLAMA.w + 20) * SCALE), y: groundY - 180 * SCALE };
      const p = Math.min(1, scene.t / (a + b + c + BIRD.land));
      const e = p * p * (3 - 2 * p);
      // a loop up and back to the left before dropping onto the back
      bx = scene.from.x + (perchX - scene.from.x) * e;
      by = scene.from.y + (perchY - scene.from.y) * e - Math.sin(p * Math.PI) * 90 * SCALE;
      flip = true;
      bi = p < 1 ? Math.floor(scene.t * 10) % 4 : 4;
      if (p >= 1 && i === 3) {
        scene = { phase: "asleep", t: 0, bt: 0 };
      }
    }
    if (scene.phase === "asleep") {
      // slow breathing; the bird dozes off now and then
      breathe = 1 + 0.025 * (1 + Math.sin(scene.t * 1.8)) / 2;
      llama.style.transform = `translateX(${Math.round(restX)}px) scaleY(${breathe.toFixed(4)})`;
      frameOf(llama, "llama_sleep", 3, 4, LLAMA.w, LLAMA.h);
      bx = perchX;
      by = perchY - (breathe - 1) * (LLAMA.floor - LLAMA.backY) * SCALE;
      bi = scene.t % 10 > 6 ? 5 : 4;
    }
    bird.style.transform = `translate(${Math.round(bx)}px, ${Math.round(by)}px)` + (flip ? " scaleX(-1)" : "");
    frameOf(bird, "bird", bi, 6, BIRD.w, BIRD.h);
  }

  const dock = document.getElementById("dock");

  const wardrobe = sprite("buddy-wardrobe", WARD.w, WARD.h);
  wardrobe.style.backgroundImage = `url(${DIR}wardrobe.png${VER})`;
  wardrobe.style.backgroundSize = `${WARD.w * SCALE * 2}px ${WARD.h * SCALE}px`;
  // ward: where the wardrobe's feet are (y), how fast it's falling, which frame, how far it's tipped
  let ward = null;
  let look = null;         // Lookbook opened: { phase: go | change, t }
  let lookWin = null;

  // Just left of the dock, clear of the desk.
  function wardX() {
    const half = (WARD.body / 2) * SCALE;
    const deskRight = DESK.left + DESK.w * SCALE;
    return Math.max(deskRight + 20 + half, dock.getBoundingClientRect().left - WARD.gap * SCALE - half);
  }

  function tickWardrobe(dt) {
    if (!ward) return;
    if (!wardrobe.isConnected) document.body.insertBefore(wardrobe, el);
    if (!ward.landed) {
      ward.vy += WARD.gravity * SCALE * dt;
      ward.y += ward.vy * dt;
      if (ward.y >= innerHeight) {
        ward.y = innerHeight;
        ward.squash = 0.18;
        // one small bounce, then it stays put
        if (ward.vy > 900 * SCALE) ward.vy = -ward.vy * 0.2;
        else { ward.vy = 0; ward.landed = true; }
      }
    } else ward.y = innerHeight;
    ward.squash = Math.max(0, ward.squash - dt);
    const sq = ward.squash > 0 ? 1 - 0.5 * ward.squash : 1;
    wardrobe.style.transform = `translate(${Math.round(wardX() - (WARD.w / 2) * SCALE)}px, ${Math.round(ward.y - WARD.floor * SCALE)}px)` +
      (ward.tilt ? ` rotate(${ward.tilt.toFixed(2)}deg)` : "") + (sq !== 1 ? ` scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})` : "");
    wardrobe.style.backgroundPosition = `${-ward.i * WARD.w * SCALE}px 0`;
  }

  // A Lookbook window that just opened drops the wardrobe (if it isn't there yet) and sends her to it.
  function startLook() {
    const w = document.querySelector(`.window[data-key="${LOOK_KEY}"]:not(.closing)`);
    if (w === lookWin) return false;
    lookWin = w;
    if (!w || look || task) return false;
    if (!ward) ward = { y: -40 * SCALE, vy: 0, landed: false, i: 0, tilt: 0, squash: 0 };
    look = { phase: "go", t: 0 };
    if (on) {
      on = null;
      dress = null;
      jump(clearOfDock(x), floorY(), null, 40 * SCALE);
      return true;
    }
    return false;
  }

  function tickLook(dt) {
    look.t += dt;
    if (look.phase === "go") {
      walk(dt, wardX());
      if (hop || state !== "idle" || !ward.landed) return;
      look = { phase: "change", t: 0 };
    }
    // step through the timeline: doors open and shut, the wardrobe rattles while she changes inside
    let t = look.t, k = 0;
    while (k < CHANGE.length && t >= CHANGE[k][0]) t -= CHANGE[k++][0];
    if (k >= CHANGE.length) {
      ward.i = 0;
      ward.tilt = 0;
      el.style.visibility = "";
      look = null;
      setState("idle");
      return;
    }
    const [, open, shake, her] = CHANGE[k];
    ward.i = open;
    ward.tilt = shake ? 2.5 * Math.sin(look.t * 38) : 0;
    x = wardX();
    y = floorY();
    el.style.visibility = her ? "" : "hidden";
    if (her) show(her[0], her[1], her[2]);
  }

  const floorY = () => innerHeight;

  let x = innerWidth * 0.82, y = floorY();
  let target = x;
  let facing = "left";
  let on = null;           // window she sits on, or null for the floor
  let relX = 0;            // her x relative to that window, so she rides along when it's dragged
  let hop = null;          // jump in progress
  let fall = null;         // window closed under her: freeze, drop, land, get up, scold
  let state = "";          // walk | run | idle
  let frame = 0, frameTime = 0;
  let pose = "stand", idleFor = 0, poseFor = 0;
  let swing = 0;           // sitting: leg-swing clock
  let dress = null;        // on the merch window: seconds into putting on the hoodie, then "done"
  let task = null;         // Mockups opened: { phase: go | pull | work, t }
  let mockups = null;      // the Mockups window we last reacted to
  // sitting: when the window is dragged she tips the other way and wobbles back (a damped spring)
  let tilt = 0, tiltVel = 0, winVX = 0, lastLeft = null;
  let last = performance.now();

  function show(sheet, i, frames) {
    el.style.backgroundImage = `url(${DIR}${sheet}.png${VER})`;
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

  // The front window, if there's room above it for her to sit.
  function frontWindow() {
    let best = null;
    for (const w of document.querySelectorAll(".window:not(.closing)")) {
      if (!best || +w.style.zIndex > +best.style.zIndex) best = w;
    }
    if (!best) return null;
    const r = best.getBoundingClientRect();
    return r.top - MENUBAR >= SEAT * SCALE * 0.9 && r.width > FW * SCALE ? best : null;
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
  // A click while she's standing on the floor makes her jump on the spot.
  addEventListener("pointerdown", () => { if (state === "idle" && !hop && !on && !fall && !task && !look) jump(x, y, null, 70 * SCALE); }, { passive: true });

  // Cartoon fall: she hangs in the air for a moment, drops, lands on her bottom,
  // gets up and shakes her fist with a little speech bubble.
  function tickFall(dt) {
    fall.t += dt;
    let i = 0;
    if (fall.phase === "freeze") {
      i = 0;
      if (fall.t >= FALL.freeze) { fall.phase = "drop"; fall.t = 0; fall.vy = 0; fall.x0 = x; fall.y0 = y; }
    } else if (fall.phase === "drop") {
      i = 1;
      fall.vy += FALL.gravity * dt;
      y = Math.min(floorY(), y + fall.vy * dt);
      // drift clear of the dock on the way down
      const p = Math.min(1, (y - fall.y0) / Math.max(1, floorY() - fall.y0));
      x = fall.x0 + (fall.x1 - fall.x0) * p;
      if (y >= floorY()) { fall.phase = "land"; fall.t = 0; }
    } else if (fall.phase === "land") {
      i = 2;
      if (fall.t >= FALL.land) { fall.phase = "up"; fall.t = 0; }
    } else if (fall.phase === "up") {
      i = 3;
      if (fall.t >= FALL.up) { fall.phase = "angry"; fall.t = 0; }
    } else {
      i = 4 + (Math.floor(fall.t * 6) % 2);
      if (Math.floor(fall.t * 1.5) !== fall.word) {
        fall.word = Math.floor(fall.t * 1.5);
        bubble.textContent = CURSES[fall.word % CURSES.length];
      }
      bubble.classList.add("show");
      bubble.style.transform = `translate(${Math.round(x + HALF * 0.35)}px, ${Math.round(y - TALL + 6 * SCALE)}px)`;
      if (fall.t >= FALL.angry) {
        bubble.classList.remove("show");
        fall = null;
        setState("idle");
        return;
      }
    }
    show("fall", i, 6);
  }

  function tickHop(dt) {
    hop.t += dt;
    if (hop.to && (!hop.to.isConnected || hop.to.classList.contains("closing"))) {
      // the window closed mid-jump: come down to the floor instead
      hop.to = null;
      hop.x1 = clearOfDock(hop.x1);
      hop.y1 = floorY();
      on = null;
    } else if (hop.to) {
      // the window may still be animating open or being dragged: aim for where it is now
      const r = hop.to.getBoundingClientRect();
      hop.x1 = Math.min(r.right - HALF, Math.max(r.left + HALF, hop.x1));
      hop.y1 = r.top + LEGS;
    }
    let i;
    if (hop.t < 0) {
      i = hop.t < -CROUCH / 2 ? 0 : 1;
    } else if (hop.t < hop.T) {
      const p = hop.t / hop.T;
      x = hop.x0 + (hop.x1 - hop.x0) * p;
      y = hop.y0 + (hop.y1 - hop.y0) * p - hop.bow * p * (1 - p);
      i = 2 + Math.min(3, Math.floor(p * 4));
    } else if (hop.to) {
      // straight from the air into sitting on the window's edge
      x = hop.x1;
      y = hop.y1;
      on = hop.to;
      relX = x - on.getBoundingClientRect().left;
      hop = null;
      swing = 0;
      dress = on.dataset.key === MERCH ? -0.4 : null;
      return sit(0);
    } else {
      x = hop.x1;
      y = hop.y1;
      i = hop.t < hop.T + CROUCH / 2 ? 6 : 7;
      if (hop.t >= hop.T + CROUCH) {
        on = null;
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
    tickScene(dt);
    tickWardrobe(dt);

    if (fall) {
      tickFall(dt);
    } else if (hop) {
      tickHop(dt);
    } else if (startTask() || startLook()) {
      tickHop(0);
    } else if (task) {
      tickTask(dt);
    } else if (look) {
      tickLook(dt);
    } else {
      // once she's on a window she stays on it until it closes
      const stillOpen = on && on.isConnected && !on.classList.contains("closing");
      const want = stillOpen ? on : frontWindow();
      if (on && !stillOpen) {
        on = null;
        dress = null;
        fall = { phase: "freeze", t: 0, x1: clearOfDock(x) };
        tickFall(0);
      } else if (want !== on) {
        if (want) {
          // up onto the window that just opened (or came to the front), keeping her head on screen
          const r = want.getBoundingClientRect();
          const y1 = r.top + LEGS;
          jump(Math.min(r.right - HALF, Math.max(r.left + HALF, target)), y1, want, Math.max(12, Math.min(70 * SCALE, y1 - TALL)));
        }
        tickHop(0);
      } else if (on) {
        sit(dt);
      } else {
        walk(dt);
      }
    }

    if (!on || hop) { tilt = 0; tiltVel = 0; lastLeft = null; }
    // windows cover her, except the one she is sitting on or has just cleared the top of
    el.style.zIndex = on || (hop && hop.to && y <= hop.to.getBoundingClientRect().top + 4) ? "7000" : "";
    el.style.transform = `translate(${Math.round(x - HALF)}px, ${Math.round(y - TALL)}px)` + (tilt ? ` rotate(${tilt.toFixed(2)}deg)` : "");
    requestAnimationFrame(tick);
  }

  // Sitting on the window's top edge with her legs over the front, riding along if it's dragged.
  function sit(dt) {
    const r = on.getBoundingClientRect();
    x = r.left + relX;
    y = r.top + LEGS;
    // how fast the window is moving sideways, smoothed
    if (lastLeft !== null && dt > 0) winVX += ((r.left - lastLeft) / dt - winVX) * Math.min(1, dt * 12);
    lastLeft = r.left;
    // lean against the motion, then spring back with a wobble
    const lean = Math.max(-28, Math.min(28, -winVX * 0.03));
    tiltVel += ((lean - tilt) * 90 - tiltVel * 7) * dt;
    tilt += tiltVel * dt;
    if (Math.abs(tilt) < 0.05 && Math.abs(tiltVel) < 0.05) tilt = tiltVel = 0;
    if (typeof dress === "number") {
      // pulling the hoodie on, a beat after landing
      dress += dt;
      if (dress >= 0) {
        let t = dress, i = 0;
        while (i < DRESS.length - 1 && t >= DRESS[i]) t -= DRESS[i++];
        if (i === DRESS.length - 1 && t >= DRESS[i]) { dress = "done"; swing = 0; }
        else return show("hoodie_on", i, DRESS.length);
      }
    }
    const sheet = dress === "done" ? "sit_hoodie" : "sit";
    if (Math.abs(winVX) > 60 || Math.abs(tilt) > 4) {
      // losing her balance: legs kick fast
      swing = (swing + dt * 3) % 2;
      show(sheet, [0, 1, 2, 3][Math.floor(swing * 4) % 4], 4);
      return;
    }
    // swing her legs for a couple of seconds, then rest a little
    swing = (swing + dt) % 5;
    show(sheet, swing < 2 ? [0, 1, 2, 3][Math.floor(swing * 4) % 4] : 0, 4);
  }

  // A Mockups window that just opened starts the desk errand; if she's sitting on a window she hops down first.
  function startTask() {
    const w = document.querySelector(`.window[data-key="${MOCKUPS}"]:not(.closing)`);
    if (w === mockups) return false;
    mockups = w;
    if (!w || task || look) return false;
    task = { phase: "go", t: 0 };
    if (on) {
      on = null;
      dress = null;
      jump(clearOfDock(x), floorY(), null, 40 * SCALE);
      return true;
    }
    return false;
  }

  function tickTask(dt) {
    task.t += dt;
    const chairX = DESK.left + DESK.chair * SCALE;
    if (task.phase === "go") {
      // run to the corner, or straight to the chair if the desk is already there
      const goal = deskLeft === null ? HALF : chairX;
      if (hop) return tickHop(dt);
      walk(dt, goal);
      if (hop || state !== "idle") return;
      task = deskLeft === null ? { phase: "pull", t: 0, from: x - HALF + (DESK.hands - DESK.grip) * SCALE } : { phase: "work", t: 0 };
      if (task.phase === "pull") placeDesk(task.from);
    }
    if (task.phase === "pull") {
      // walk backwards dragging the desk in by the back of its chair
      const p = Math.min(1, task.t / DESK.pull);
      const e = p * p * (3 - 2 * p);
      placeDesk(task.from + (DESK.left - task.from) * e);
      x = deskLeft + (DESK.grip - DESK.hands) * SCALE + HALF;
      y = floorY();
      facing = "left";
      show("pull_left", Math.floor(task.t * 6) % 4, 4);
      if (p >= 1) {
        task = { phase: "work", t: 0 };
      } else return;
    }
    // at the PC: she's drawn into the desk sprite, clicking and typing
    el.style.visibility = "hidden";
    placeDesk(DESK.left, [1, 2, 1, 3][Math.floor(task.t * 2.5) % 4]);
    if (task.t >= DESK.work) {
      placeDesk(DESK.left, 0);
      el.style.visibility = "";
      x = chairX;
      y = floorY();
      facing = "right";
      task = null;
      setState("idle");
    }
  }

  function walk(dt, to = target) {
    y = floorY();
    let goal = Math.min(innerWidth - HALF, Math.max(HALF, to));
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

    const dx = goal - x;
    const dist = Math.abs(dx);
    if (dist <= NEAR && !(goal !== to && dist > 1)) setState("idle");
    // on an errand she runs the whole way
    else setState(to !== target || dist > RUN_FROM || (state === "run" && dist > RUN_FROM / 3) ? "run" : "walk");

    if (state !== "idle") {
      facing = dx > 0 ? "right" : "left";
      const step = (state === "run" ? RUN_SPEED : WALK_SPEED) * dt;
      x += Math.sign(dx) * Math.min(step, dist);
      const a = ANIM[state];
      frameTime += dt;
      while (frameTime >= 1 / a.fps) { frameTime -= 1 / a.fps; frame = (frame + 1) % a.frames; }
      show(`${state}_${facing}`, frame, a.frames);
    } else if (to !== target) {
      // just arrived somewhere on an errand
      show("poses", 0, POSES.length);
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
  }

  requestAnimationFrame(tick);
})();
