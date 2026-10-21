(() => {
  const SITE = window.SITE || {};
  const PROJECTS = window.PROJECTS || [];
  const STORE_KEY = "desktop-positions-v4";
  const PLACEHOLDER_COLORS = ["#f2603c", "#3fa7f5", "#9b5de5", "#f9b52b", "#2ec4b6", "#ef476f", "#118ab2", "#8d99ae"];

  const desktop = document.getElementById("desktop");
  const windowsEl = document.getElementById("windows");
  const isMobile = () => window.matchMedia("(max-width: 640px)").matches;

  // ---------- site info ----------
  document.title = SITE.name || "Portfolio";
  document.getElementById("siteName").textContent = SITE.name || "Portfolio";
  for (const id of ["igLink", "dockIg"]) document.getElementById(id).href = SITE.instagram || "#";
  for (const id of ["mailLink", "dockMail"]) document.getElementById(id).href = SITE.email ? `mailto:${SITE.email}` : "#";

  if (SITE.portrait) {
    const probe = new Image();
    probe.onload = () => {
      const wp = document.getElementById("wallpaper");
      wp.style.backgroundImage = `url("${SITE.portrait}")`;
      wp.classList.add("has-photo");
    };
    probe.src = SITE.portrait;
  }

  // ---------- clock ----------
  const clock = document.getElementById("clock");
  const tick = () => {
    const d = new Date();
    clock.textContent =
      d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) + "  " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  tick();
  setInterval(tick, 1000);

  // ---------- images ----------
  const path = (p, file) => `projects/${p.id}/${file}`;

  function placeholder(p, i = 0) {
    const el = document.createElement("div");
    el.className = "placeholder";
    el.style.background = PLACEHOLDER_COLORS[(PROJECTS.indexOf(p) + i) % PLACEHOLDER_COLORS.length];
    el.textContent = p.title.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
    return el;
  }

  // Tries each source in turn, falls back to a coloured placeholder.
  function image(p, sources, i = 0) {
    const img = document.createElement("img");
    img.alt = p.title;
    img.loading = "lazy";
    img.draggable = false;
    let n = 0;
    img.onerror = () => {
      n += 1;
      if (n < sources.length) img.src = sources[n];
      else img.replaceWith(placeholder(p, i));
    };
    img.src = sources[0];
    return img;
  }

  const isVideo = (f) => /\.(mp4|webm|mov)$/i.test(f);
  const poster = (f) => f.replace(/\.[^.]+$/, ".jpg");

  // Videos play muted while on screen and pause when scrolled away or hidden.
  const videoObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }
  }, { threshold: 0.25 });

  function video(p, file, i = 0) {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, playsInline: true, controls: true, preload: "none" });
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.poster = path(p, poster(file));
    v.src = path(p, file);
    v.onerror = () => v.replaceWith(placeholder(p, i));
    videoObserver.observe(v);
    return v;
  }

  const media = (p, file, i) => (isVideo(file) ? video(p, file, i) : image(p, [path(p, file)], i));

  const coverSources = (p) => [path(p, p.cover || "cover.jpg"), ...(p.images || []).slice(0, 1).map((f) => path(p, isVideo(f) ? poster(f) : f))];

  // Small previews tucked inside the folder; they rise out of it on hover.
  function peeks(p) {
    const box = document.createElement("div");
    box.className = "peeks";
    const n = Math.min(3, (p.images || []).length);
    for (let i = 1; i <= n; i++) {
      const img = document.createElement("img");
      img.className = "peek";
      img.alt = "";
      img.draggable = false;
      img.onerror = () => img.remove();
      img.src = path(p, `peek-${i}.jpg`);
      box.appendChild(img);
    }
    return box;
  }

  // ---------- positions ----------
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { saved = {}; }
  const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch {} };

  // Scatter around the centre (golden-angle spiral) like the reference.
  function autoPosition(i, total) {
    if (isMobile()) {
      const cols = 4;
      const r = Math.floor(i / cols), c = i % cols;
      return { x: 12.5 + c * 25, y: 9 + r * 14 };
    }
    const angle = i * 2.39996;
    const radius = 0.18 + 0.82 * Math.sqrt((i + 0.5) / total);
    const jitter = ((i * 37) % 11) / 11 - 0.5;
    return {
      x: 50 + Math.cos(angle) * radius * 36 + jitter * 3,
      y: 46 + Math.sin(angle) * radius * 34 + jitter * 3,
    };
  }

  function positionFor(p, i) {
    if (!isMobile() && saved[p.id]) return saved[p.id];
    if (!isMobile() && p.x != null && p.y != null) return { x: p.x, y: p.y };
    return autoPosition(i, PROJECTS.length);
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- desktop icons ----------
  function renderIcons() {
    desktop.innerHTML = "";
    PROJECTS.forEach((p, i) => {
      const el = document.createElement("button");
      el.className = "icon";
      el.style.animationDelay = `${i * 35}ms`;
      el.setAttribute("aria-label", `Open ${p.title}`);
      const pos = positionFor(p, i);
      el.style.left = pos.x + "%";
      el.style.top = pos.y + "%";

      const thumb = document.createElement("div");
      thumb.className = "folder";
      // back of the folder, the previews, then a copy of the art clipped to the front panel,
      // so the previews look like they come out of the folder rather than from behind it
      const front = document.createElement("img");
      Object.assign(front, { className: "front", alt: "", draggable: false, onerror: () => front.remove() });
      front.src = path(p, p.folder || "folder.png");
      if (p.lip != null) thumb.style.setProperty("--lip", p.lip + "%");
      thumb.append(Object.assign(image(p, [path(p, p.folder || "folder.png"), ...coverSources(p)]), { className: "art" }), peeks(p), front);
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = p.title;
      el.append(thumb, label);

      makeIconDraggable(el, p);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") openProject(p); });
      desktop.appendChild(el);
    });
  }

  function makeIconDraggable(el, p) {
    let start = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      el.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY, moved: false };
      document.querySelectorAll(".icon.selected").forEach((n) => n.classList.remove("selected"));
      el.classList.add("selected");
    });
    el.addEventListener("pointermove", (e) => {
      if (!start) return;
      if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
      start.moved = true;
      el.classList.add("dragging");
      const r = desktop.getBoundingClientRect();
      const x = clamp(((e.clientX - r.left) / r.width) * 100, 3, 97);
      const y = clamp(((e.clientY - r.top) / r.height) * 100, 4, 90);
      el.style.left = x + "%";
      el.style.top = y + "%";
      el.style.animation = "none";
      saved[p.id] = { x, y };
    });
    const end = () => {
      if (!start) return;
      el.classList.remove("dragging");
      if (start.moved) persist();
      else openProject(p);
      start = null;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", () => { el.classList.remove("dragging"); start = null; });
  }

  desktop.addEventListener("pointerdown", (e) => {
    if (e.target === desktop) document.querySelectorAll(".icon.selected").forEach((n) => n.classList.remove("selected"));
  });

  // ---------- windows ----------
  let z = 100;
  let cascade = 0;
  const openWindows = new Map();

  function createWindow(key, title, body, { small = false } = {}) {
    if (openWindows.has(key)) {
      const w = openWindows.get(key);
      w.style.zIndex = ++z;
      return w;
    }
    const w = document.createElement("section");
    w.className = "window" + (small ? " small" : "");
    w.setAttribute("role", "dialog");
    w.setAttribute("aria-label", title);
    w.style.zIndex = ++z;
    w.innerHTML = `
      <div class="titlebar">
        <div class="lights">
          <button class="light close" aria-label="Close"></button>
          <span class="light min"></span>
          <span class="light max"></span>
        </div>
        <span class="wtitle"></span>
      </div>
      <div class="wbody"></div>`;
    w.querySelector(".wtitle").textContent = title;
    w.querySelector(".wbody").appendChild(body);
    windowsEl.appendChild(w);

    const width = w.offsetWidth;
    const offset = (cascade++ % 6) * 26;
    w.style.left = clamp((innerWidth - width) / 2 + offset - 60, 8, innerWidth - width - 8) + "px";
    // leave room above the window for the walking character to stand on it (set by character.js)
    const headroom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--buddy-headroom")) || 0;
    const top = clamp(Math.max(innerHeight * 0.1, headroom) + offset, 36, innerHeight - 160);
    w.style.top = top + "px";
    if (headroom) w.style.maxHeight = `min(78vh, 760px, ${innerHeight - top - 16}px)`;

    w.addEventListener("pointerdown", () => { w.style.zIndex = ++z; });
    w.querySelector(".close").addEventListener("click", () => closeWindow(key));
    makeWindowDraggable(w);
    openWindows.set(key, w);
    return w;
  }

  function closeWindow(key) {
    const w = openWindows.get(key);
    if (!w) return;
    openWindows.delete(key);
    w.classList.add("closing");
    w.addEventListener("animationend", () => w.remove(), { once: true });
  }

  function makeWindowDraggable(w) {
    const bar = w.querySelector(".titlebar");
    let start = null;
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".light") || isMobile()) return;
      bar.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY, left: w.offsetLeft, top: w.offsetTop };
    });
    bar.addEventListener("pointermove", (e) => {
      if (!start) return;
      w.style.left = clamp(start.left + e.clientX - start.x, 40 - w.offsetWidth, innerWidth - 40) + "px";
      w.style.top = clamp(start.top + e.clientY - start.y, 28, innerHeight - 40) + "px";
    });
    const end = () => { start = null; };
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
  }

  function openProject(p) {
    const body = document.createElement("div");
    const meta = document.createElement("div");
    meta.className = "wmeta";
    for (const t of [p.year, p.tags]) if (t) meta.appendChild(Object.assign(document.createElement("span"), { textContent: t }));
    const h = Object.assign(document.createElement("h2"), { textContent: p.title });
    const d = Object.assign(document.createElement("p"), { textContent: p.description || "" });
    const gallery = document.createElement("div");
    gallery.className = "gallery";
    const files = p.images && p.images.length ? p.images : [p.cover || "cover.jpg"];
    files.forEach((f, i) => gallery.appendChild(media(p, f, i)));
    body.append(meta, h, d, gallery);
    createWindow("p:" + p.id, p.title, body);
  }

  function openAbout() {
    const body = document.createElement("div");
    body.append(
      Object.assign(document.createElement("h2"), { textContent: SITE.name || "About" }),
      Object.assign(document.createElement("p"), { textContent: SITE.about || "" }),
    );
    if (SITE.email) {
      const a = Object.assign(document.createElement("a"), { href: `mailto:${SITE.email}`, textContent: SITE.email });
      a.style.cssText = "color:#2d6cdf;font-size:14px";
      body.appendChild(a);
    }
    createWindow("about", "About Me.txt", body, { small: true });
  }

  function openAll() {
    const body = document.createElement("div");
    body.className = "finder";
    PROJECTS.forEach((p) => {
      const b = document.createElement("button");
      const t = document.createElement("div");
      t.className = "thumb";
      t.appendChild(image(p, coverSources(p)));
      b.append(t, Object.assign(document.createElement("span"), { textContent: p.title }));
      b.addEventListener("click", () => openProject(p));
      body.appendChild(b);
    });
    createWindow("all", "Projects", body);
  }

  function tidyUp() {
    saved = {};
    persist();
    renderIcons();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open]");
    if (!t) return;
    const what = t.dataset.open;
    if (what === "about") openAbout();
    else if (what === "all") openAll();
    else if (what === "arrange") tidyUp();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    let top = null;
    for (const [k, w] of openWindows) if (!top || +w.style.zIndex > +openWindows.get(top).style.zIndex) top = k;
    if (top) closeWindow(top);
  });

  let lastMobile = isMobile();
  addEventListener("resize", () => {
    if (isMobile() !== lastMobile) { lastMobile = isMobile(); renderIcons(); }
  });

  renderIcons();
})();
