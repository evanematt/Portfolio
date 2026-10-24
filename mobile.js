// Phone layout: on narrow screens the desktop becomes a phone home screen.
// Each portfolio tab is a home screen page you swipe between, projects are folders of app icons,
// and opening one zooms it up to full screen like an app. styles.css only shows it at max-width 640px.
(() => {
  const SITE = window.SITE || {};
  const PROJECTS = window.PROJECTS || [];
  const EXTRAS = window.EXTRAS || [];
  const MODES = window.MODES && window.MODES.length ? window.MODES : [{ id: "main", title: "Portfolio" }];
  const { image, media, coverSources, modeOf, playAtSpeed, chapters } = window.PORTFOLIO;
  const phoneQuery = matchMedia("(max-width: 640px)");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const VERSION = (/mobile\.js\?v=([^"&]+)/.exec(document.documentElement.outerHTML) || [])[1] || "";

  const el = (tag, className, props) => Object.assign(document.createElement(tag), className ? { className } : {}, props);
  // the about text's first sentence; the rest describes the desktop (clicking, dragging icons)
  const intro = (SITE.about || "").split(/(?<=\.)\s/)[0];
  const modeIndex = () => Math.max(0, MODES.findIndex((m) => "#" + m.id === location.hash));

  const phone = el("div", "phone");
  const pages = el("div", "phone-pages");
  const pager = el("nav", "phone-pager", { ariaLabel: "Portfolio" });
  const dock = el("nav", "phone-dock", { ariaLabel: "Dock" });
  phone.append(pages, pager, dock);
  document.body.appendChild(phone);

  // ---------- clock widget ----------
  const clocks = [];
  const tick = () => {
    const d = new Date();
    for (const c of clocks) {
      c.date.textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
      c.time.textContent = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
  };

  function helloWidget() {
    const w = el("button", "widget widget-hello", { type: "button", ariaLabel: "About " + (SITE.name || "") });
    const top = el("span", "widget-top");
    top.append(el("img", "", { src: "assets/logo-mark.svg?v=" + VERSION, alt: "" }), el("span", "", { textContent: SITE.name || "Portfolio" }));
    const date = el("span", "widget-date");
    const time = el("span", "widget-time");
    clocks.push({ date, time });
    const about = el("span", "widget-about", { textContent: intro });
    w.append(top, date, time, about);
    w.addEventListener("click", () => openAbout(w));
    return w;
  }

  function modeWidget(m, empty) {
    const w = el("div", "widget widget-mode");
    w.append(el("strong", "", { textContent: m.title }));
    if (empty) w.append(el("span", "", { textContent: m.empty || "coming soon" }));
    return w;
  }

  // ---------- app icons ----------
  // a project is a folder: a frosted tile with its cover and three previews inside
  function folderTile(p) {
    const tile = el("span", "app-tile folder-tile");
    const sources = [coverSources(p), ...[1, 2, 3].map((n) => [`projects/${p.id}/peek-${n}.jpg`])];
    sources.forEach((src, i) => {
      const cell = el("span", "mini");
      cell.appendChild(image(p, src, i));
      tile.appendChild(cell);
    });
    return tile;
  }

  function appTile(p) {
    const tile = el("span", "app-tile");
    tile.appendChild(el("img", "", { alt: "", draggable: false, src: p.icon || `https://i.ytimg.com/vi/${p.youtube}/mqdefault.jpg` }));
    return tile;
  }

  function appIcon(p, i) {
    const b = el("button", "app", { type: "button", ariaLabel: "Open " + p.title });
    b.style.animationDelay = `${i * 30}ms`;
    const tile = p.youtube ? appTile(p) : folderTile(p);
    b.append(tile, el("span", "app-label", { textContent: p.title }));
    b.addEventListener("click", () => (p.youtube ? openVideo(p, tile) : openProject(p, tile)));
    return b;
  }

  // ---------- home screen pages, one per portfolio tab ----------
  MODES.forEach((m, mi) => {
    const items = [...PROJECTS, ...EXTRAS].filter((p) => modeOf(p) === m.id);
    const page = el("section", "phone-page", { ariaLabel: m.title });
    const grid = el("div", "phone-grid");
    grid.appendChild(mi === 0 ? helloWidget() : modeWidget(m, !items.length));
    items.forEach((p, i) => grid.appendChild(appIcon(p, i)));
    page.appendChild(grid);
    pages.appendChild(page);

    const b = el("button", "", { type: "button", textContent: m.title });
    b.addEventListener("click", () => goTo(mi));
    pager.appendChild(b);
  });
  if (MODES.length < 2) pager.remove();
  tick();
  setInterval(tick, 1000);

  let current = -1;
  function markPage(i) {
    if (i === current) return;
    current = i;
    [...pager.children].forEach((b, j) => b.setAttribute("aria-pressed", j === i));
  }
  function goTo(i, smooth = true) {
    pages.scrollTo({ left: i * pages.clientWidth, behavior: smooth && !reduceMotion.matches ? "smooth" : "auto" });
    markPage(i);
  }

  // after a swipe settles, the page becomes the open tab, and app.js follows it through the hash
  let settle;
  pages.addEventListener("scroll", () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const i = Math.round(pages.scrollLeft / pages.clientWidth);
      markPage(i);
      if (i === modeIndex()) return;
      history.replaceState(null, "", i === 0 ? location.pathname + location.search : "#" + MODES[i].id);
      dispatchEvent(new HashChangeEvent("hashchange"));
    }, 120);
  }, { passive: true });
  addEventListener("hashchange", () => { if (modeIndex() !== Math.round(pages.scrollLeft / pages.clientWidth)) goTo(modeIndex(), false); });
  addEventListener("resize", () => { pages.scrollLeft = current * pages.clientWidth; });

  // ---------- dock: the same apps as the desktop dock, minus Arrange ----------
  const dockApp = (source, label, action) => {
    // copy the desktop dock's icon, renaming gradient ids so they don't clash with the hidden originals
    const svg = document.querySelector(source + " svg").outerHTML.replace(/id="(\w+)"/g, 'id="$1-phone"').replace(/url\(#(\w+)\)/g, "url(#$1-phone)");
    const item = typeof action === "string"
      ? el("a", "phone-dock-item", { href: action, target: action.startsWith("mailto:") ? "" : "_blank", rel: "noopener" })
      : el("button", "phone-dock-item", { type: "button" });
    item.setAttribute("aria-label", label);
    item.innerHTML = svg;
    if (typeof action === "function") item.addEventListener("click", () => action(item));
    dock.appendChild(item);
  };
  dockApp('#dock [data-open="about"]', "About", (item) => openAbout(item));
  dockApp('#dock [data-open="all"]', "All projects", (item) => openAll(item));
  dockApp("#dockIg", "Instagram", SITE.instagram || "#");
  dockApp("#dockMail", "Mail", SITE.email ? `mailto:${SITE.email}` : "#");

  // ---------- apps: full-screen sheets that zoom out of the icon they were opened from ----------
  let sheet = null;
  const EASE = "cubic-bezier(.2, .9, .25, 1)";
  const insetOf = (r, round) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${round}px)`;

  function openSheet(from, { title, back = "Home", theme = "" }, content) {
    if (sheet) closeSheet(true);
    const s = el("section", "sheet" + (theme ? " sheet-" + theme : ""), { role: "dialog", ariaLabel: title });
    const nav = el("header", "sheet-nav");
    const backBtn = el("button", "sheet-back", { type: "button", innerHTML: `<svg viewBox="0 0 12 20" aria-hidden="true"><path d="M10 2 2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` });
    backBtn.append(back);
    nav.append(backBtn, el("span", "sheet-title", { textContent: title }));
    const scroll = el("div", "sheet-scroll");
    scroll.appendChild(content);
    const home = el("button", "home-bar", { type: "button", ariaLabel: "Close" });
    s.append(nav, scroll, home);
    document.body.appendChild(s);
    sheet = { el: s, from };

    backBtn.addEventListener("click", () => closeSheet());
    home.addEventListener("click", () => closeSheet());
    scroll.addEventListener("scroll", () => s.classList.toggle("scrolled", scroll.scrollTop > 40), { passive: true });
    pullToClose(s, scroll);

    phone.classList.add("behind");
    if (!reduceMotion.matches) {
      const r = from.getBoundingClientRect();
      s.animate([{ clipPath: insetOf(r, 16) }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }], { duration: 440, easing: EASE });
      scroll.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
    }
    return s;
  }

  function closeSheet(instant = false) {
    if (!sheet) return;
    const { el: s, from } = sheet;
    sheet = null;
    phone.classList.remove("behind");
    s.querySelectorAll("video").forEach((v) => v.pause());
    if (instant || reduceMotion.matches) return s.remove();
    s.style.pointerEvents = "none";
    const r = from.isConnected && from.getBoundingClientRect();
    const end = r && r.width ? insetOf(r, 16) : `inset(${innerHeight / 2}px ${innerWidth / 2}px round 24px)`;
    // start from wherever a pull-down left it
    const start = s.style.transform || "none";
    s.animate([{ clipPath: "inset(0px 0px 0px 0px round 38px)", transform: start, opacity: 1 }, { clipPath: end, transform: "none", opacity: 0.4 }],
      { duration: 380, easing: EASE }).finished.then(() => s.remove());
  }

  // pull down from the top of an app, or swipe up from the home bar, to go back home
  function pullToClose(s, scroll) {
    let y0 = null, dy = 0;
    s.addEventListener("touchstart", (e) => {
      const fromBar = e.target.closest(".home-bar");
      y0 = scroll.scrollTop <= 0 || fromBar ? e.touches[0].clientY : null;
      dy = 0;
      s.dataset.pull = fromBar ? "up" : "down";
    }, { passive: true });
    s.addEventListener("touchmove", (e) => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      // only the matching direction moves the app; anything else is ordinary scrolling
      if (s.dataset.pull === "up" ? dy >= 0 : dy <= 0) { dy = 0; s.style.transform = ""; return; }
      e.preventDefault();
      const k = Math.min(1, Math.abs(dy) / 400);
      s.style.transform = `translateY(${dy * 0.5}px) scale(${1 - k * 0.12})`;
      s.style.borderRadius = `${Math.min(38, Math.abs(dy) / 3)}px`;
    }, { passive: false });
    s.addEventListener("touchend", () => {
      if (y0 == null) return;
      y0 = null;
      if (Math.abs(dy) > 100) return closeSheet();
      s.animate([{ transform: s.style.transform }, { transform: "none" }], { duration: 220, easing: EASE });
      s.style.transform = "";
      s.style.borderRadius = "";
    });
  }

  function openProject(p, from) {
    const body = el("div", "app-page");
    const head = el("div", "app-head");
    const icon = el("span", "app-head-icon");
    icon.appendChild(image(p, coverSources(p)));
    const info = el("div");
    info.append(el("h1", "", { textContent: p.title }), el("span", "app-head-meta", { textContent: [p.tags, p.year].filter(Boolean).join(" · ") }));
    head.append(icon, info);
    body.append(head, el("p", "app-desc", { textContent: p.description || "" }));
    // its sections between the pictures, as chapters of a case study
    for (const c of chapters(p)) {
      if (c.sec) {
        const text = el("section", "app-section");
        const label = el("h2");
        label.append(el("span", "", { textContent: String(c.n).padStart(2, "0") }), c.sec.title);
        text.append(label, el("p", "", { textContent: c.sec.text }));
        body.appendChild(text);
      }
      if (!c.files.length) continue;
      const gallery = el("div", "gallery");
      for (const [f, i] of c.files) gallery.appendChild(media(p, f, i));
      body.appendChild(gallery);
    }
    const s = openSheet(from, { title: p.title }, body);
    // phone-buddy.js plays the project's character scene along the bottom
    document.dispatchEvent(new CustomEvent("phone:project", { detail: { sheet: s, id: p.id } }));
  }

  function openVideo(p, from) {
    const body = el("div", "app-video");
    const frame = el("iframe", "player", { title: p.title, allowFullscreen: true, allow: "autoplay; encrypted-media; picture-in-picture; fullscreen" });
    const api = p.speed ? `&enablejsapi=1&origin=${encodeURIComponent(location.origin)}` : "";
    frame.src = `https://www.youtube-nocookie.com/embed/${p.youtube}?autoplay=1&rel=0&playsinline=1${api}`;
    body.append(frame, el("h1", "", { textContent: p.title }));
    // `game: "blocks"` puts a block puzzle under the video (blockblast.js)
    if (p.game === "blocks" && window.BlockBlast) {
      body.classList.add("with-game");
      window.BlockBlast(body);
    }
    openSheet(from, { title: p.title, theme: "video" }, body);
    if (p.speed) playAtSpeed(frame, p.speed);
  }

  // About opens as a note
  function openAbout(from) {
    const body = el("div", "note");
    const d = new Date();
    body.append(
      el("span", "note-date", { textContent: d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) + " at " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) }),
      el("h1", "", { textContent: SITE.name || "About" }),
      el("p", "", { textContent: intro }),
      el("p", "", { textContent: "Tap a folder to open a project, and swipe between pages for the other portfolios." }),
    );
    const links = el("p", "note-links");
    if (SITE.email) links.append(el("a", "", { href: `mailto:${SITE.email}`, textContent: SITE.email }));
    if (SITE.instagram) links.append(el("a", "", { href: SITE.instagram, target: "_blank", rel: "noopener", textContent: "Instagram" }));
    body.append(links);
    openSheet(from, { title: "About Me", back: "Notes", theme: "notes" }, body);
  }

  // All projects open as a photo library: every cover in a square grid
  function openAll(from) {
    const body = el("div", "library");
    body.append(el("h1", "", { textContent: "Library" }), el("span", "library-count", { textContent: `${PROJECTS.length} projects` }));
    const grid = el("div", "library-grid");
    for (const p of PROJECTS) {
      const b = el("button", "", { type: "button", ariaLabel: "Open " + p.title });
      b.append(image(p, coverSources(p)), el("span", "", { textContent: p.title }));
      b.addEventListener("click", () => {
        const home = sheet && sheet.from;
        openProject(p, b);
        // going back from the project lands on the home screen, so shrink into the dock icon
        if (sheet) sheet.from = home || b;
      });
      grid.appendChild(b);
    }
    body.appendChild(grid);
    openSheet(from, { title: "Library", back: "Home", theme: "photos" }, body);
  }

  addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  // leaving the phone width (rotating, resizing) drops back to the desktop with no app open
  phoneQuery.addEventListener("change", (e) => {
    if (!e.matches) closeSheet(true);
    else requestAnimationFrame(() => goTo(modeIndex(), false));
  });

  // ---------- a notification that drops in once per visit ----------
  function hello() {
    let seen = false;
    try { seen = sessionStorage.getItem("phone-hello") === "1"; sessionStorage.setItem("phone-hello", "1"); } catch {}
    if (seen || !phoneQuery.matches) return;
    const n = el("button", "banner", { type: "button" });
    const text = el("span", "banner-text");
    const head = el("span", "banner-head");
    head.append(el("strong", "", { textContent: SITE.name || "Portfolio" }), el("span", "", { textContent: "now" }));
    text.append(head, el("span", "", { textContent: "Hi! Tap a folder to open a project. Swipe for more." }));
    n.append(el("img", "", { src: "assets/favicon.svg?v=" + VERSION, alt: "" }), text);
    phone.appendChild(n);
    requestAnimationFrame(() => n.classList.add("show"));
    const hide = () => { n.classList.remove("show"); setTimeout(() => n.remove(), 400); };
    n.addEventListener("click", () => { hide(); openAbout(dock.firstChild); });
    setTimeout(hide, 5500);
  }

  requestAnimationFrame(() => goTo(modeIndex(), false));
  setTimeout(hello, 1200);
})();
