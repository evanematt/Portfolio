/* The pixel character on the phone home screen (mobile.js). character.js follows a mouse, so on a phone
   she gets her own small version: on the home screen she strolls along the top of the page switcher,
   and inside an open project she plays that project's scene from the desktop along the bottom edge,
   ducking out of the way while you scroll. Sprite sheets are the same as character.js uses. */
(() => {
  "use strict";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const phoneQuery = matchMedia("(max-width: 640px)");
  const phone = document.querySelector(".phone");
  if (!phone) return;

  const DIR = "assets/character/";
  const VER = new URL(document.currentScript.src).search;
  // character.js's sheets at 40%: she's about 70×100 px
  const S = 0.4;
  const FW = 176, FH = 256, GROUND = 250, SEAT = 144;
  const HALF = (FW * S) / 2;
  const LEGS = (GROUND - SEAT) * S;
  const WALK = 60, RUN = 170;  // px per second
  const POSES = ["stand", "arms_crossed", "hands_on_hips", "hand_in_pocket", "wave", "back_hands_on_hips",
    "hand_on_head", "shrug", "arms_crossed_2", "hand_on_hip", "crouch_point", "peace"];
  const IDLE_POSES = ["arms_crossed", "hands_on_hips", "wave", "hand_on_head", "shrug", "hand_on_hip", "peace"];
  // the desk, llama, bird and wardrobe, measured as in character.js
  const DESK = { w: 184, h: 212, floor: 208, grip: 176, hands: 10, left: 4, pull: 2.4 };
  const LLAMA = { w: 220, h: 200, floor: 196, body: 141, speed: 380, settle: [0.6, 0.5, 0.8], backY: 130, backX: 60 };
  const BIRD = { w: 80, h: 64, feet: 61, land: 1.4 };
  const WARD = { w: 300, h: 280, floor: 276, body: 208, gravity: 3200 };
  const DRESS = [0.8, 0.5, 0.6, 0.6, 0.7];
  // Lookbook: [seconds, doors open?, shaking?, her sprite or null while she's inside]
  const CHANGE = (() => {
    const steps = [[0.45, 1, 0, ["poses", 0, 12]]];
    for (let k = 0; k < 3; k++) steps.push([1.2, 0, 1, null], [1.0, 1, 0, ["outfits", 2 * k, 6]], [1.4, 1, 0, ["outfits", 2 * k + 1, 6]]);
    steps.push([1.2, 0, 1, null], [0.5, 1, 0, ["poses", 0, 12]], [1.2, 1, 0, ["poses", 4, 12]], [0.3, 0, 0, ["poses", 0, 12]]);
    return steps;
  })();

  for (const f of ["walk_right", "walk_left", "run_right", "run_left", "jump_right", "jump_left", "poses", "hoodie_on", "sit_hoodie", "desk", "pull_left", "llama_run", "llama_sleep", "bird", "wardrobe", "outfits"]) new Image().src = DIR + f + ".png" + VER;

  function sprite(parent, cls, w, h) {
    const d = document.createElement("div");
    d.className = "pb " + cls;
    d.setAttribute("aria-hidden", "true");
    d.style.width = w * S + "px";
    d.style.height = h * S + "px";
    parent.appendChild(d);
    return d;
  }
  function frame(node, sheet, i, frames, w = FW, h = FH) {
    node.style.backgroundImage = `url(${DIR}${sheet}.png${VER})`;
    node.style.backgroundSize = `${w * S * frames}px ${h * S}px`;
    node.style.backgroundPosition = `${-i * w * S}px 0`;
  }
  const place = (node, x, y, extra = "") => { node.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)` + extra; };
  const ease = (p) => p * p * (3 - 2 * p);

  // Her, standing with her feet at (x, y) inside a layer: walking, striking poses, hopping.
  function character(layer) {
    const her = { node: sprite(layer, "pb-her", FW, FH), x: 0, y: 0, facing: "right", state: "", f: 0, ft: 0, pose: "stand", idle: 0, posed: 0, hop: null };
    her.show = (sheet, i, frames) => frame(her.node, sheet, i, frames);
    her.draw = () => place(her.node, her.x - HALF, her.y - GROUND * S);
    // a step toward x; true once she's there
    her.walk = (dt, x, run = false) => {
      const dx = x - her.x;
      if (Math.abs(dx) < 1) { her.x = x; her.state = ""; return true; }
      const state = run || Math.abs(dx) > 120 ? "run" : "walk";
      if (state !== her.state) { her.state = state; her.f = 0; her.ft = 0; }
      her.facing = dx > 0 ? "right" : "left";
      her.x += Math.sign(dx) * Math.min(Math.abs(dx), (state === "run" ? RUN : WALK) * dt);
      const [frames, fps] = state === "run" ? [4, 10] : [8, 9];
      her.ft += dt;
      while (her.ft >= 1 / fps) { her.ft -= 1 / fps; her.f = (her.f + 1) % frames; }
      her.show(`${state}_${her.facing}`, her.f, frames);
      return false;
    };
    // standing about: a few seconds still, then a random pose
    her.loiter = (dt) => {
      her.idle += dt;
      if (her.pose === "stand" && her.idle > 3) { her.pose = IDLE_POSES[Math.floor(Math.random() * IDLE_POSES.length)]; her.posed = 0; }
      else if (her.pose !== "stand" && (her.posed += dt) > 2.4) { her.pose = "stand"; her.idle = 0; }
      her.show("poses", POSES.indexOf(her.pose), POSES.length);
    };
    // a jump, on the spot or over to (x1, y1); true while she's in the air
    her.jump = (x1 = her.x, y1 = her.y) => {
      if (her.hop) return;
      her.hop = { t: -0.12, x0: her.x, y0: her.y, x1, y1 };
      if (Math.abs(x1 - her.x) > 1) her.facing = x1 > her.x ? "right" : "left";
      her.state = "";
    };
    her.hopping = (dt) => {
      if (!her.hop) return false;
      const h = her.hop, T = 0.5;
      h.t += dt;
      let i;
      if (h.t < 0) i = h.t < -0.06 ? 0 : 1;
      else if (h.t < T) {
        const p = h.t / T;
        her.x = h.x0 + (h.x1 - h.x0) * p;
        her.y = h.y0 + (h.y1 - h.y0) * p - 120 * S * 4 * p * (1 - p);
        i = 2 + Math.min(3, Math.floor(p * 4));
      } else { her.x = h.x1; her.y = h.y1; i = h.t < T + 0.06 ? 6 : 7; if (h.t >= T + 0.12) her.hop = null; }
      her.show(`jump_${her.facing}`, i, 8);
      return true;
    };
    her.hits = (cx, cy) => {
      const r = her.node.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top + r.height * 0.2 && cy <= r.bottom;
    };
    return her;
  }

  // ---------- home screen: she strolls along the dock, up on the page switcher where it is ----------
  const homeLayer = document.createElement("div");
  homeLayer.className = "pb-layer";
  phone.appendChild(homeLayer);
  const home = character(homeLayer);
  let homeGoal = null, homeWait = 1.5, homePlaced = false;
  const pager = phone.querySelector(".phone-pager");
  const dock = phone.querySelector(".phone-dock");

  // the top of whatever is under x: the switcher's pill, or else the dock
  function floorAt(x, pill = pager && pager.getBoundingClientRect(), d = dock.getBoundingClientRect()) {
    return pill && x >= pill.left + 6 && x <= pill.right - 6 ? pill.top + 1 : d.top + 1;
  }

  // a spot where she'd stand clear of the open page's icons, so she never hides one
  function clearSpot(lo, hi) {
    const page = pages().children[Math.round(pages().scrollLeft / Math.max(1, pages().clientWidth))];
    const boxes = page ? [...page.querySelectorAll(".app, .widget")].map((n) => n.getBoundingClientRect()) : [];
    // nor stand down beside the switcher overlapping its buttons
    if (pager) boxes.push(pager.getBoundingClientRect());
    const free = [];
    for (let k = 0; k <= 30; k++) {
      const x = lo + ((hi - lo) * k) / 30;
      const y = floorAt(x), top = y - (GROUND - 12) * S;
      if (!boxes.some((r) => r.left < x + HALF * 0.6 && r.right > x - HALF * 0.6 && r.top < y && r.bottom > top)) free.push(x);
    }
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }
  const pages = () => phone.querySelector(".phone-pages");

  function tickHome(dt) {
    const d = dock.getBoundingClientRect();
    const lo = d.left + HALF * 0.7, hi = d.right - HALF * 0.7;
    if (!homePlaced) { home.x = clearSpot(lo, hi) ?? (lo + hi) / 2; home.y = floorAt(home.x); homePlaced = true; }
    if (!home.hopping(dt)) {
      home.x = Math.min(hi, Math.max(lo, home.x));
      home.y = floorAt(home.x);
      if (homeGoal !== null) {
        // up onto the switcher, or down off it, with a hop
        const dir = Math.sign(homeGoal - home.x);
        if (Math.abs(homeGoal - home.x) > 3 && Math.abs(floorAt(home.x + dir * 3) - home.y) > 4) {
          const to = home.x + dir * HALF * 0.8;
          home.jump(to, floorAt(to));
          home.hopping(0);
        } else if (home.walk(dt, homeGoal)) { homeGoal = null; homeWait = 4 + Math.random() * 6; home.idle = 0; home.pose = "stand"; }
      } else {
        home.loiter(dt);
        if ((homeWait -= dt) <= 0) {
          homeGoal = clearSpot(lo, hi) ?? home.x;
          homeWait = 3;
          if (Math.abs(homeGoal - home.x) < 4) homeGoal = null;
        }
      }
    }
    home.draw();
  }

  // ---------- inside a project: that project's scene from the desktop, along the bottom ----------
  let stage = null;

  document.addEventListener("phone:project", (e) => {
    const { sheet, id } = e.detail;
    const layer = document.createElement("div");
    layer.className = "pb-stage";
    sheet.classList.add("has-stage");
    sheet.appendChild(layer);
    stage = { sheet, layer, id, t: 0, her: character(layer), scene: null };
    stage.her.x = -HALF;
    // duck down while the page is scrolling, peek back up once it stops
    let rest;
    sheet.querySelector(".sheet-scroll").addEventListener("scroll", () => {
      layer.classList.add("away");
      clearTimeout(rest);
      rest = setTimeout(() => layer.classList.remove("away"), 650);
    }, { passive: true });
  });

  // her wandering about the bottom when the project has no scene of its own
  function stroll(s, dt, W, lo = HALF + 6, hi = W - HALF - 6) {
    const her = s.her;
    if (s.goal == null && s.wait == null) s.goal = lo + (hi - lo) * 0.25;
    if (s.goal != null) {
      if (her.walk(dt, s.goal)) { s.goal = null; s.wait = 4 + Math.random() * 5; her.idle = 0; her.pose = "stand"; }
    } else {
      her.loiter(dt);
      if ((s.wait -= dt) <= 0) { s.wait = null; s.goal = lo + Math.random() * (hi - lo); }
    }
  }

  const SCENES = {
    // she runs into the bottom-left corner, drags a desk in from off screen and gets to work at it
    mockups(s, dt, W, H) {
      const her = s.her;
      if (!s.desk) {
        s.desk = sprite(s.layer, "pb-prop", DESK.w, DESK.h);
        s.phase = "go";
        her.x = W + HALF;
      }
      const top = H - DESK.floor * S;
      if (s.phase === "go") {
        if (her.walk(dt, HALF, true)) { s.phase = "pull"; s.t = 0; s.from = her.x - HALF + (DESK.hands - DESK.grip) * S; }
        place(s.desk, -DESK.w * S, top);
        return;
      }
      if (s.phase === "pull") {
        // walking backwards, pulling it in by the back of its chair
        const p = Math.min(1, s.t / DESK.pull);
        const left = s.from + (DESK.left - s.from) * ease(p);
        place(s.desk, left, top);
        frame(s.desk, "desk", 0, 4, DESK.w, DESK.h);
        her.x = left + (DESK.grip - DESK.hands) * S + HALF;
        her.show("pull_left", Math.floor(s.t * 6) % 4, 4);
        if (p >= 1) { s.phase = "work"; s.t = 0; }
        return;
      }
      // at the PC: she's drawn into the desk sprite, clicking and typing
      her.node.style.visibility = "hidden";
      place(s.desk, DESK.left, top);
      frame(s.desk, "desk", [1, 2, 1, 3][Math.floor(s.t * 2.5) % 4], 4, DESK.w, DESK.h);
    },

    // the llama gallops in after its bird and falls asleep on the right with the bird on its back
    "llama-mavka"(s, dt, W, H) {
      if (!s.llama) {
        s.llama = sprite(s.layer, "pb-prop", LLAMA.w, LLAMA.h);
        s.bird = sprite(s.layer, "pb-prop", BIRD.w, BIRD.h);
        s.l = { phase: "run", t: 0, x: -LLAMA.w * S };
      }
      const l = s.l;
      l.t += dt;
      const restX = W - 8 - LLAMA.body * S;
      const top = H - LLAMA.floor * S;
      const perchX = restX + (LLAMA.backX - BIRD.w / 2) * S;
      const perchY = H - (LLAMA.floor - LLAMA.backY + BIRD.feet) * S;
      let bx, by, bi, flip = false;
      if (l.phase === "run") {
        l.x = Math.min(restX, l.x + LLAMA.speed * S * dt);
        place(s.llama, l.x, top);
        frame(s.llama, "llama_run", Math.floor(l.t * 12) % 6, 6, LLAMA.w, LLAMA.h);
        bx = Math.min(W - BIRD.w * S, l.x + (LLAMA.w + 20 + 18 * Math.sin(l.t * 2.5)) * S);
        by = H - (180 - 16 * Math.sin(l.t * 6)) * S;
        bi = Math.floor(l.t * 10) % 4;
        if (l.x >= restX) Object.assign(l, { phase: "settle", t: 0, from: { x: bx, y: by } });
      } else if (l.phase === "settle") {
        const [a, b, c] = LLAMA.settle;
        const i = l.t < a ? 0 : l.t < a + b ? 1 : l.t < a + b + c ? 2 : 3;
        place(s.llama, restX, top);
        frame(s.llama, "llama_sleep", i, 4, LLAMA.w, LLAMA.h);
        const p = Math.min(1, l.t / (a + b + c + BIRD.land));
        bx = l.from.x + (perchX - l.from.x) * ease(p);
        by = l.from.y + (perchY - l.from.y) * ease(p) - Math.sin(p * Math.PI) * 90 * S;
        flip = true;
        bi = p < 1 ? Math.floor(l.t * 10) % 4 : 4;
        if (p >= 1 && i === 3) Object.assign(l, { phase: "asleep", t: 0 });
      }
      if (l.phase === "asleep") {
        const breathe = 1 + 0.025 * (1 + Math.sin(l.t * 1.8)) / 2;
        place(s.llama, restX, top, ` scaleY(${breathe.toFixed(4)})`);
        frame(s.llama, "llama_sleep", 3, 4, LLAMA.w, LLAMA.h);
        bx = perchX;
        by = perchY - (breathe - 1) * (LLAMA.floor - LLAMA.backY) * S;
        bi = l.t % 10 > 6 ? 5 : 4;
      }
      place(s.bird, bx, by, flip ? " scaleX(-1)" : "");
      frame(s.bird, "bird", bi, 6, BIRD.w, BIRD.h);
      // she keeps to the left of them
      stroll(s, dt, W, HALF + 6, restX - HALF);
    },

    // a wardrobe drops in on the right; she tries on the three outfits from the films, now and again
    lookbook(s, dt, W, H) {
      const her = s.her;
      if (!s.ward) {
        s.ward = sprite(s.layer, "pb-prop pb-ward", WARD.w, WARD.h);
        // falls from the top of the screen
        s.w = { y: H - innerHeight, vy: 0, landed: false, squash: 0 };
        s.phase = "wait";
      }
      const w = s.w;
      const cx = W - 4 - (WARD.w / 2) * S;
      if (!w.landed) {
        w.vy += WARD.gravity * S * dt;
        w.y += w.vy * dt;
        if (w.y >= H) {
          w.y = H;
          w.squash = 0.18;
          if (w.vy > 900 * S) w.vy = -w.vy * 0.2;
          else { w.vy = 0; w.landed = true; }
        }
      }
      w.squash = Math.max(0, w.squash - dt);
      const sq = w.squash > 0 ? 1 - 0.5 * w.squash : 1;
      let open = 0, shake = 0;
      if (s.phase === "wait") {
        stroll(s, dt, W, HALF + 6, cx - (WARD.w / 2) * S - HALF);
        if (w.landed && (s.next = (s.next ?? 1.5) - dt) <= 0 && !her.state) s.phase = "go";
      } else if (s.phase === "go") {
        if (her.walk(dt, cx, true)) { s.phase = "change"; s.t = 0; }
      } else {
        let t = s.t, k = 0;
        while (k < CHANGE.length && t >= CHANGE[k][0]) t -= CHANGE[k++][0];
        if (k >= CHANGE.length) {
          // step back out to the left and loiter until the next try-on
          her.node.style.visibility = "";
          Object.assign(s, { phase: "wait", next: 12 + Math.random() * 6, goal: cx - (WARD.w / 2) * S - HALF - 10, wait: null });
        } else {
          const [, o, sh, look] = CHANGE[k];
          open = o;
          shake = sh ? 2.5 * Math.sin(s.t * 38) : 0;
          her.x = cx;
          her.node.style.visibility = look ? "" : "hidden";
          if (look) her.show(look[0], look[1], look[2]);
        }
      }
      place(s.ward, cx - (WARD.w / 2) * S, w.y - WARD.floor * S,
        (shake ? ` rotate(${shake.toFixed(2)}deg)` : "") + (sq !== 1 ? ` scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})` : ""));
      frame(s.ward, "wardrobe", open, 2, WARD.w, WARD.h);
    },

    // she walks in, pulls on the project's hoodie and sits on the bottom edge swinging her legs
    character(s, dt, W, H) {
      const her = s.her;
      if (!s.phase) s.phase = "go";
      if (s.phase === "go") {
        if (her.walk(dt, W * 0.3)) { s.phase = "dress"; s.t = -0.3; }
        return;
      }
      if (s.phase === "dress") {
        if (s.t < 0) return her.show("poses", 0, POSES.length);
        let t = s.t, i = 0;
        while (i < DRESS.length - 1 && t >= DRESS[i]) t -= DRESS[i++];
        if (i === DRESS.length - 1 && t >= DRESS[i]) { s.phase = "sit"; s.t = 0; }
        else return her.show("hoodie_on", i, DRESS.length);
      }
      her.y = H + LEGS;
      const swing = s.t % 5;
      her.show("sit_hoodie", swing < 2 ? Math.floor(swing * 4) % 4 : 0, 4);
    },
  };

  function tickStage(dt) {
    const s = stage;
    if (!s.sheet.isConnected) { stage = null; return; }
    s.t += dt;
    const W = s.layer.clientWidth, H = s.layer.clientHeight;
    s.her.y = H;
    if (s.her.hopping(dt)) return s.her.draw();
    const scene = SCENES[s.id];
    if (scene) scene(s, dt, W, H);
    else stroll(s, dt, W);
    s.her.draw();
  }

  // tap her and she jumps
  addEventListener("pointerdown", (e) => {
    if (!phoneQuery.matches) return;
    const her = stage ? stage.her : home;
    if (her.node.style.visibility !== "hidden" && !her.state && her.hits(e.clientX, e.clientY)) {
      if (stage && SCENES[stage.id] && stage.id !== "llama-mavka") return;
      her.jump();
    }
  }, { passive: true });

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (phoneQuery.matches) {
      if (stage) tickStage(dt);
      if (!stage) tickHome(dt);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
