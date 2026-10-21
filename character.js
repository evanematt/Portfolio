/* Pixel character that walks along the bottom of the screen after the cursor.
   Sprite sheets are single rows of 176×256 frames with the feet on row 250. */
(() => {
  "use strict";

  // Only for a mouse or trackpad; touch screens have no cursor to follow.
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const DIR = "assets/character/";
  const FW = 176, FH = 256, GROUND = 250;
  const SCALE = 0.5;
  const ANIM = {
    walk: { frames: 8, fps: 9 },
    run: { frames: 4, fps: 10 },
    jump: { frames: 8, fps: 12 },
  };
  // Order of frames in poses.png
  const POSES = ["stand", "arms_crossed", "hands_on_hips", "hand_in_pocket", "wave", "back_hands_on_hips",
    "hand_on_head", "shrug", "arms_crossed_2", "hand_on_hip", "crouch_point", "peace"];
  // hand_in_pocket is left out: its sheet frame has a patch of white background between the legs
  const IDLE_POSES = ["arms_crossed", "hands_on_hips", "wave", "hand_on_head", "shrug", "hand_on_hip", "peace"];

  const NEAR = 14;        // px from the cursor where she stops
  const RUN_FROM = 320;   // px from the cursor where she starts running
  const WALK_SPEED = 95;  // px per second
  const RUN_SPEED = 290;

  const el = document.createElement("div");
  el.className = "buddy";
  el.setAttribute("aria-hidden", "true");
  el.style.width = FW * SCALE + "px";
  el.style.height = FH * SCALE + "px";
  el.style.bottom = -(FH - GROUND) * SCALE + "px";
  document.body.appendChild(el);

  // Warm the cache so switching animations doesn't flash.
  for (const f of ["walk_right", "walk_left", "run_right", "run_left", "jump_right", "jump_left", "poses"]) new Image().src = DIR + f + ".png";

  let x = innerWidth * 0.82;
  let target = x;
  let facing = "left";
  let state = "";          // walk | run | jump | idle
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

  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") target = e.clientX; }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { target = x; });
  // A click while she's standing makes her jump.
  addEventListener("pointerdown", () => { if (state === "idle") setState("jump"); }, { passive: true });
  addEventListener("resize", () => { x = Math.min(x, innerWidth); });

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const half = (FW * SCALE) / 2;
    const goal = Math.min(innerWidth - half, Math.max(half, target));
    const dx = goal - x;
    const dist = Math.abs(dx);

    if (state !== "jump") {
      if (dist <= NEAR) setState("idle");
      else setState(dist > RUN_FROM || (state === "run" && dist > RUN_FROM / 3) ? "run" : "walk");
    }

    if (state === "walk" || state === "run") {
      facing = dx > 0 ? "right" : "left";
      const step = (state === "run" ? RUN_SPEED : WALK_SPEED) * dt;
      x += Math.sign(dx) * Math.min(step, dist);
    }

    if (state === "idle") {
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
    } else {
      const a = ANIM[state];
      frameTime += dt;
      while (frameTime >= 1 / a.fps) {
        frameTime -= 1 / a.fps;
        frame++;
        if (state === "jump" && frame >= a.frames) { setState("idle"); break; }
        frame %= a.frames;
      }
      if (state !== "idle") show(`${state}_${facing}`, frame, a.frames);
    }

    el.style.transform = `translateX(${Math.round(x - half)}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
